package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.Entity.AdvocateProfile;
import com.example.Nyaya_Path.Repository.AdvocateProfileRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/advocates")
@PreAuthorize("hasRole('ADMIN')")
public class AdvocateReviewController {
    private final AdvocateProfileRepository profiles;

    public AdvocateReviewController(AdvocateProfileRepository profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/pending")
    public List<AdvocateProfile> pending() {
        return profiles.findByEnrollmentStatusIgnoreCase("PENDING");
    }

    @PostMapping("/{userId}/verify")
    public AdvocateProfile verify(@PathVariable String userId) {
        AdvocateProfile profile = profiles.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Advocate profile not found."));
        profile.setEnrollmentStatus("VERIFIED");
        return profiles.save(profile);
    }
}
