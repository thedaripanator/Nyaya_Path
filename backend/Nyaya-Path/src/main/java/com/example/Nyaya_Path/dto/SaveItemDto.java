package com.example.Nyaya_Path.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveItemDto {
    @NotBlank(message = "Item type is required")
    private String itemType; // "LAW" or "JUDGMENT"

    @NotBlank(message = "Item ID is required")
    private String itemId;

    private String title;
    private String subtitle;
    private String category;
}
