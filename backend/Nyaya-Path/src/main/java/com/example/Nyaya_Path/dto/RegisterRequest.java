package com.example.Nyaya_Path.dto;


import com.example.Nyaya_Path.Entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    // Advocate fields
    private String enrollmentNumber;

    private String stateBarCouncil;

    private String primaryPracticeArea;

    private String primaryCourt;


}