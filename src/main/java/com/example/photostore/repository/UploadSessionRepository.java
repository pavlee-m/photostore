package com.example.photostore.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.UploadSession;

public interface UploadSessionRepository extends JpaRepository<UploadSession, String> {
    List<UploadSession> findByCreatedAtBefore(Instant cutoff);
    List<UploadSession> findByUser_Id(Long userId);
}
