package com.example.photostore.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.UploadChunk;
import com.example.photostore.entity.UploadChunkId;

public interface UploadChunkRepository extends JpaRepository<UploadChunk, UploadChunkId> {
    long countByIdUploadId(Long uploadId);
    List<UploadChunk> findByIdUploadId(Long uploadId);
    void deleteByIdUploadId(Long uploadId);
}
