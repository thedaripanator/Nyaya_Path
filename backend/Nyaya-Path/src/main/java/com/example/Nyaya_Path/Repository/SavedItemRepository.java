package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.SavedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedItemRepository extends JpaRepository<SavedItem, String> {
    List<SavedItem> findByUserId(String userId);
    Optional<SavedItem> findByUserIdAndItemId(String userId, String itemId);
    void deleteByUserIdAndItemId(String userId, String itemId);
}
