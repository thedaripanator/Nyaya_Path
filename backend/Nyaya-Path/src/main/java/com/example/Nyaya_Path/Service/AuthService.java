package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Entity.AdvocateProfile;
import com.example.Nyaya_Path.Entity.User;
import com.example.Nyaya_Path.Entity.UserRole;
import com.example.Nyaya_Path.Repository.AdvocateProfileRepository;
import com.example.Nyaya_Path.Repository.UserRepository;
import com.example.Nyaya_Path.dto.RegisterRequest;
import com.example.Nyaya_Path.dto.RegisterResponse;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AdvocateProfileRepository advocateProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            AdvocateProfileRepository advocateProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.advocateProfileRepository = advocateProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // If Advocate, validate advocate information
        if (request.getRole() == UserRole.Advocate) {

            if (isBlank(request.getEnrollmentNumber())
                    || isBlank(request.getStateBarCouncil())
                    || isBlank(request.getPrimaryPracticeArea())
                    || isBlank(request.getPrimaryCourt())) {

                throw new RuntimeException(
                        "All advocate details are required"
                );
            }

            if (advocateProfileRepository
                    .existsByEnrollmentNumber(request.getEnrollmentNumber())) {

                throw new RuntimeException(
                        "Enrollment number already registered"
                );
            }
        }

        // Create User
        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        // Create Advocate Profile
        if (request.getRole() == UserRole.Advocate) {

            AdvocateProfile profile = new AdvocateProfile();

            profile.setUser(savedUser);
            profile.setEnrollmentNumber(request.getEnrollmentNumber());
            profile.setStateBarCouncil(request.getStateBarCouncil());
            profile.setPrimaryPracticeArea(
                    request.getPrimaryPracticeArea()
            );
            profile.setPrimaryCourt(request.getPrimaryCourt());

            // New advocates start as pending
            profile.setEnrollmentStatus("PENDING");

            advocateProfileRepository.save(profile);
        }

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                "Registration successful"
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
