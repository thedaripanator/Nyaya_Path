package com.example.Nyaya_Path.Service;

import com.example.Nyaya_Path.Config.JwtTokenProvider;
import com.example.Nyaya_Path.Entity.AdvocateProfile;
import com.example.Nyaya_Path.Entity.User;
import com.example.Nyaya_Path.Entity.UserRole;
import com.example.Nyaya_Path.Repository.AdvocateProfileRepository;
import com.example.Nyaya_Path.Repository.UserRepository;
import com.example.Nyaya_Path.dto.LoginRequest;
import com.example.Nyaya_Path.dto.LoginResponse;
import com.example.Nyaya_Path.dto.RegisterRequest;
import com.example.Nyaya_Path.dto.RegisterResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AdvocateProfileRepository advocateProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
            UserRepository userRepository,
            AdvocateProfileRepository advocateProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider
    ) {
        this.userRepository = userRepository;
        this.advocateProfileRepository = advocateProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (request.getRole() == UserRole.Admin) {
            throw new RuntimeException("Admin accounts cannot be created through public registration.");
        }
        // Check duplicate email in PostgreSQL
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new RuntimeException("Email is already registered. Please login.");
        }

        // If Advocate, validate advocate information
        if (request.getRole() == UserRole.Advocate) {
            if (isBlank(request.getEnrollmentNumber())
                    || isBlank(request.getStateBarCouncil())
                    || isBlank(request.getPrimaryPracticeArea())
                    || isBlank(request.getPrimaryCourt())) {
                throw new RuntimeException("All advocate fields (enrollment number, bar council, practice area, court) are required.");
            }

            if (advocateProfileRepository.existsByEnrollmentNumber(request.getEnrollmentNumber().trim())) {
                throw new RuntimeException("This Bar Council enrollment number is already registered.");
            }
        }

        // Create and save User in PostgreSQL
        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(user);

        // If Advocate, create and save a fully active profile in PostgreSQL without any manual approval gate.
        if (request.getRole() == UserRole.Advocate) {
            AdvocateProfile profile = AdvocateProfile.builder()
                    .userId(savedUser.getId())
                    .enrollmentNumber(request.getEnrollmentNumber().trim())
                    .stateBarCouncil(request.getStateBarCouncil().trim())
                    .primaryPracticeArea(request.getPrimaryPracticeArea().trim())
                    .primaryCourt(request.getPrimaryCourt().trim())
                    .enrollmentStatus("VERIFIED")
                    .createdAt(Instant.now())
                    .build();

            advocateProfileRepository.save(profile);
        }

        // Generate JWT token
        String token = tokenProvider.createToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );

        RegisterResponse response = new RegisterResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                "Account created successfully. Welcome to Nyaya-Path!"
        );
        response.setToken(token);
        return response;
    }

    public LoginResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password.");
        }

        String token = tokenProvider.createToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        Map<String, Object> advocateDetails = null;
        if (user.getRole() == UserRole.Advocate) {
            AdvocateProfile p = advocateProfileRepository.findByUserId(user.getId()).orElse(null);
            if (p != null) {
                advocateDetails = new HashMap<>();
                advocateDetails.put("enrollmentNumber", p.getEnrollmentNumber());
                advocateDetails.put("stateBarCouncil", p.getStateBarCouncil());
                advocateDetails.put("primaryPracticeArea", p.getPrimaryPracticeArea());
                advocateDetails.put("primaryCourt", p.getPrimaryCourt());
                advocateDetails.put("enrollmentStatus", p.getEnrollmentStatus());
            }
        }

        LoginResponse.UserSummary userSummary = new LoginResponse.UserSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );

        return LoginResponse.builder()
                .success(true)
                .token(token)
                .message("Login successful")
                .user(userSummary)
                .advocateDetails(advocateDetails)
                .build();
    }

    public Map<String, Object> getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("createdAt", user.getCreatedAt());

        if (user.getRole() == UserRole.Advocate) {
            advocateProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
                Map<String, Object> adv = new HashMap<>();
                adv.put("enrollmentNumber", profile.getEnrollmentNumber());
                adv.put("stateBarCouncil", profile.getStateBarCouncil());
                adv.put("primaryPracticeArea", profile.getPrimaryPracticeArea());
                adv.put("primaryCourt", profile.getPrimaryCourt());
                adv.put("enrollmentStatus", profile.getEnrollmentStatus());
                response.put("advocateProfile", adv);
            });
        }

        return response;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
