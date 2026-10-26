package com.example.Nyaya_Path.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAskRequest {
    @NotBlank(message = "Question is required")
    private String question;
    private Integer k = 5;
    private String language = "English";
}
