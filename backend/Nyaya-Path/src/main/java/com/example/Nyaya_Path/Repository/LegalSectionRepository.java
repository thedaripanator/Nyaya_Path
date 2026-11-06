package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.LegalSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LegalSectionRepository
        extends JpaRepository<LegalSection, Long> {

    // Fetch all sections of BNS or BNSS
    List<LegalSection> findByAct(String act);

    @Query(
            value = """
                    SELECT s.*
                    FROM bns_bnss_sections s
                    WHERE (:act = 'All' OR s.act = :normalizedAct)
                      AND (
                        :search IS NULL
                        OR s.section_number ILIKE '%' || :search || '%'
                        OR COALESCE(s.section_title, '') ILIKE '%' || :search || '%'
                        OR COALESCE(s.chapter, '') ILIKE '%' || :search || '%'
                        OR COALESCE(s.original_text, '') ILIKE '%' || :search || '%'
                      )
                    ORDER BY s.id
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM bns_bnss_sections s
                    WHERE (:act = 'All' OR s.act = :normalizedAct)
                      AND (
                        :search IS NULL
                        OR s.section_number ILIKE '%' || :search || '%'
                        OR COALESCE(s.section_title, '') ILIKE '%' || :search || '%'
                        OR COALESCE(s.chapter, '') ILIKE '%' || :search || '%'
                        OR COALESCE(s.original_text, '') ILIKE '%' || :search || '%'
                      )
                    """,
            nativeQuery = true
    )
    Page<LegalSection> searchPage(
            @Param("act") String act,
            @Param("normalizedAct") String normalizedAct,
            @Param("search") String search,
            Pageable pageable
    );

    // Find a particular section by its number and Act
    Optional<LegalSection> findByActAndSectionNumber(
            String act,
            String sectionNumber
    );

    // Search sections by title
    List<LegalSection> findByActAndSectionTitleContainingIgnoreCase(
            String act,
            String sectionTitle
    );

    // Search across both BNS and BNSS
    List<LegalSection> findBySectionTitleContainingIgnoreCase(
            String sectionTitle
    );

}
