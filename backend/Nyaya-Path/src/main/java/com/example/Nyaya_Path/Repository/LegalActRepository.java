package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.LegalAct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LegalActRepository
        extends JpaRepository<LegalAct, String> {

    Page<LegalAct> findByTitleContainingIgnoreCase(
            String title, Pageable pageable
    );
}