
package com.example.Nyaya_Path.Config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    // Handles validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage() != null
                        ? error.getDefaultMessage()
                        : error.getField() + " is invalid")
                .collect(Collectors.joining(" "));

        if (message.isBlank()) {
            message = "Please check the provided information.";
        }

        return createResponse(HttpStatus.BAD_REQUEST, message);
    }

    // Handles invalid JSON or unreadable request data
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(
            HttpMessageNotReadableException ex) {

        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid request data. Please check your input."
        );
    }

    // Handles runtime exceptions
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(
            RuntimeException ex) {

        String message = ex.getMessage() != null
                ? ex.getMessage()
                : "Request failed.";

        String error = message.toLowerCase(Locale.ROOT);

        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (error.contains("auth")
                || error.contains("not authenticated")
                || error.contains("invalid email or password")) {

            status = HttpStatus.UNAUTHORIZED;

        } else if (error.contains("restricted")
                || error.contains("forbidden")) {

            status = HttpStatus.FORBIDDEN;
        }

        return createResponse(status, message);
    }

    // Common response method
    private ResponseEntity<Map<String, Object>> createResponse(
            HttpStatus status, String message) {

        return ResponseEntity.status(status).body(
                Map.of(
                        "success", false,
                        "message", message
                )
        );
    }
}
