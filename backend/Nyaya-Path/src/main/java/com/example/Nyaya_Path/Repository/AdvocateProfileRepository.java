package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.AdvocateProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AdvocateProfileRepository extends JpaRepository<AdvocateProfile, String> {
    Optional<AdvocateProfile> findByUserId(String userId);
    boolean existsByEnrollmentNumber(String enrollmentNumber);
    List<AdvocateProfile> findByEnrollmentStatusIgnoreCase(String status);
}
