package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.Service.AuthService;
import com.example.Nyaya_Path.dto.LoginRequest;
import com.example.Nyaya_Path.dto.LoginResponse;
import com.example.Nyaya_Path.dto.RegisterRequest;
import com.example.Nyaya_Path.dto.RegisterResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${nyaya.cookie.secure:false}")
    private boolean secureCookie;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            RegisterResponse response = authService.register(request);
            String token = response.getToken();
            response.setToken(null);
            return ResponseEntity.status(HttpStatus.CREATED).header(HttpHeaders.SET_COOKIE, sessionCookie(token).toString()).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            String token = response.getToken();
            response.setToken(null);
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, sessionCookie(token).toString()).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = ResponseCookie.from("NYAYA_SESSION", "")
                .httpOnly(true).secure(secureCookie).sameSite("Strict").path("/").maxAge(Duration.ZERO).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("success", true));
    }

    private ResponseCookie sessionCookie(String token) {
        return ResponseCookie.from("NYAYA_SESSION", token)
                .httpOnly(true).secure(secureCookie).sameSite("Strict").path("/")
                .maxAge(Duration.ofHours(24)).build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Not authenticated"));
        }
        try {
            Map<String, Object> profile = authService.getCurrentUserProfile(authentication.getName());
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
