
package com.example.Nyaya_Path.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "legal_provisions")
@Data
public class LegalProvision {

    @Id
    @Column(name = "chunk_id")
    private String chunkId;

    @Column(name = "act_id", nullable = false)
    private String actId;

    private String chapter;

    @Column(name = "section_number")
    private String sectionNumber;

    @Column(name = "section_title")
    private String sectionTitle;

    @Column(name = "text", columnDefinition = "TEXT")
    private String text;

    @Column(name = "provision_type")
    private String provisionType;

    @Column(name = "section_type")
    private String sectionType;

    @Column(name = "legal_subject")
    private String legalSubject;

    @Column(name = "has_proviso")
    private Boolean hasProviso;

    @Column(name = "has_non_obstante")
    private Boolean hasNonObstante;

    @Column(name = "delegation_type")
    private String delegationType;

    @Column(name = "acts_referenced", columnDefinition = "TEXT")
    private String actsReferenced;

    @Column(name = "defined_terms", columnDefinition = "TEXT")
    private String definedTerms;

    @Column(name = "dataset_config")
    private String datasetConfig;
}
