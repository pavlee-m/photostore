package com.example.photostore.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.UploadChunk;
import com.example.photostore.entity.UploadChunkId;

public interface UploadChunkRepository extends JpaRepository<UploadChunk, UploadChunkId> {
    long countByIdUploadId(String uploadId);
    List<UploadChunk> findByIdUploadId(String uploadId);
    void deleteByIdUploadId(String uploadId);
}
