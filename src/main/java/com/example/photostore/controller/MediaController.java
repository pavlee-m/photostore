package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.User;
import com.example.photostore.service.MediaService;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UserService;
import com.example.photostore.upload.UploadInitResponse;
import com.example.photostore.upload.UploadStatus;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    @Autowired
    private StorageService storageService;

    @Autowired
    private UserService userService;

    @Autowired
    private MediaService mediaService;

    @PostMapping("/upload-init")
    public ResponseEntity<UploadInitResponse> initUpload
    (
        Authentication authentication,
        @RequestParam String filename,
        @RequestParam long totalSize,
        @RequestParam int totalChunks,
        @RequestParam String fileHash
    )
    {
        final Long userId = Long.parseLong(authentication.getName());
        User user = userService.findById(userId);
        MediaFile existing = mediaService.findByHashAndUser_Id(fileHash, userId);
        if (existing != null) {
            return ResponseEntity.ok(UploadInitResponse.existing(existing.getId()));
        }

        String uploadId = storageService.initializeUpload(filename, totalSize, totalChunks, fileHash, user);
        return ResponseEntity.ok(UploadInitResponse.started(uploadId));
    }

    @PostMapping("/upload-chunk")
    public ResponseEntity<String> uploadChunk
    (
        @RequestParam String uploadId,
        @RequestParam int chunkIndex,
        @RequestParam("chunk") MultipartFile chunk
    )
    {
        Boolean isComplete = storageService.processChunk(uploadId, chunkIndex, chunk);
        if (isComplete) {
            String fileId = storageService.finalizeUpload(uploadId);
            return ResponseEntity.ok(fileId);
        }
        return ResponseEntity.ok("Chunk uploaded successfully");
    }

    @GetMapping("/upload-status")
    public ResponseEntity<UploadStatus> getUploadStatus
    (
        @RequestParam String uploadId
    )
    {
        UploadStatus status = storageService.getUploadStatus(uploadId);
        return ResponseEntity.ok(status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMedia(Authentication authentication, @PathVariable Long id) {
        final Long userId = Long.parseLong(authentication.getName());
        mediaService.deleteMedia(id, userId);
        return ResponseEntity.ok("Media deleted successfully!");
    }

}
