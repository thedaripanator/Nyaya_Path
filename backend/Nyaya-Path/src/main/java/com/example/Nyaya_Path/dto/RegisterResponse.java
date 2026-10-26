package com.example.Nyaya_Path.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponse {
    private String userId;
    private String name;
    private String email;
    private String role;
    private String message;
    private String token;

    public RegisterResponse(
            String userId,
            String name,
            String email,
            String role,
            String message
    ) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.message = message;
    }
}
