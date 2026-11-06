
package com.example.Nyaya_Path.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;

@Entity
@Table(name = "legal_acts")
@Data
public class LegalAct {

    @Id
    @Column(name = "act_id")
    private String actId;

    private String title;
    private String jurisdiction;
    private String state;

    @Column(name = "instrument_type")
    private String instrumentType;

    @Column(name = "act_status")
    private String actStatus;

    @Column(name = "in_force")
    private Boolean inForce;

    private String department;

    @Column(name = "regulatory_body")
    private String regulatoryBody;

    @Column(name = "amendment_count")
    private Integer amendmentCount;

    private Integer year;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "mirror_url")
    private String mirrorUrl;

    @Column(name = "language_code")
    private String languageCode;

    @Column(name = "source_publisher")
    private String sourcePublisher;

    @Column(name = "dataset_config")
    private String datasetConfig;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
