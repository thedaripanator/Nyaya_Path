package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.Entity.LegalSection;
import com.example.Nyaya_Path.Service.LegalSectionService;

import com.example.Nyaya_Path.dto.BnsSectionDetailsResponse;
import com.example.Nyaya_Path.dto.LegalSectionPageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@CrossOrigin(origins = "http://localhost:5173")
public class LegalSectionController {

    private final LegalSectionService service;

    public LegalSectionController(LegalSectionService service) {
        this.service = service;
    }

    // GET all sections of BNS or BNSS
    @GetMapping("/{act}")
    public ResponseEntity<List<LegalSection>> getSections(
            @PathVariable String act) {

        return ResponseEntity.ok(
                service.getSectionsByAct(act)
        );
    }

    // GET a particular section
    @GetMapping("/{act}/{sectionNumber}")
    public ResponseEntity<LegalSection> getSection(
            @PathVariable String act,
            @PathVariable String sectionNumber) {

        return ResponseEntity.ok(
                service.getSection(act, sectionNumber)
        );
    }

    // SEARCH sections by title
    @GetMapping("/{act}/search")
    public ResponseEntity<List<LegalSection>> searchSections(
            @PathVariable String act,
            @RequestParam String keyword) {

        return ResponseEntity.ok(
                service.searchSections(act, keyword)
        );
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<BnsSectionDetailsResponse> getSectionDetails(
            @PathVariable Long id,
            @RequestParam(defaultValue = "en") String language) {

        return ResponseEntity.ok(
                service.getSectionDetails(id, language)
        );
    }

    @GetMapping("/{act}/page")
    public ResponseEntity<LegalSectionPageResponse> getSectionsPage(
            @PathVariable String act,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "en") String language,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(service.getSectionsPage(act, page, size, language, search));
    }
}