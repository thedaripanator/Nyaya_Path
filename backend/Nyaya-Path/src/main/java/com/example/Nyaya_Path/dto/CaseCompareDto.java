package com.example.Nyaya_Path.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaseCompareDto {
    @NotBlank(message = "Case A is required")
    private String caseA;
    @NotBlank(message = "Case B is required")
    private String caseB;
    private String comparisonQuery;
    private Integer k = 5;
}
