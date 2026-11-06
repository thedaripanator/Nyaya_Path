package com.example.Nyaya_Path.dto;

public record ExplanationResponse(
        String simple_explanation,
        String technical_terms_explained,
        String why_this_law_matters,
        String real_life_example,
        String conditions_and_exceptions,
        String punishment_or_legal_consequence
) {}