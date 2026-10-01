package com.example.Nyaya_Path.Entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "advocate_profiles")
@Data
public class AdvocateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String enrollmentNumber;

    @Column(nullable = false)
    private String stateBarCouncil;

    @Column(nullable = false)
    private String primaryPracticeArea;

    @Column(nullable = false)
    private String primaryCourt;

    @Column(nullable = false)
    private String enrollmentStatus;
}
