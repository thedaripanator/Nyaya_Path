
package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Client.FastApiClient;
import com.example.Nyaya_Path.dto.ExplanationRequest;
import com.example.Nyaya_Path.dto.FastApiExplanationResponse;
import com.example.Nyaya_Path.Entity.LegalSection;
import com.example.Nyaya_Path.Repository.LegalSectionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LegalExplanationService {

    private final LegalSectionRepository repository;
    private final FastApiClient fastApiClient;
    private final LanguageService languageService;

    public LegalExplanationService(
            LegalSectionRepository repository,
            FastApiClient fastApiClient,
            LanguageService languageService) {
        this.repository = repository;
        this.fastApiClient = fastApiClient;
        this.languageService = languageService;
    }

    public FastApiExplanationResponse explainSection(Long id, String requestedLanguage) {
        String language = languageService.requireSupported(requestedLanguage);

        System.out.println("Fetching legal section ID: " + id);

        LegalSection section = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Legal section not found"
                        ));

        System.out.println("========== DATABASE RESULT ==========");
        System.out.println("ID: " + section.getId());
        System.out.println("Act: " + section.getAct());
        System.out.println("Section: " + section.getSectionNumber());
        System.out.println("Legal text length: " +
                (section.getOriginalText() == null
                        ? 0
                        : section.getOriginalText().length()));
        System.out.println("=====================================");

        return explain(section, language);
    }

    private FastApiExplanationResponse explain(LegalSection section, String language) {

        ExplanationRequest request = new ExplanationRequest(
                section.getAct(),
                section.getSectionNumber(),
                section.getOriginalText(),
                language
        );

        System.out.println("Sending request to FastAPI...");

        FastApiExplanationResponse response =
                fastApiClient.explain(request);

        if (response == null || response.explanation() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Invalid response from AI service"
            );
        }

        System.out.println("AI explanation received successfully.");

        return response;
    }
}
