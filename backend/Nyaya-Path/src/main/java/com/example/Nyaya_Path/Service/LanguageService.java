package com.example.Nyaya_Path.Service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

@Service
public class LanguageService {

    private static final Set<String> SUPPORTED_LANGUAGES = Set.of("en", "hi", "kn", "mr");

    public String requireSupported(String language) {
        String normalized = language == null || language.isBlank()
                ? "en"
                : language.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_LANGUAGES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Language must be one of: en, hi, kn, mr"
            );
        }
        return normalized;
    }

    public String languageName(String language) {
        return switch (requireSupported(language)) {
            case "hi" -> "Hindi";
            case "kn" -> "Kannada";
            case "mr" -> "Marathi";
            default -> "English";
        };
    }
}
