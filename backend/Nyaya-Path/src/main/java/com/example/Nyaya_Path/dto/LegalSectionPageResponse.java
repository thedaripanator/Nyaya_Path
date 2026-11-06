package com.example.Nyaya_Path.dto;

import java.util.List;

public record LegalSectionPageResponse(
        List<LegalSectionListItem> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        String language,
        String translationStatus
) {
    public record LegalSectionListItem(
            Long id,
            String act,
            String sectionNumber,
            String sectionTitle,
            String chapter,
            String originalText,
            String translatedAct,
            String translatedSectionTitle,
            String translatedChapter,
            String translatedContext,
            String translatedText,
            String translationStatus
    ) {
    }
}
