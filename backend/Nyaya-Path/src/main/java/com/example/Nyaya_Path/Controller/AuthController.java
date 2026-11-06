
package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.Service.AuthService;
import com.example.Nyaya_Path.dto.LoginRequest;
import com.example.Nyaya_Path.dto.LoginResponse;
import com.example.Nyaya_Path.dto.RegisterRequest;
import com.example.Nyaya_Path.dto.RegisterResponse;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String COOKIE_NAME = "NYAYA_SESSION";
    private static final Duration COOKIE_MAX_AGE = Duration.ofHours(24);

    private final AuthService authService;

    @Value("${nyaya.cookie.secure:false}")
    private boolean secureCookie;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Register a new user
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            RegisterResponse response = authService.register(request);

            String token = response.getToken();
            response.setToken(null);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .header(HttpHeaders.SET_COOKIE, createSessionCookie(token).toString())
                    .body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(errorResponse(e.getMessage()));
        }
    }

    // Login an existing user
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            LoginResponse response = authService.login(request);

            String token = response.getToken();
            response.setToken(null);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, createSessionCookie(token).toString())
                    .body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse(e.getMessage()));
        }
    }

    // Logout the current user
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {

        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("success", true));
    }

    // Get the currently authenticated user's profile
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Not authenticated"));
        }

        try {
            Map<String, Object> profile =
                    authService.getCurrentUserProfile(authentication.getName());

            return ResponseEntity.ok(profile);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorResponse(e.getMessage()));
        }
    }

    // Create the JWT session cookie
    private ResponseCookie createSessionCookie(String token) {

        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/")
                .maxAge(COOKIE_MAX_AGE)
                .build();
    }

    // Standard error response
    private Map<String, Object> errorResponse(String message) {
        return Map.of(
                "success", false,
                "message", message != null ? message : "Request failed."
        );
    }
}
