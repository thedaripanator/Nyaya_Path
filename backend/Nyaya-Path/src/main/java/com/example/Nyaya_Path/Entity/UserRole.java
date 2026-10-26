package com.example.Nyaya_Path.Entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum UserRole {
    Citizen,
    Advocate,
    Admin;

    @JsonCreator
    public static UserRole fromString(String value) {
        if (value == null) return null;
        for (UserRole role : UserRole.values()) {
            if (role.name().equalsIgnoreCase(value.trim())) {
                return role;
            }
        }
        return null;
    }
}
