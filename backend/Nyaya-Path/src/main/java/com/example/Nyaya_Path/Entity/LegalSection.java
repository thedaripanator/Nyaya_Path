package com.example.Nyaya_Path.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(
        name = "bns_bnss_sections",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"act", "section_number"}
                )
        }
)
@Data
public class LegalSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chunk_id", nullable = false)
    private String chunkId;

    @Column(name = "section_number", nullable = false)
    private String sectionNumber;

    @Column(name = "section_title")
    private String sectionTitle;

    private String chapter;

    @Column(name = "original_text", columnDefinition = "TEXT", nullable = false)
    private String originalText;

    @Column(nullable = false)
    private String act;

    @Column(name = "source_label")
    private String sourceLabel;


}