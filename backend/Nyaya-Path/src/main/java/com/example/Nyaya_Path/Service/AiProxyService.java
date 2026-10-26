package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Entity.ChatLog;
import com.example.Nyaya_Path.Repository.ChatLogRepository;
import com.example.Nyaya_Path.dto.AiAskRequest;
import com.example.Nyaya_Path.dto.CaseCompareDto;
import com.example.Nyaya_Path.dto.CaseSearchDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
public class AiProxyService {

    private static final Logger log = LoggerFactory.getLogger(AiProxyService.class);

    private final RestTemplate restTemplate;
    private final ChatLogRepository chatLogRepository;

    @Value("${nyaya.ml-service.url:http://127.0.0.1:8001}")
    private String mlServiceUrl;

    @Value("${nyaya.ml-service.api-key}")
    private String mlServiceApiKey;

    public AiProxyService(ChatLogRepository chatLogRepository) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(120000);
        this.restTemplate = new RestTemplate(factory);
        this.chatLogRepository = chatLogRepository;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> askCitizen(AiAskRequest request, String userId) {
        String url = mlServiceUrl + "/api/citizen/ask";
        Map<String, Object> body = new HashMap<>();
        body.put("question", request.getQuestion());
        body.put("k", request.getK() != null ? request.getK() : 5);
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            body.put("language", request.getLanguage());
        }

        try {
            Map<String, Object> resBody = postJson(url, body);

            if (resBody != null && resBody.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) resBody.get("data");
                String answer = data != null ? String.valueOf(data.getOrDefault("answer", "")) : "";
                List<Map<String, Object>> sources = data != null
                        ? (List<Map<String, Object>>) data.getOrDefault("sources", List.of())
                        : List.of();

                chatLogRepository.save(ChatLog.builder()
                        .userId(userId)
                        .userRole("Citizen")
                        .query(request.getQuestion())
                        .answer(answer)
                        .sources(sources)
                        .createdAt(Instant.now())
                        .build());
            }

            return resBody != null ? resBody : unavailable("citizen");
        } catch (Exception e) {
            log.error("Error communicating with ML Service citizen endpoint: {}", e.getMessage());
            return unavailable("citizen", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> askLawyer(AiAskRequest request, String userId) {
        String url = mlServiceUrl + "/api/lawyer/ask";
        Map<String, Object> body = new HashMap<>();
        body.put("question", request.getQuestion());
        body.put("k", request.getK() != null ? request.getK() : 5);
        if (userId != null && !userId.isBlank()) {
            body.put("owner_id", userId);
        }

        try {
            Map<String, Object> resBody = postJson(url, body);

            if (resBody != null && resBody.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) resBody.get("data");
                String answer = data != null ? String.valueOf(data.getOrDefault("answer", "")) : "";
                List<Map<String, Object>> sources = data != null
                        ? (List<Map<String, Object>>) data.getOrDefault("sources", List.of())
                        : List.of();

                chatLogRepository.save(ChatLog.builder()
                        .userId(userId)
                        .userRole("Advocate")
                        .query(request.getQuestion())
                        .answer(answer)
                        .sources(sources)
                        .createdAt(Instant.now())
                        .build());
            }

            return resBody != null ? resBody : unavailable("lawyer");
        } catch (Exception e) {
            log.error("Error communicating with ML Service lawyer endpoint: {}", e.getMessage());
            return unavailable("lawyer", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> searchCases(CaseSearchDto request, String userId) {
        String url = mlServiceUrl + "/api/lawyer/search-cases";
        Map<String, Object> body = new HashMap<>();
        body.put("query", request.getQuery());
        body.put("k", request.getK() != null ? request.getK() : 10);
        if (userId != null && !userId.isBlank()) {
            body.put("owner_id", userId);
        }

        try {
            Map<String, Object> resBody = postJson(url, body);
            return resBody != null ? resBody : Map.of("success", false, "data", Map.of("cases", List.of()));
        } catch (Exception e) {
            log.error("Error searching cases via ML Service: {}", e.getMessage());
            return Map.of("success", false, "data", Map.of("cases", List.of()), "message", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> compareCases(CaseCompareDto request, String userId) {
        String url = mlServiceUrl + "/api/lawyer/compare-cases";
        Map<String, Object> body = new HashMap<>();
        body.put("case_a", request.getCaseA());
        body.put("case_b", request.getCaseB());
        if (request.getComparisonQuery() != null) {
            body.put("comparison_query", request.getComparisonQuery());
        }
        body.put("k", request.getK() != null ? request.getK() : 5);
        if (userId != null && !userId.isBlank()) {
            body.put("owner_id", userId);
        }

        try {
            Map<String, Object> resBody = postJson(url, body);
            return resBody != null ? resBody : Map.of("success", false, "message", "Empty response from ML service");
        } catch (Exception e) {
            log.error("Error comparing cases via ML Service: {}", e.getMessage());
            return Map.of("success", false, "message", e.getMessage());
        }
    }

    public List<ChatLog> getUserHistory(String userId) {
        return chatLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postJson(String url, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-Service-Token", mlServiceApiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException(extractMlError(e.getResponseBodyAsString(), e.getMessage()));
        }
    }

    private String extractMlError(String body, String fallback) {
        if (body == null || body.isBlank()) {
            return fallback;
        }
        int detailIdx = body.indexOf("\"detail\"");
        if (detailIdx >= 0) {
            return body;
        }
        return fallback + " | " + body;
    }

    private Map<String, Object> unavailable(String mode) {
        return unavailable(mode, "ML service did not return a response");
    }

    private Map<String, Object> unavailable(String mode, String reason) {
        String answer;
        if (reason != null && reason.toLowerCase(Locale.ROOT).contains("timed out")) {
            answer = "The legal " + mode + " analysis timed out while waiting for the AI model. "
                    + "This is a research-service delay, not a login or account issue. Please try again.";
        } else if (reason != null && reason.toLowerCase(Locale.ROOT).contains("connection refused")) {
            answer = "Unable to connect to the legal " + mode + " assistant. Verify that the Python ML service is running on "
                    + mlServiceUrl + " (" + reason + ")";
        } else {
            answer = "Unable to complete the legal " + mode + " request through the Python ML service on "
                    + mlServiceUrl + (reason != null ? " (" + reason + ")" : "");
        }
        return Map.of(
                "success", false,
                "message", "ML Service is currently unavailable: " + reason,
                "data", Map.of("answer", answer, "sources", List.of())
        );
    }
}
