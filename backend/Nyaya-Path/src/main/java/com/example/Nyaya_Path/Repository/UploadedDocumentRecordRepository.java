package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.UploadedDocumentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UploadedDocumentRecordRepository extends JpaRepository<UploadedDocumentRecord, String> {
    List<UploadedDocumentRecord> findByOwnerIdOrderByUploadedAtDesc(String ownerId);
}
