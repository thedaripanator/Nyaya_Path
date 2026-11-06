
package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.Entity.LegalAct;
import com.example.Nyaya_Path.Entity.LegalProvision;
import com.example.Nyaya_Path.Service.LegalService;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/legal")
public class LegalController {

    private final LegalService legalService;

    public LegalController(LegalService legalService) {
        this.legalService = legalService;
    }

    // 1. Get all Acts
    @GetMapping("/documents")
    public ResponseEntity<Page<LegalAct>> getAllActs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        validatePagination(page, size);

        return ResponseEntity.ok(
                legalService.getAllActs(page, size)
        );
    }

    // 2. Get Act details
    @GetMapping("/documents/{actId}")
    public ResponseEntity<LegalAct> getActById(
            @PathVariable String actId) {

        return ResponseEntity.ok(
                legalService.getActById(actId)
        );
    }

    // 3. Search Acts by title
    @GetMapping("/search")
    public ResponseEntity<Page<LegalAct>> searchActs(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (q == null || q.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search query cannot be empty"
            );
        }

        validatePagination(page, size);

        return ResponseEntity.ok(
                legalService.searchActs(q.trim(), page, size)
        );
    }

    // 4. Get provisions of an Act
    @GetMapping("/documents/{actId}/provisions")
    public ResponseEntity<Page<LegalProvision>> getProvisions(
            @PathVariable String actId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        validatePagination(page, size);

        return ResponseEntity.ok(
                legalService.getProvisions(actId, page, size)
        );
    }

    // 5. Get individual provision
    @GetMapping("/provisions/{chunkId}")
    public ResponseEntity<LegalProvision> getProvision(
            @PathVariable String chunkId) {

        return ResponseEntity.ok(
                legalService.getProvisionById(chunkId)
        );
    }

    private void validatePagination(int page, int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100"
            );
        }
    }
}
