package com.example.Nyaya_Path.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "bns_offence_classifications")
@Data
public class OffenceClassification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bns_section_number")
    private String bnsSectionNumber;

    @Column(name = "offence_description")
    private String offenceDescription;

    private String punishment;

    @Column(name = "cognizable_status")
    private String cognizableStatus;

    @Column(name = "bailable_status")
    private String bailableStatus;

    @Column(name = "trial_court")
    private String trialCourt;

    @Column(name = "entry_type")
    private String entryType;

}