package com.example.photostore.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.entity.User;
import com.example.photostore.exception.InvalidFileException;
import com.example.photostore.exception.StorageCapacityExceededException;
import com.example.photostore.exception.StorageOperationException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.repository.UserRepository;
import com.example.photostore.security.Encryption;
import com.example.photostore.upload.UploadSession;
import com.example.photostore.upload.UploadStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {
    

    // For image/video upload
    @Value("${photostore.max-file-size}")
    private DataSize maxFileSize;

    @Value("${photostore.allowed-file-extensions-image}")
    private List<String> allowedFileExtensionsImage;

    @Value("${photostore.allowed-file-extensions-video}")
    private List<String> allowedFileExtensionsVideo;

    @Value("${photostore.profile_pictures_directory}")
    private String profilePicturesDirectory;

    @Value("${photostore.album_covers_directory}")
    private String albumCoversDirectory;

    @Value("${photostore.storage_directory}")
    private String storageDirectory;

    @Value("${photostore.chunks_directory}")
    private String chunksDirectory;

    @Value("${photostore.storage_max_size_mb}")
    private int storageMaxSizeMb;


    private final Map<String, UploadSession> sessions = new ConcurrentHashMap<>();
    private final MediaService mediaService;
    private final Encryption encryption;
    private final UserRepository userRepository;

    public String uploadProfilePicture(Long userId, MultipartFile file) {
        validateImageFile(file);
        String fileExtension = extractFormatFromMimeType(file.getContentType());
        String fileName = userId + "." + fileExtension;
        try {
            Path path = Paths.get(profilePicturesDirectory, fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            return path.toString();
        } catch (IOException e) {
            throw new StorageOperationException("Failed to upload profile picture", e);
        }
    }

    // For image file validation (only used for profile picture)
    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        else if (file.getSize() > maxFileSize.toBytes()) {
            throw new InvalidFileException("File size is too large");
        }
        else if (contentType == null || !allowedFileExtensionsImage.contains(extractFormatFromMimeType(contentType))) {
            throw new InvalidFileException("File type is not allowed");
        }
    }

    private String extractFormatFromFilename(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    private String extractFormatFromMimeType(String mimeType) {
        return mimeType.split("/")[1];

    }

    public void deleteProfilePicture(String profilePictureUrl) {
        deleteFileIfPresent(profilePictureUrl, "Failed to delete profile picture");
    }

    public void deleteStoredFile(String path) {
        deleteFileIfPresent(path, "Failed to delete media file");
    }

    public void deleteProfilePictureByUserId(Long userId) {
        Path directory = Paths.get(profilePicturesDirectory);
        if (!Files.exists(directory)) {
            return;
        }
        String prefix = userId + ".";
        try (var files = Files.list(directory)) {
            files.filter(path -> path.getFileName().toString().startsWith(prefix))
                    .forEach(this::deletePathIfExists);
        } catch (IOException e) {
            throw new StorageOperationException("Failed to delete profile picture", e);
        }
    }

    private void deletePathIfExists(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new StorageOperationException("Failed to delete profile picture", e);
        }
    }

    private void deleteFileIfPresent(String path, String errorMessage) {
        if (!StringUtils.hasText(path)) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (IOException e) {
            throw new StorageOperationException(errorMessage, e);
        }
    }

    public int getStorageMaxSizeMb() {
        return storageMaxSizeMb;
    }

    public void createFolders() {
        try {
            Files.createDirectories(Paths.get(profilePicturesDirectory));
            Files.createDirectories(Paths.get(storageDirectory));
            Files.createDirectories(Paths.get(chunksDirectory));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to create folders", e);
        }
    }

    public void ensureUserHasCapacity(User user, long additionalBytes) {
        double additionalMb = additionalBytes / (1024.0 * 1024.0);
        if (user.getStorage_used() + additionalMb > user.getStorage_space()) {
            throw new StorageCapacityExceededException();
        }
    }

    public String initializeUpload(String filename, long totalSize, int totalChunks, String fileHash, User user) {
        String fileExtension = extractFormatFromFilename(filename);
        String fileId = UUID.randomUUID().toString();
        String uploadId = fileId + "." + fileExtension;
        if (totalSize > maxFileSize.toBytes()) {
            throw new InvalidFileException("File size is too large");
        }
        ensureUserHasCapacity(user, totalSize);
        if (totalChunks <= 0) {
            throw new InvalidFileException("Total chunks must be greater than 0");
        }
        String fileType = fileTypeFromExtension(fileExtension);
        if (fileExtension.isEmpty() || fileType == null) {
            throw new InvalidFileException("File type is not allowed");
        }
        Boolean[] receivedChunks = new Boolean[totalChunks];
        Arrays.fill(receivedChunks, false);
        UploadSession session = UploadSession.builder()
                .userId(user.getId())
                .fileName(filename)
                .fileType(fileType)
                .hash(fileHash)
                .totalSize(totalSize)
                .totalChunks(totalChunks)
                .receivedChunks(receivedChunks)
                .createdAt(Instant.now())
                .build();
        sessions.put(uploadId, session);
        return uploadId;
    }

    public Boolean processChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        UploadSession session = sessions.get(uploadId);
        if (session == null) {
            throw new IllegalArgumentException("Upload not found");
        }
        if (chunkIndex < 0 || chunkIndex >= session.getTotalChunks()) {
            throw new IllegalArgumentException("Invalid chunk index");
        }
        Path chunkPath = chunkPath(uploadId, chunkIndex);
        try {
            Files.createDirectories(Paths.get(chunksDirectory));
            try (InputStream in = chunk.getInputStream()) {
                Files.copy(in, chunkPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new StorageOperationException("Failed to store chunk", e);
        }
        session.getReceivedChunks()[chunkIndex] = true;
        for (Boolean received : session.getReceivedChunks()) {
            if (!Boolean.TRUE.equals(received)) {
                return false;
            }
        }
        return true;
    }

    public String finalizeUpload(String uploadId) {
        UploadSession session = sessions.get(uploadId);
        if (session == null) {
            throw new IllegalArgumentException("Upload not found");
        }

        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + session.getUserId()));

        Path assembledPath = Paths.get(chunksDirectory).resolve(uploadId + ".assembled");
        Path encryptedPath = Paths.get(storageDirectory).resolve(uploadId);
        try {
            Files.createDirectories(Paths.get(storageDirectory));
            Files.createDirectories(Paths.get(chunksDirectory));
            try (OutputStream out = Files.newOutputStream(assembledPath)) {
                for (int i = 0; i < session.getTotalChunks(); i++) {
                    Path chunkPath = chunkPath(uploadId, i);
                    if (!Files.exists(chunkPath)) {
                        throw new IllegalArgumentException("Missing chunk " + i);
                    }
                    Files.copy(chunkPath, out);
                }
            }
            encryption.encryptFile(
                    assembledPath,
                    encryptedPath,
                    encryption.decryptWithMasterKey(user.getEncryption_key()));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to finalize upload", e);
        } finally {
            deleteUploadTempFiles(uploadId, assembledPath);
        }

        sessions.remove(uploadId);
        mediaService.saveFromUpload(
                session,
                encryptedPath.toString(),
                extractFormatFromFilename(session.getFileName()));
        return uploadId;
    }

    private void deleteUploadTempFiles(String uploadId, Path assembledPath) {
        try {
            Files.deleteIfExists(assembledPath);
            UploadSession session = sessions.get(uploadId);
            int totalChunks = session != null ? session.getTotalChunks() : 0;
            for (int i = 0; i < totalChunks; i++) {
                Files.deleteIfExists(chunkPath(uploadId, i));
            }
        } catch (IOException e) {
            throw new StorageOperationException("Failed to clean up upload chunks", e);
        }
    }

    public UploadStatus getUploadStatus(String uploadId) {
        UploadSession session = sessions.get(uploadId);
        if (session == null) {
            return null;
        }
        else {
            List<Integer> missing = new ArrayList<>();
            for (int i = 0; i < session.getTotalChunks(); i++) {
                if (!Boolean.TRUE.equals(session.getReceivedChunks()[i])) {
                    missing.add(i);
                }
            }
            return UploadStatus.builder()
                    .totalChunks(session.getTotalChunks())
                    .missing(missing)
                    .build();
        }
    }

    private Path chunkPath(String uploadId, int chunkIndex) {
        return Paths.get(chunksDirectory).resolve(uploadId + "_" + chunkIndex);
    }

    private String fileTypeFromExtension(String extension) {
        if (allowedFileExtensionsImage.contains(extension)) {
            return "image/" + ("jpg".equals(extension) ? "jpeg" : extension);
        }
        if (allowedFileExtensionsVideo.contains(extension)) {
            return "video/" + extension;
        }
        return null;
    }
}
