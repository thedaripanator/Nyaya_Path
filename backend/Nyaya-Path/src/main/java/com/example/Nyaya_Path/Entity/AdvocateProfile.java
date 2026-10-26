package com.example.Nyaya_Path.Entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "advocate_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateProfile {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 36)
    private String userId;

    @Column(nullable = false, unique = true, length = 100)
    private String enrollmentNumber;

    private String stateBarCouncil;
    private String primaryPracticeArea;
    private String primaryCourt;
    @Column(nullable = false, length = 20)
    private String enrollmentStatus; // "VERIFIED", "PENDING"
    private int experienceYears;
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }
}
