package com.example.Nyaya_Path.Controller;

import com.example.Nyaya_Path.dto.ExplanationRequest;
import com.example.Nyaya_Path.dto.FastApiExplanationResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Nyaya_Path.Client.FastApiClient;

@RestController
@RequestMapping("/api/test")
public class FastApiTestController {

    private final FastApiClient fastApiClient;

    public FastApiTestController(FastApiClient fastApiClient) {
        this.fastApiClient = fastApiClient;
    }

    @PostMapping("/fastapi")
    public FastApiExplanationResponse testFastApi(
            @Valid @RequestBody ExplanationRequest request) {
        return fastApiClient.explain(request);
    }
}