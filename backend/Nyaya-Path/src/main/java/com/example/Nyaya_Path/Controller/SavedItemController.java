//package com.example.Nyaya_Path.Controller;
//
//import com.example.Nyaya_Path.Entity.SavedItem;
//import com.example.Nyaya_Path.Entity.User;
//import com.example.Nyaya_Path.Repository.SavedItemRepository;
//import com.example.Nyaya_Path.Repository.UserRepository;
//import com.example.Nyaya_Path.dto.SaveItemDto;
//import jakarta.validation.Valid;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.Authentication;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.Instant;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//
//@RestController
//@RequestMapping("/api/saved")
//public class SavedItemController {
//
//    private final SavedItemRepository savedItemRepository;
//    private final UserRepository userRepository;
//
//    public SavedItemController(SavedItemRepository savedItemRepository, UserRepository userRepository) {
//        this.savedItemRepository = savedItemRepository;
//        this.userRepository = userRepository;
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
//    @GetMapping
//    public ResponseEntity<List<SavedItem>> getSavedItems(Authentication auth) {
//        User user = getAuthenticatedUser(auth);
//        return ResponseEntity.ok(savedItemRepository.findByUserId(user.getId()));
//    }
//
//    @PostMapping
//    public ResponseEntity<?> toggleSaveItem(@Valid @RequestBody SaveItemDto request, Authentication auth) {
//        User user = getAuthenticatedUser(auth);
//
//        Optional<SavedItem> existing = savedItemRepository.findByUserIdAndItemId(user.getId(), request.getItemId());
//        if (existing.isPresent()) {
//            savedItemRepository.delete(existing.get());
//            return ResponseEntity.ok(Map.of("saved", false, "message", "Item removed from bookmarks"));
//        } else {
//            SavedItem item = SavedItem.builder()
//                    .userId(user.getId())
//                    .itemType(request.getItemType().toUpperCase())
//                    .itemId(request.getItemId())
//                    .title(request.getTitle())
//                    .subtitle(request.getSubtitle())
//                    .category(request.getCategory())
//                    .savedAt(Instant.now())
//                    .build();
//            savedItemRepository.save(item);
//            return ResponseEntity.ok(Map.of(
//                    "saved", true,
//                    "message", "Item bookmarked to your profile",
//                    "item", item,
//                    "id", item.getId()
//            ));
//        }
//    }
//
//    @DeleteMapping("/{itemId}")
//    public ResponseEntity<?> deleteSavedItem(@PathVariable String itemId, Authentication auth) {
//        User user = getAuthenticatedUser(auth);
//        savedItemRepository.deleteByUserIdAndItemId(user.getId(), itemId);
//        return ResponseEntity.ok(Map.of("success", true, "message", "Bookmark deleted."));
//    }
//}
