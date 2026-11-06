//package com.example.Nyaya_Path.Controller;
//
//import com.example.Nyaya_Path.Entity.UploadedDocumentRecord;
//import com.example.Nyaya_Path.Entity.User;
//import com.example.Nyaya_Path.Entity.UserRole;
//import com.example.Nyaya_Path.Repository.UploadedDocumentRecordRepository;
//import com.example.Nyaya_Path.Repository.UserRepository;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.core.io.ByteArrayResource;
//import org.springframework.http.*;
//import org.springframework.security.core.Authentication;
//import org.springframework.util.LinkedMultiValueMap;
//import org.springframework.util.MultiValueMap;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.client.RestTemplate;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.time.Instant;
//import java.util.List;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/documents")
//public class DocumentController {
//
//    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);
//
//    private final UserRepository userRepository;
//    private final UploadedDocumentRecordRepository documentRecordRepository;
//    private final RestTemplate restTemplate;
//
//    @Value("${nyaya.ml-service.url:http://127.0.0.1:8001}")
//    private String mlServiceUrl;
//
//    @Value("${nyaya.ml-service.api-key}")
//    private String mlServiceApiKey;
//
//    public DocumentController(
//            UserRepository userRepository,
//            UploadedDocumentRecordRepository documentRecordRepository
//    ) {
//        this.userRepository = userRepository;
//        this.documentRecordRepository = documentRecordRepository;
//        this.restTemplate = new RestTemplate();
//    }
//
//    private User getAuthenticatedUser(Authentication auth) {
//        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
//            throw new RuntimeException("Authentication required. Please sign in again.");
//        }
//        return userRepository.findByEmail(auth.getName())
//                .orElseThrow(() -> new RuntimeException("User not found."));
//    }
//
//    @PostMapping("/upload")
//    public ResponseEntity<?> uploadDocument(
//            @RequestParam("file") MultipartFile file,
//            @RequestParam(value = "case_name", required = false) String caseName,
//            @RequestParam(value = "court", required = false) String court,
//            @RequestParam(value = "year", required = false) String year,
//            @RequestParam(value = "citation", required = false) String citation,
//            Authentication auth
//    ) {
//        User user = getAuthenticatedUser(auth);
//        if (user.getRole() != UserRole.Advocate) {
//            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Advocate access is required."));
//        }
//
//        if (file.isEmpty()) {
//            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File cannot be empty."));
//        }
//
//        try {
//            // Forward file to FastAPI ML Service with isolation owner_id
//            String uploadUrl = mlServiceUrl + "/api/documents/upload";
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
//            headers.set("X-Service-Token", mlServiceApiKey);
//
//            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
//            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
//                @Override
//                public String getFilename() {
//                    return file.getOriginalFilename();
//                }
//            };
//
//            body.add("file", fileResource);
//            body.add("owner_id", user.getId());
//            if (caseName != null) body.add("case_name", caseName);
//            if (court != null) body.add("court", court);
//            if (year != null) body.add("year", year);
//            if (citation != null) body.add("citation", citation);
//
//            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
//            ResponseEntity<Map> response = restTemplate.postForEntity(uploadUrl, requestEntity, Map.class);
//
//            int chunksIndexed = 1;
//            if (response.getBody() != null && response.getBody().containsKey("data")) {
//                Map data = (Map) response.getBody().get("data");
//                Object chunks = data != null ? data.get("chunks_indexed") : null;
//                if (chunks instanceof Number number) {
//                    chunksIndexed = number.intValue();
//                }
//            }
//
//            // Save record only after ML indexing succeeds.
//            UploadedDocumentRecord record = UploadedDocumentRecord.builder()
//                    .ownerId(user.getId())
//                    .fileName(file.getOriginalFilename())
//                    .caseName(caseName != null ? caseName : file.getOriginalFilename())
//                    .court(court != null ? court : "Supreme Court of India")
//                    .year(year != null ? year : String.valueOf(java.time.Year.now().getValue()))
//                    .citation(citation)
//                    .chunksIndexed(chunksIndexed)
//                    .uploadedAt(Instant.now())
//                    .build();
//
//            documentRecordRepository.save(record);
//
//            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
//                    "success", true,
//                    "message", "Document indexed into the isolated legal store and recorded in PostgreSQL.",
//                    "document", record,
//                    "ml_response", response.getBody()
//            ));
//
//        } catch (Exception e) {
//            log.error("Failed to upload document: {}", e.getMessage(), e);
//            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
//                    "success", false,
//                    "message", "Document indexing failed. Please retry later."
//            ));
//        }
//    }
//
//    @GetMapping("/my-documents")
//    public ResponseEntity<List<UploadedDocumentRecord>> getMyDocuments(Authentication auth) {
//        User user = getAuthenticatedUser(auth);
//        List<UploadedDocumentRecord> docs = documentRecordRepository.findByOwnerIdOrderByUploadedAtDesc(user.getId());
//        return ResponseEntity.ok(docs);
//    }
//}
