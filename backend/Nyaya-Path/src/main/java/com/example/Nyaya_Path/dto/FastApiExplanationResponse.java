package com.example.Nyaya_Path.dto;

public record FastApiExplanationResponse(
        String act,
        String section,
        ExplanationResponse explanation,
        String disclaimer
) {}