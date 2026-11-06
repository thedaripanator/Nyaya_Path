
package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Entity.LegalAct;
import com.example.Nyaya_Path.Entity.LegalProvision;
import com.example.Nyaya_Path.Repository.LegalActRepository;
import com.example.Nyaya_Path.Repository.LegalProvisionRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LegalService {

    private final LegalActRepository legalActRepository;
    private final LegalProvisionRepository legalProvisionRepository;

    public LegalService(
            LegalActRepository legalActRepository,
            LegalProvisionRepository legalProvisionRepository) {

        this.legalActRepository = legalActRepository;
        this.legalProvisionRepository = legalProvisionRepository;
    }

    // Get all Acts with pagination
    public Page<LegalAct> getAllActs(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return legalActRepository.findAll(pageable);
    }

    // Get Act by ID
    public LegalAct getActById(String actId) {

        return legalActRepository.findById(actId)
                .orElseThrow(() ->
                        new RuntimeException("Legal Act not found"));
    }

    // Search Acts by title
    public Page<LegalAct> searchActs(
            String query, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        return legalActRepository
                .findByTitleContainingIgnoreCase(query, pageable);
    }

    // Get provisions belonging to an Act
    public Page<LegalProvision> getProvisions(
            String actId, int page, int size) {

        if (!legalActRepository.existsById(actId)) {
            throw new RuntimeException("Legal Act not found");
        }

        Pageable pageable = PageRequest.of(page, size);

        return legalProvisionRepository.findByActId(actId, pageable);
    }

    // Get a particular provision
    public LegalProvision getProvisionById(String chunkId) {

        return legalProvisionRepository.findById(chunkId)
                .orElseThrow(() ->
                        new RuntimeException("Legal provision not found"));
    }
}
