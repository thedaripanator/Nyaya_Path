
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
            JwtTokenProvider tokenProvider) {

        this.userRepository = userRepository;
        this.advocateProfileRepository = advocateProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    // -------------------- REGISTER --------------------

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        // Prevent public Admin registration
        if (request.getRole() == UserRole.Admin) {
            throw new RuntimeException(
                    "Admin accounts cannot be created through public registration."
            );
        }

        // Check duplicate email
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email is already registered. Please login."
            );
        }

        // Validate Advocate information
        if (request.getRole() == UserRole.Advocate) {
            validateAdvocateDetails(request);
        }

        Instant now = Instant.now();

        // Create user
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .createdAt(now)
                .updatedAt(now)
                .build();

        User savedUser = userRepository.save(user);

        // Create Advocate profile if applicable
        if (request.getRole() == UserRole.Advocate) {
            createAdvocateProfile(request, savedUser);
        }

        // Generate JWT
        String token = generateToken(savedUser);

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

    // -------------------- LOGIN --------------------

    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "Invalid email or password."
                ));

        // Verify password
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid email or password."
            );
        }

        // Generate JWT
        String token = generateToken(user);

        // Get Advocate details if applicable
        Map<String, Object> advocateDetails =
                getAdvocateDetails(user);

        LoginResponse.UserSummary userSummary =
                new LoginResponse.UserSummary(
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

    // -------------------- CURRENT USER --------------------

    public Map<String, Object> getCurrentUserProfile(String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("createdAt", user.getCreatedAt());

        Map<String, Object> advocateDetails = getAdvocateDetails(user);

        if (advocateDetails != null) {
            response.put("advocateProfile", advocateDetails);
        }

        return response;
    }

    // -------------------- ADVOCATE VALIDATION --------------------

    private void validateAdvocateDetails(RegisterRequest request) {

        if (isBlank(request.getEnrollmentNumber())
                || isBlank(request.getStateBarCouncil())
                || isBlank(request.getPrimaryPracticeArea())
                || isBlank(request.getPrimaryCourt())) {

            throw new RuntimeException(
                    "All advocate fields (enrollment number, bar council, practice area, court) are required."
            );
        }

        String enrollmentNumber =
                request.getEnrollmentNumber().trim();

        if (advocateProfileRepository.existsByEnrollmentNumber(
                enrollmentNumber)) {

            throw new RuntimeException(
                    "This Bar Council enrollment number is already registered."
            );
        }
    }

    // -------------------- CREATE ADVOCATE PROFILE --------------------

    private void createAdvocateProfile(
            RegisterRequest request,
            User user) {

        AdvocateProfile profile = AdvocateProfile.builder()
                .userId(user.getId())
                .enrollmentNumber(request.getEnrollmentNumber().trim())
                .stateBarCouncil(request.getStateBarCouncil().trim())
                .primaryPracticeArea(request.getPrimaryPracticeArea().trim())
                .primaryCourt(request.getPrimaryCourt().trim())
                .enrollmentStatus("VERIFIED")
                .createdAt(Instant.now())
                .build();

        advocateProfileRepository.save(profile);
    }

    // -------------------- GET ADVOCATE DETAILS --------------------

    private Map<String, Object> getAdvocateDetails(User user) {

        if (user.getRole() != UserRole.Advocate) {
            return null;
        }

        AdvocateProfile profile = advocateProfileRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            return null;
        }

        Map<String, Object> details = new HashMap<>();

        details.put("enrollmentNumber", profile.getEnrollmentNumber());
        details.put("stateBarCouncil", profile.getStateBarCouncil());
        details.put("primaryPracticeArea", profile.getPrimaryPracticeArea());
        details.put("primaryCourt", profile.getPrimaryCourt());
        details.put("enrollmentStatus", profile.getEnrollmentStatus());

        return details;
    }

    // -------------------- JWT GENERATION --------------------

    private String generateToken(User user) {

        return tokenProvider.createToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    // -------------------- UTILITY --------------------

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
