package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Client.FastApiClient;
import com.example.Nyaya_Path.dto.FastApiTranslationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.beans.factory.annotation.Qualifier;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

@Service
public class TranslationCacheService {

    private static final Logger logger = LoggerFactory.getLogger(TranslationCacheService.class);
    private static final String MODEL_VERSION = "qwen3-4b";
    private static final String PROMPT_VERSION = "legal-translation-v2";
    private static final long RETRY_DELAY_MILLIS = 5 * 60 * 1000L;

    private final JdbcTemplate jdbcTemplate;
    private final FastApiClient fastApiClient;
    private final LanguageService languageService;
    private final Executor translationExecutor;
    private final Set<String> translationsInProgress = ConcurrentHashMap.newKeySet();
    private final Map<String, Long> translationFailures = new ConcurrentHashMap<>();

    public TranslationCacheService(
            JdbcTemplate jdbcTemplate,
            FastApiClient fastApiClient,
            LanguageService languageService,
            @Qualifier("translationExecutor") Executor translationExecutor) {
        this.jdbcTemplate = jdbcTemplate;
        this.fastApiClient = fastApiClient;
        this.languageService = languageService;
        this.translationExecutor = translationExecutor;
    }

    public CacheLookup lookupCached(List<String> sourceTexts, String requestedLanguage) {
        String language = languageService.requireSupported(requestedLanguage);
        if ("en".equals(language)) {
            return new CacheLookup(
                    language,
                    "ORIGINAL",
                    sourceTexts.stream().map(text -> text == null ? "" : text).toList(),
                    List.of()
            );
        }

        List<String> keys = new ArrayList<>(sourceTexts.size());
        Map<String, String> uniqueSources = new LinkedHashMap<>();
        for (String source : sourceTexts) {
            if (source == null || source.isBlank()) {
                keys.add(null);
                continue;
            }
            String key = cacheKey(source, language);
            keys.add(key);
            uniqueSources.putIfAbsent(key, source);
        }

        Map<String, String> cachedTranslations = new HashMap<>();
        if (!uniqueSources.isEmpty()) {
            String placeholders = String.join(",", Collections.nCopies(uniqueSources.size(), "?"));
            jdbcTemplate.query(
                    "SELECT cache_key, translated_content FROM legal_translation_cache WHERE cache_key IN ("
                            + placeholders + ")",
                    (RowCallbackHandler) resultSet -> cachedTranslations.put(
                            resultSet.getString("cache_key"),
                            resultSet.getString("translated_content")
                    ),
                    uniqueSources.keySet().toArray()
            );
        }

        List<String> translations = new ArrayList<>(sourceTexts.size());
        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            String source = sourceTexts.get(i);
            translations.add(key == null
                    ? source == null ? "" : source
                    : cachedTranslations.getOrDefault(key, source));
        }
        List<String> missing = uniqueSources.entrySet().stream()
                .filter(entry -> !cachedTranslations.containsKey(entry.getKey()))
                .map(Map.Entry::getValue)
                .toList();
        boolean allMissingTranslationsCoolingDown = !missing.isEmpty()
                && uniqueSources.entrySet().stream()
                .filter(entry -> !cachedTranslations.containsKey(entry.getKey()))
                .allMatch(entry -> translationFailures.getOrDefault(entry.getKey(), 0L) > System.currentTimeMillis());
        return new CacheLookup(
                language,
                missing.isEmpty()
                        ? "MACHINE_TRANSLATED"
                        : allMissingTranslationsCoolingDown
                                ? "TRANSLATION_UNAVAILABLE"
                                : "TRANSLATION_PENDING",
                List.copyOf(translations),
                missing
        );
    }

    public void warmCache(List<String> sourceTexts, String requestedLanguage) {
        String language = languageService.requireSupported(requestedLanguage);
        if ("en".equals(language)) {
            return;
        }

        Map<String, String> claimed = new LinkedHashMap<>();
        for (String source : sourceTexts) {
            if (source == null || source.isBlank()) {
                continue;
            }
            String key = cacheKey(source, language);
            if (translationFailures.getOrDefault(key, 0L) > System.currentTimeMillis()) {
                continue;
            }
            if (translationsInProgress.add(key)) {
                claimed.putIfAbsent(key, source);
            }
        }
        if (claimed.isEmpty()) {
            return;
        }

        try {
            translationExecutor.execute(() -> {
                try {
                    TranslationBatch result = translate(new ArrayList<>(claimed.values()), language);
                    if ("FALLBACK_ORIGINAL".equals(result.status())) {
                        markRetryDelay(claimed.keySet());
                    } else {
                        claimed.keySet().forEach(translationFailures::remove);
                    }
                } catch (RuntimeException error) {
                    markRetryDelay(claimed.keySet());
                    logger.warn("Could not warm legal translations for language {}", language, error);
                } finally {
                    translationsInProgress.removeAll(claimed.keySet());
                }
            });
        } catch (RuntimeException error) {
            translationsInProgress.removeAll(claimed.keySet());
            throw error;
        }
    }

    private void markRetryDelay(Set<String> cacheKeys) {
        long retryAt = System.currentTimeMillis() + RETRY_DELAY_MILLIS;
        cacheKeys.forEach(key -> translationFailures.put(key, retryAt));
    }

    public TranslationBatch translate(List<String> sourceTexts, String requestedLanguage) {
        String language = languageService.requireSupported(requestedLanguage);
        if ("en".equals(language)) {
            return new TranslationBatch(
                    language,
                    "ORIGINAL",
                    sourceTexts.stream().map(text -> text == null ? "" : text).toList()
            );
        }

        List<String> translations = new ArrayList<>(Collections.nCopies(sourceTexts.size(), null));
        Map<String, String> missing = new LinkedHashMap<>();
        List<String> keys = new ArrayList<>(sourceTexts.size());

        for (String source : sourceTexts) {
            if (source == null || source.isBlank()) {
                keys.add(null);
                continue;
            }
            String sourceHash = sha256(source);
            String key = cacheKeyFromHash(sourceHash, language);
            keys.add(key);
            missing.putIfAbsent(key, source);
        }

        List<String> lookupKeys = keys.stream().filter(key -> key != null).distinct().toList();
        Map<String, String> cachedTranslations = new HashMap<>();
        if (!lookupKeys.isEmpty()) {
            String placeholders = String.join(",", Collections.nCopies(lookupKeys.size(), "?"));
            jdbcTemplate.query(
                    "SELECT cache_key, translated_content FROM legal_translation_cache WHERE cache_key IN ("
                            + placeholders + ")",
                    (RowCallbackHandler) resultSet -> cachedTranslations.put(
                            resultSet.getString("cache_key"),
                            resultSet.getString("translated_content")
                    ),
                    lookupKeys.toArray()
            );
        }
        missing.keySet().removeAll(cachedTranslations.keySet());
        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            if (key == null) {
                String source = sourceTexts.get(i);
                translations.set(i, source == null ? "" : source);
            } else if (cachedTranslations.containsKey(key)) {
                translations.set(i, cachedTranslations.get(key));
            }
        }

        if (!missing.isEmpty()) {
            List<Map.Entry<String, String>> entries = new ArrayList<>(missing.entrySet());
            Map<String, String> generatedByKey = new LinkedHashMap<>();
            try {
                for (int start = 0; start < entries.size();) {
                    int end = start;
                    int batchCharacters = 0;
                    List<String> batchTexts = new ArrayList<>();
                    while (end < entries.size() && batchTexts.size() < 30) {
                        String source = entries.get(end).getValue();
                        if (source.length() > 4000) {
                            throw new ResponseStatusException(
                                    HttpStatus.PAYLOAD_TOO_LARGE,
                                    "A legal text is too long to translate in one request"
                            );
                        }
                        if (!batchTexts.isEmpty() && batchCharacters + source.length() > 15000) {
                            break;
                        }
                        batchTexts.add(source);
                        batchCharacters += source.length();
                        end++;
                    }
                    FastApiTranslationResponse response = fastApiClient.translateBatch(
                            languageService.languageName(language),
                            batchTexts
                    );
                    if (response == null
                            || !languageService.languageName(language).equalsIgnoreCase(response.targetLanguage())
                            || response.translations() == null
                            || response.translations().size() != batchTexts.size()) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "Translation service returned an incomplete batch"
                        );
                    }
                    for (int i = 0; i < batchTexts.size(); i++) {
                        generatedByKey.put(entries.get(start + i).getKey(), response.translations().get(i));
                    }
                    List<Map.Entry<String, String>> completedBatch = entries.subList(start, end);
                    jdbcTemplate.batchUpdate(
                            """
                            INSERT INTO legal_translation_cache
                                (cache_key, source_hash, target_language, model_version, prompt_version, translated_content)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON CONFLICT (cache_key) DO NOTHING
                            """,
                            completedBatch,
                            completedBatch.size(),
                            (statement, entry) -> {
                                statement.setString(1, entry.getKey());
                                statement.setString(2, sha256(entry.getValue()));
                                statement.setString(3, language);
                                statement.setString(4, MODEL_VERSION);
                                statement.setString(5, PROMPT_VERSION);
                                statement.setString(6, generatedByKey.get(entry.getKey()));
                            }
                    );
                    start = end;
                }
            } catch (RestClientException error) {
                logger.warn("Translation service unavailable for language {}; showing original text", language);
                List<String> originals = sourceTexts.stream()
                        .map(text -> text == null ? "" : text)
                        .toList();
                return new TranslationBatch(language, "FALLBACK_ORIGINAL", originals);
            }

            for (int i = 0; i < keys.size(); i++) {
                String key = keys.get(i);
                if (key != null && missing.containsKey(key)) {
                    translations.set(i, generatedByKey.get(key));
                }
            }
        }

        return new TranslationBatch(language, "MACHINE_TRANSLATED", List.copyOf(translations));
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is unavailable", error);
        }
    }

    private String cacheKey(String source, String language) {
        return cacheKeyFromHash(sha256(source), language);
    }

    private String cacheKeyFromHash(String sourceHash, String language) {
        return sha256(sourceHash + ":" + language + ":" + MODEL_VERSION + ":" + PROMPT_VERSION);
    }

    public record CacheLookup(
            String language,
            String status,
            List<String> translations,
            List<String> missingTexts) {
    }

    public record TranslationBatch(String language, String status, List<String> translations) {
    }
}
