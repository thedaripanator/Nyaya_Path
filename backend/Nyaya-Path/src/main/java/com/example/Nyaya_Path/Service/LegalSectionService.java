package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Entity.LegalSection;
import com.example.Nyaya_Path.Entity.OffenceClassification;
import com.example.Nyaya_Path.Repository.LegalSectionRepository;
import com.example.Nyaya_Path.Repository.OffenceClassificationRepository;
import com.example.Nyaya_Path.dto.BnsSectionDetailsResponse;
import com.example.Nyaya_Path.dto.LegalSectionPageResponse;
import com.example.Nyaya_Path.dto.TranslatedClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LegalSectionService {

    private final LegalSectionRepository repository;
    private final OffenceClassificationRepository classificationRepository;
    private final TranslationCacheService translationCacheService;
    private final LanguageService languageService;

    public LegalSectionService(
            LegalSectionRepository repository,
            OffenceClassificationRepository repository1,
            TranslationCacheService translationCacheService,
            LanguageService languageService) {
        this.repository = repository;
        this.classificationRepository=repository1;
        this.translationCacheService = translationCacheService;
        this.languageService = languageService;
    }


    // Get all sections of BNS or BNSS
    public List<LegalSection> getSectionsByAct(String act) {
        validateAct(act);
        return repository.findByAct(normalizeAct(act));
    }

    // Get a specific section
    public LegalSection getSection(String act, String sectionNumber) {
        validateAct(act);

        return repository.findByActAndSectionNumber(
                normalizeAct(act),
                sectionNumber
        ).orElseThrow(() ->
                new RuntimeException("Section not found")
        );
    }

    // Search sections by title
    public List<LegalSection> searchSections(String act, String keyword) {
        validateAct(act);

        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException("Search keyword is required");
        }

        return repository.findByActAndSectionTitleContainingIgnoreCase(
                normalizeAct(act),
                keyword.trim()
        );
    }

    private void validateAct(String act) {
        if (act == null ||
                !(act.equalsIgnoreCase("BNS") ||
                        act.equalsIgnoreCase("BNSS"))) {
            throw new IllegalArgumentException(
                    "Act must be BNS or BNSS"
            );
        }
    }

    private String normalizeAct(String act) {
        return act.equalsIgnoreCase("BNS") ? "BNS 2023" : "BNSS 2023";
    }
    public BnsSectionDetailsResponse getSectionDetails(Long id) {
        return getSectionDetails(id, "en");
    }

    public BnsSectionDetailsResponse getSectionDetails(Long id, String requestedLanguage) {
        LegalSection section = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Section not found"));
        List<OffenceClassification> classifications =
                section.getAct().equalsIgnoreCase("BNS 2023")
                ? classificationRepository
                        .findByBnsSectionNumberOrderByIdAsc(section.getSectionNumber())
                : List.of();

        String language = languageService.requireSupported(requestedLanguage);
        List<String> sourceTexts = new ArrayList<>(3 + classifications.size() * 2);
        sourceTexts.add(section.getSectionTitle());
        sourceTexts.add(section.getChapter());
        sourceTexts.add(section.getOriginalText());
        classifications.forEach(item -> {
            sourceTexts.add(item.getOffenceDescription());
            sourceTexts.add(item.getPunishment());
        });
        TranslationCacheService.CacheLookup batch =
                translationCacheService.lookupCached(sourceTexts, language);
        if (!batch.missingTexts().isEmpty()) {
            translationCacheService.warmCache(batch.missingTexts(), language);
        }
        List<String> translated = batch.translations();
        List<TranslatedClassification> translatedClassifications = new ArrayList<>();
        for (int i = 0; i < classifications.size(); i++) {
            OffenceClassification item = classifications.get(i);
            translatedClassifications.add(new TranslatedClassification(
                    item.getId(),
                    translated.get(3 + i * 2),
                    translated.get(4 + i * 2)
            ));
        }

        return new BnsSectionDetailsResponse(
                section,
                classifications,
                translated.get(0),
                translated.get(1),
                translated.get(2),
                translatedClassifications,
                batch.language(),
                batch.status()
        );
    }

    public LegalSectionPageResponse getSectionsPage(
            String act,
            int page,
            int size,
            String requestedLanguage,
            String search) {
        if (act == null || (!act.equalsIgnoreCase("All")
                && !act.equalsIgnoreCase("BNS")
                && !act.equalsIgnoreCase("BNSS"))) {
            throw new IllegalArgumentException("Act must be All, BNS or BNSS");
        }
        if (page < 0 || size < 1 || size > 50) {
            throw new IllegalArgumentException("Page must be non-negative and size must be between 1 and 50");
        }
        String language = languageService.requireSupported(requestedLanguage);
        PageRequest pageRequest = PageRequest.of(page, size);
        String normalizedAct = act.equalsIgnoreCase("All") ? null : normalizeAct(act);
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        Page<LegalSection> sectionPage = repository.searchPage(
                act,
                normalizedAct,
                normalizedSearch,
                pageRequest
        );

        List<String> sourceTexts = new ArrayList<>(sectionPage.getNumberOfElements() * 5);
        sectionPage.getContent().forEach(section -> {
            sourceTexts.add(canonicalActName(section.getAct()));
            sourceTexts.add(section.getSectionTitle());
            sourceTexts.add(section.getChapter());
            String originalText = section.getOriginalText();
            sourceTexts.add(contextDescription(originalText));
            sourceTexts.add(preview(originalText));
        });
        TranslationCacheService.CacheLookup batch =
                translationCacheService.lookupCached(sourceTexts, language);
        if (!batch.missingTexts().isEmpty()) {
            translationCacheService.warmCache(batch.missingTexts(), language);
        }
        List<LegalSectionPageResponse.LegalSectionListItem> content = new ArrayList<>();
        for (int i = 0; i < sectionPage.getContent().size(); i++) {
            LegalSection section = sectionPage.getContent().get(i);
            int translationIndex = i * 5;
            content.add(new LegalSectionPageResponse.LegalSectionListItem(
                    section.getId(),
                    section.getAct(),
                    section.getSectionNumber(),
                    section.getSectionTitle(),
                    section.getChapter(),
                    section.getOriginalText(),
                    batch.translations().get(translationIndex),
                    batch.translations().get(translationIndex + 1),
                    batch.translations().get(translationIndex + 2),
                    batch.translations().get(translationIndex + 3),
                    batch.translations().get(translationIndex + 4),
                    batch.status()
            ));
        }

        return new LegalSectionPageResponse(
                content,
                sectionPage.getNumber(),
                sectionPage.getSize(),
                sectionPage.getTotalElements(),
                sectionPage.getTotalPages(),
                batch.language(),
                batch.status()
        );
    }

    private String preview(String text) {
        if (text == null) {
            return null;
        }
        String withoutContext = text.replaceFirst("^\\s*\\[Context:.*?]\\s*", "");
        return withoutContext.length() <= 300 ? withoutContext : withoutContext.substring(0, 300);
    }

    private String contextDescription(String text) {
        if (text == null) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("^\\s*\\[Context:\\s*(.*?)]\\s*", java.util.regex.Pattern.DOTALL)
                .matcher(text);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private String canonicalActName(String act) {
        return act != null && act.toUpperCase(java.util.Locale.ROOT).startsWith("BNSS")
                ? "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)"
                : "Bharatiya Nyaya Sanhita, 2023 (BNS)";
    }
}