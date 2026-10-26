package com.example.Nyaya_Path.Entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "saved_items", uniqueConstraints = @UniqueConstraint(name = "user_item_idx", columnNames = {"user_id", "item_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedItem {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
    @Column(length = 20)
    private String itemType; // "LAW" or "JUDGMENT"
    @Column(nullable = false, length = 255)
    private String itemId;
    private String title;
    private String subtitle;
    private String category;
    private Instant savedAt;

    @PrePersist
    void prePersist() { if (id == null) id = java.util.UUID.randomUUID().toString(); }
}
