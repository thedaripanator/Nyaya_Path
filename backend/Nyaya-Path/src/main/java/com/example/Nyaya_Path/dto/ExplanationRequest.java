package com.example.Nyaya_Path.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;

public record ExplanationRequest(
        @NotBlank
        String act,

        @NotBlank
        String section,

        @NotBlank
        @Size(min = 10)
        @JsonProperty("legal_text")
        String legalText,

        String language
) {}