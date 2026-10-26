package com.example.Nyaya_Path.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaseSearchDto {
    @NotBlank(message = "Query is required")
    private String query;
    private Integer k = 10;
}
