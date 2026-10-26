package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, String> {
    List<ChatLog> findByUserIdOrderByCreatedAtDesc(String userId);
}
