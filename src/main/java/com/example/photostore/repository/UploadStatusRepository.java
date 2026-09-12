package com.example.photostore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.photostore.entity.UploadStatus;

public interface UploadStatusRepository extends JpaRepository<UploadStatus, Long> {
    UploadStatus findByStatus(String status);
}
