package com.example.photostore.controller;

import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.example.photostore.dtos.MediaFileDTO;
import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.UploadSession;
import com.example.photostore.entity.User;
import com.example.photostore.service.MediaService;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UploadSessionService;
import com.example.photostore.service.UserService;
import com.example.photostore.upload.FinalizedUpload;
import com.example.photostore.upload.UploadInitResponse;
import com.example.photostore.upload.UploadProgress;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    @Autowired
    private StorageService storageService;

    @Autowired
    private UserService userService;

    @Autowired
    private MediaService mediaService;

    @Autowired
    private UploadSessionService uploadSessionService;

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
        Authentication authentication,
        @RequestParam Long uploadId,
        @RequestParam int chunkIndex,
        @RequestParam("chunk") MultipartFile chunk
    )
    {
        // Check if the upload belongs to the user
        final Long userId = Long.parseLong(authentication.getName());
        UploadSession session = uploadSessionService.getByUserIdAndUploadId(userId, uploadId);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        Boolean isComplete = storageService.processChunk(uploadId, chunkIndex, chunk);
        if (isComplete) {
            User user = userService.findById(userId);
            FinalizedUpload finalized = storageService.finalizeUpload(uploadId, user);
            MediaFile saved = mediaService.saveFromUpload(
                    finalized.session(),
                    finalized.storedPath(),
                    finalized.extension(),
                    finalized.thumbnailPath());
            return ResponseEntity.ok(saved.getId().toString());
        }
        return ResponseEntity.ok("Chunk uploaded successfully");
    }

    @GetMapping("/upload-status")
    public ResponseEntity<UploadProgress> getUploadStatus
    (
        Authentication authentication,
        @RequestParam Long uploadId
    )
    {
        final Long userId = Long.parseLong(authentication.getName());
        UploadSession session = uploadSessionService.getByUserIdAndUploadId(userId, uploadId);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        UploadProgress status = storageService.getUploadStatus(uploadId);
        status.setUploadStatus(session.getUploadStatus().getStatus());
        return ResponseEntity.ok(status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMedia(Authentication authentication, @PathVariable Long id) {
        final Long userId = Long.parseLong(authentication.getName());
        mediaService.deleteMedia(id, userId);
        return ResponseEntity.ok("Media deleted successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<MediaFileDTO>> listMedia(Authentication authentication, @RequestParam int page, @RequestParam int size) {
        final Long userId = Long.parseLong(authentication.getName());
        List<MediaFileDTO> media = mediaService.findByUser_IdOrderByUploadedAtDesc(userId, page, size)
                .stream()
                .map(MediaFileDTO::from)
                .toList();
        return ResponseEntity.ok(media);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getMedia(Authentication authentication, @PathVariable Long id) {
        final Long userId = Long.parseLong(authentication.getName());
        MediaFile media = mediaService.findById(id, userId);
        byte[] decrypted = storageService.decryptFile(Paths.get(media.getPath()), media.getUser());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.getFileType()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                .body(decrypted);
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(Authentication authentication, @PathVariable Long id) {
        final Long userId = Long.parseLong(authentication.getName());
        byte[] thumbnail = mediaService.getOrCreateThumbnail(id, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                .body(thumbnail);
    }
}
