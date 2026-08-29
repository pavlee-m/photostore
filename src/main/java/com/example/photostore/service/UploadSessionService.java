package com.example.photostore.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.photostore.entity.UploadChunk;
import com.example.photostore.entity.UploadChunkId;
import com.example.photostore.entity.UploadSession;
import com.example.photostore.entity.User;
import com.example.photostore.repository.UploadChunkRepository;
import com.example.photostore.repository.UploadSessionRepository;
import com.example.photostore.upload.UploadStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UploadSessionService {

    private final UploadSessionRepository uploadSessionRepository;
    private final UploadChunkRepository uploadChunkRepository;

    @Transactional
    public UploadSession create(
            User user,
            String uploadedFileName,
            String fileName,
            String fileType,
            String hash,
            Long totalSize,
            Integer totalChunks) {
        UploadSession session = new UploadSession();
        session.setUser(user);
        session.setUploadedFileName(uploadedFileName);
        session.setFileName(fileName);
        session.setFileType(fileType);
        session.setHash(hash);
        session.setTotalSize(totalSize);
        session.setTotalChunks(totalChunks);
        session.setCreatedAt(Instant.now());
        return uploadSessionRepository.save(session);
    }

    public UploadSession getRequired(Long uploadId) {
        return uploadSessionRepository.findById(uploadId)
                .orElseThrow(() -> new IllegalArgumentException("Upload not found"));
    }

    public UploadSession getByUserIdAndUploadId(Long userId, Long uploadId) {
        return uploadSessionRepository.findByUploadIdAndUser_Id(uploadId, userId);
    }

    public Optional<UploadSession> find(Long uploadId) {
        return uploadSessionRepository.findById(uploadId);
    }

    @Transactional
    public boolean markChunkReceived(Long uploadId, int chunkIndex) {
        UploadSession session = getRequired(uploadId);
        if (chunkIndex < 0 || chunkIndex >= session.getTotalChunks()) {
            throw new IllegalArgumentException("Invalid chunk index");
        }

        UploadChunkId chunkId = new UploadChunkId(uploadId, chunkIndex);
        if (!uploadChunkRepository.existsById(chunkId)) {
            UploadChunk chunk = new UploadChunk();
            chunk.setId(chunkId);
            chunk.setSession(session);
            try {
                uploadChunkRepository.save(chunk);
            } catch (DataIntegrityViolationException ignored) {
                // Concurrent insert of the same chunk; unique PK makes this idempotent.
            }
        }
        return uploadChunkRepository.countByIdUploadId(uploadId) == session.getTotalChunks();
    }

    @Transactional
    public void delete(Long uploadId) {
        uploadChunkRepository.deleteByIdUploadId(uploadId);
        uploadSessionRepository.deleteById(uploadId);
    }

    public List<UploadSession> findCreatedBefore(Instant cutoff) {
        return uploadSessionRepository.findByCreatedAtBefore(cutoff);
    }

    public List<UploadSession> findByUserId(Long userId) {
        return uploadSessionRepository.findByUser_Id(userId);
    }

    @Transactional
    public void deleteAllForUser(Long userId) {
        for (UploadSession session : findByUserId(userId)) {
            delete(session.getUploadId());
        }
    }

    public UploadStatus toStatus(UploadSession session) {
        Set<Integer> received = new HashSet<>();
        for (UploadChunk chunk : uploadChunkRepository.findByIdUploadId(session.getUploadId())) {
            received.add(chunk.getId().getChunkIndex());
        }
        List<Integer> missing = new ArrayList<>();
        for (int i = 0; i < session.getTotalChunks(); i++) {
            if (!received.contains(i)) {
                missing.add(i);
            }
        }
        return UploadStatus.builder()
                .totalChunks(session.getTotalChunks())
                .missing(missing)
                .build();
    }
}
