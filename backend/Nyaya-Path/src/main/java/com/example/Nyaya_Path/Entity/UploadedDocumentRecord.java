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

import java.time.Instant;

@Entity
@Table(name = "uploaded_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadedDocumentRecord {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;
    @Column(nullable = false, length = 36)
    private String ownerId;
    private String fileName;
    private String caseName;
    private String court;
    private String year;
    private String citation;
    private int chunksIndexed;
    @Column(length = 20, nullable = false)
    @lombok.Builder.Default
    private String indexingStatus = "INDEXED";
    private Instant uploadedAt;

    @PrePersist
    void prePersist() { if (id == null) id = java.util.UUID.randomUUID().toString(); }
}
