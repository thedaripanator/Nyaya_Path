package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.dto.FastApiExplanationResponse;
import com.example.Nyaya_Path.Service.LegalExplanationService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/legal/sections")
public class LegalExplanationController {

    private final LegalExplanationService explanationService;

    public LegalExplanationController(
            LegalExplanationService explanationService) {
        this.explanationService = explanationService;
    }

    @PostMapping("/{id}/explain")
    public FastApiExplanationResponse explainSection(
            @PathVariable Long id,
            @RequestParam(defaultValue = "en") String language) {

        return explanationService.explainSection(id, language);
    }
}