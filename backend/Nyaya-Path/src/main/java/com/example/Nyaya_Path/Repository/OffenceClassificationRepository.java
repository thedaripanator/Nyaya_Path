package com.example.Nyaya_Path.Repository;

import com.example.Nyaya_Path.Entity.OffenceClassification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OffenceClassificationRepository
        extends JpaRepository<OffenceClassification, Long> {

    List<OffenceClassification>
    findByBnsSectionNumberOrderByIdAsc(String bnsSectionNumber);
}