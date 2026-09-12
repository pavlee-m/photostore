package com.example.photostore.jobs;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.photostore.entity.UploadSession;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UploadSessionService;

@Component
public class UploadSessionCleanupJob {

    private final Duration uploadSessionTtl;
    private final UploadSessionService uploadSessionService;
    private final StorageService storageService;

    public UploadSessionCleanupJob(
            @Value("${photostore.upload-session-ttl}") Duration uploadSessionTtl,
            UploadSessionService uploadSessionService,
            StorageService storageService) {
        this.uploadSessionTtl = uploadSessionTtl;
        this.uploadSessionService = uploadSessionService;
        this.storageService = storageService;
    }

    @Scheduled(fixedDelay = 60 * 60 * 1000) // 1 hour
    public void cleanupUploadSessions() {
        for (UploadSession session : uploadSessionService.findByUploadStatus("UPLOADED")) {
            deleteSession(session);
        }
        Instant cutoff = Instant.now().minus(uploadSessionTtl);
        for (UploadSession session : uploadSessionService.findCreatedBefore(cutoff)) {
            deleteSession(session);
        }
    }

    private void deleteSession(UploadSession session) {
        storageService.deleteSessionFiles(session.getUploadId(), session.getUploadedFileName(), session.getTotalChunks());
        uploadSessionService.delete(session.getUploadId());
    }
}
