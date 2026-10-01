package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.AdvocateProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvocateProfileRepository extends JpaRepository<AdvocateProfile,Long> {

    boolean existsByEnrollmentNumber(String enrollmentNumber);
}
