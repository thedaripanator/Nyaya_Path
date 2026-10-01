package com.example.Nyaya_Path.dto;

import lombok.Data;

@Data
public class RegisterResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String message;

    public RegisterResponse(
            Long userId,
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
