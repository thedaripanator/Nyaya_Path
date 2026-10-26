package com.example.Nyaya_Path.util;

import com.example.Nyaya_Path.Entity.User;
import com.example.Nyaya_Path.Entity.UserRole;
import com.example.Nyaya_Path.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

/**
 * Seed a default test user on application startup.
 * This ensures that the authentication filter can always find a user,
 * preventing the "User not found" error when the UI requests a legal brief.
 */
@Component
@Profile("dev")
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "testuser@example.com";
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .name("Test User")
                    .email(email)
                    .password(passwordEncoder.encode("Test@1234"))
                    .role(com.example.Nyaya_Path.Entity.UserRole.Citizen) // default role for test user
                    .build();
            userRepository.save(user);
            System.out.println("[UserSeeder] Created default test user: " + email);
        } else {
            System.out.println("[UserSeeder] Default test user already exists.");
        }
    }
}
