
package com.example.Nyaya_Path.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.example.Nyaya_Path.dto.ExplanationRequest;
import com.example.Nyaya_Path.dto.FastApiExplanationResponse;
import com.example.Nyaya_Path.dto.FastApiTranslationRequest;
import com.example.Nyaya_Path.dto.FastApiTranslationResponse;

import java.util.List;
import java.util.Map;

@Component
public class FastApiClient {

    private final RestClient restClient;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    @Value("${ml.service.api-key}")
    private String apiKey;

    public FastApiClient(RestClient restClient) {
        this.restClient = restClient;
    }


    public FastApiExplanationResponse explain(ExplanationRequest request) {

        Map<String, String> payload = Map.of(
                "act", request.act(),
                "section", request.section(),
                "legal_text", request.legalText(),
                "language", request.language() == null ? "en" : request.language()
        );

        return restClient.post()
                .uri(mlServiceUrl + "/api/explain")
                .header("X-Service-Token", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(FastApiExplanationResponse.class);
    }

    public FastApiTranslationResponse translateBatch(String targetLanguage, List<String> texts) {
        return restClient.post()
                .uri(mlServiceUrl + "/api/translate")
                .header("X-Service-Token", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(new FastApiTranslationRequest(targetLanguage, texts))
                .retrieve()
                .body(FastApiTranslationResponse.class);
    }

}
