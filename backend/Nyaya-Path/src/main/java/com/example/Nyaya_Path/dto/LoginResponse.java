package com.example.Nyaya_Path.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private boolean success;
    private String token;
    private String message;
    private UserSummary user;
    private Map<String, Object> advocateDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private String id;
        private String name;
        private String email;
        private String role;
    }
}
