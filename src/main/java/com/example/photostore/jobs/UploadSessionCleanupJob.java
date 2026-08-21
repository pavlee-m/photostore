package com.example.photostore.jobs;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.photostore.entity.UploadSession;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UploadSessionService;

@Component
public class UploadSessionCleanupJob {

    @Value("${photostore.upload-session-ttl}")
    private Duration uploadSessionTtl;

    @Autowired
    private UploadSessionService uploadSessionService;

    @Autowired
    private StorageService storageService;

    @Scheduled(fixedDelay = 60 * 60 * 1000) // 1 hour
    public void cleanupExpiredUploadSessions() {
        Instant cutoff = Instant.now().minus(uploadSessionTtl);
        for (UploadSession session : uploadSessionService.findCreatedBefore(cutoff)) {
            storageService.deleteSessionFiles(session.getUploadId(), session.getTotalChunks());
            uploadSessionService.delete(session.getUploadId());
        }
    }
}
