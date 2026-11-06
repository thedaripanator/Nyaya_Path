package com.example.Nyaya_Path.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record FastApiTranslationResponse(
        @JsonProperty("target_language") String targetLanguage,
        List<String> translations
) {
}
