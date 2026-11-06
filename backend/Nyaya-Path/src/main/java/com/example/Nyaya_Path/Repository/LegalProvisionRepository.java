package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.LegalProvision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface LegalProvisionRepository
        extends JpaRepository<LegalProvision, String> {

    Page<LegalProvision> findByActId(
            String actId, Pageable pageable
    );

    List<LegalProvision> findByActIdOrderBySectionNumberAsc(
            String actId
    );
}