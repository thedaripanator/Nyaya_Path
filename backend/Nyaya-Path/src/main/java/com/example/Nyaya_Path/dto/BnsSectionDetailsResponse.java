package com.example.Nyaya_Path.dto;

import com.example.Nyaya_Path.Entity.LegalSection;
import com.example.Nyaya_Path.Entity.OffenceClassification;
import lombok.Data;

import java.util.List;
@Data
public class BnsSectionDetailsResponse {

    private LegalSection section;
    private List<OffenceClassification> classifications;
    private String translatedSectionTitle;
    private String translatedChapter;
    private String translatedText;
    private List<TranslatedClassification> translatedClassifications;
    private String language;
    private String translationStatus;

    public BnsSectionDetailsResponse(
            LegalSection section,
            List<OffenceClassification> classifications) {
        this.section = section;
        this.classifications = classifications;
    }

    public BnsSectionDetailsResponse(
            LegalSection section,
            List<OffenceClassification> classifications,
            String translatedSectionTitle,
            String translatedChapter,
            String translatedText,
            List<TranslatedClassification> translatedClassifications,
            String language,
            String translationStatus) {
        this(section, classifications);
        this.translatedSectionTitle = translatedSectionTitle;
        this.translatedChapter = translatedChapter;
        this.translatedText = translatedText;
        this.translatedClassifications = translatedClassifications;
        this.language = language;
        this.translationStatus = translationStatus;
    }

    public LegalSection getSection() {
        return section;
    }

    public List<OffenceClassification> getClassifications() {
        return classifications;
    }
}