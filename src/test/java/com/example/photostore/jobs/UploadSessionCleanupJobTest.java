package com.example.photostore.jobs;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.example.photostore.entity.UploadSession;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UploadSessionService;

class UploadSessionCleanupJobTest {

    private UploadSessionService uploadSessionService;
    private StorageService storageService;
    private UploadSessionCleanupJob job;

    @BeforeEach
    void setUp() {
        uploadSessionService = mock(UploadSessionService.class);
        storageService = mock(StorageService.class);
        job = new UploadSessionCleanupJob(Duration.ofHours(24), uploadSessionService, storageService);
    }

    @Test
    void cleanupUploadSessions_deletesUploadedAndExpiredSessions() {
        UploadSession uploaded = session(1L, "done.bin", 1);
        UploadSession expired = session(2L, "stale.bin", 3);
        when(uploadSessionService.findByUploadStatus("UPLOADED")).thenReturn(List.of(uploaded));
        when(uploadSessionService.findCreatedBefore(any())).thenReturn(List.of(expired));

        job.cleanupUploadSessions();

        verify(storageService).deleteSessionFiles(1L, "done.bin", 1);
        verify(uploadSessionService).delete(1L);
        verify(storageService).deleteSessionFiles(2L, "stale.bin", 3);
        verify(uploadSessionService).delete(2L);
    }

    @Test
    void cleanupUploadSessions_usesTtlCutoff() {
        when(uploadSessionService.findByUploadStatus("UPLOADED")).thenReturn(List.of());
        when(uploadSessionService.findCreatedBefore(any())).thenReturn(List.of());
        Instant before = Instant.now().minus(Duration.ofHours(24));

        job.cleanupUploadSessions();

        ArgumentCaptor<Instant> cutoff = ArgumentCaptor.forClass(Instant.class);
        verify(uploadSessionService).findCreatedBefore(cutoff.capture());
        Instant after = Instant.now().minus(Duration.ofHours(24));
        assertFalse(cutoff.getValue().isBefore(before));
        assertFalse(cutoff.getValue().isAfter(after));
    }

    @Test
    void cleanupUploadSessions_doesNotDeleteWhenNothingMatches() {
        when(uploadSessionService.findByUploadStatus("UPLOADED")).thenReturn(List.of());
        when(uploadSessionService.findCreatedBefore(any())).thenReturn(List.of());

        job.cleanupUploadSessions();

        verify(storageService, never()).deleteSessionFiles(any(), any(), anyInt());
        verify(uploadSessionService, never()).delete(any());
    }

    private static UploadSession session(long id, String uploadedFileName, int totalChunks) {
        UploadSession session = new UploadSession();
        session.setUploadId(id);
        session.setUploadedFileName(uploadedFileName);
        session.setTotalChunks(totalChunks);
        return session;
    }
}
