//package com.example.Nyaya_Path.Controller;
//
//import com.example.Nyaya_Path.Entity.User;
//import com.example.Nyaya_Path.Entity.UserRole;
//import com.example.Nyaya_Path.Repository.UserRepository;
//import com.example.Nyaya_Path.Service.AiProxyService;
//import com.example.Nyaya_Path.dto.AiAskRequest;
//import com.example.Nyaya_Path.dto.CaseCompareDto;
//import com.example.Nyaya_Path.dto.CaseSearchDto;
//import jakarta.validation.Valid;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.Authentication;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/ai")
//public class AiController {
//
//    private final AiProxyService aiProxyService;
//    private final UserRepository userRepository;
//
//    public AiController(AiProxyService aiProxyService, UserRepository userRepository) {
//        this.aiProxyService = aiProxyService;
//        this.userRepository = userRepository;
//    }
//
//    private User getAuthenticatedUser(Authentication auth) {
//        Authentication authentication = (auth != null)
//                ? auth
//                : org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
//        if (authentication == null || authentication.getName() == null
//                || "anonymousUser".equals(authentication.getName())) {
//            throw new RuntimeException("Authentication required. Please sign in again.");
//        }
//        return userRepository.findByEmail(authentication.getName())
//                .orElseThrow(() -> new RuntimeException("User not found. Please sign in again."));
//    }
//
//    @PostMapping("/citizen/ask")
//    public ResponseEntity<?> askCitizen(
//            @Valid @RequestBody AiAskRequest request,
//            Authentication auth
//    ) {
//        User user = getAuthenticatedUser(auth);
//        Map<String, Object> result = aiProxyService.askCitizen(request, user.getId());
//        return ResponseEntity.ok(result);
//    }
//
//    @PostMapping("/lawyer/ask")
//    public ResponseEntity<?> askLawyer(
//            @Valid @RequestBody AiAskRequest request,
//            Authentication auth
//    ) {
//        User user = getAuthenticatedUser(auth);
//        if (!isAdvocate(user)) {
//            return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                    .body(Map.of("success", false, "message", "Lawyer AI assistant is restricted to Advocate accounts."));
//        }
//        Map<String, Object> result = aiProxyService.askLawyer(request, user.getId());
//        return ResponseEntity.ok(result);
//    }
//
//    @PostMapping("/lawyer/search-cases")
//    public ResponseEntity<?> searchCases(
//            @Valid @RequestBody CaseSearchDto request,
//            Authentication auth
//    ) {
//        User user = getAuthenticatedUser(auth);
//        if (!isAdvocate(user)) {
//            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Advocate access is required."));
//        }
//        Map<String, Object> result = aiProxyService.searchCases(request, user.getId());
//        return ResponseEntity.ok(result);
//    }
//
//    @PostMapping("/lawyer/compare-cases")
//    public ResponseEntity<?> compareCases(
//            @Valid @RequestBody CaseCompareDto request,
//            Authentication auth
//    ) {
//        User user = getAuthenticatedUser(auth);
//        if (!isAdvocate(user)) {
//            return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                    .body(Map.of("success", false, "message", "Case comparison tool is restricted to Advocate accounts."));
//        }
//        Map<String, Object> result = aiProxyService.compareCases(request, user.getId());
//        return ResponseEntity.ok(result);
//    }
//
//    @GetMapping("/history")
//    public ResponseEntity<?> getHistory(Authentication auth) {
//        User user = getAuthenticatedUser(auth);
//        return ResponseEntity.ok(aiProxyService.getUserHistory(user.getId()));
//    }
//
//    private boolean isAdvocate(User user) {
//        return user.getRole() == UserRole.Advocate;
//    }
//}
