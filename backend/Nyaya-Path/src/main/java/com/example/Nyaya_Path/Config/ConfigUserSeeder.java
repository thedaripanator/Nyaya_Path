package com.example.Nyaya_Path.Config;

import com.example.Nyaya_Path.Entity.User;
import com.example.Nyaya_Path.Entity.UserRole;
import com.example.Nyaya_Path.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

@Component
@Profile("dev")
public class ConfigUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ConfigUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "testuser@example.com";
        if (!userRepository.existsByEmail(email)) {
            User testUser = new User(
                    "Test User",
                    email,
                    passwordEncoder.encode("Test@1234"),
                    UserRole.Citizen
            );
            userRepository.save(testUser);
            System.out.println("[UserSeeder] Created default test user: " + email);
        } else {
            System.out.println("[UserSeeder] Test user already exists: " + email);
        }
    }
}
