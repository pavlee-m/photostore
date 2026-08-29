package com.example.photostore.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.entity.UploadSession;
import com.example.photostore.entity.User;
import com.example.photostore.exception.InvalidFileException;
import com.example.photostore.exception.StorageCapacityExceededException;
import com.example.photostore.exception.StorageOperationException;
import com.example.photostore.image.ImageThumbnail;
import com.example.photostore.image.StoredThumbnail;
import com.example.photostore.security.Encryption;
import com.example.photostore.upload.FinalizedUpload;
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

    @Value("${photostore.thumbnails_directory}")
    private String thumbnailsDirectory;

    @Value("${photostore.chunks_directory}")
    private String chunksDirectory;

    @Value("${photostore.storage_max_size_mb}")
    private int storageMaxSizeMb;


    private final Encryption encryption;
    private final UploadSessionService uploadSessionService;

    public String uploadProfilePicture(Long userId, MultipartFile file) {
        validateImageFile(file);
        String fileExtension = extractFormatFromMimeType(file.getContentType());
        String fileName = userId + "." + fileExtension;
        deleteProfilePictureByUserId(userId);
        try {
            Files.createDirectories(Paths.get(profilePicturesDirectory));
            Path path = Paths.get(profilePicturesDirectory, fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            return path.toString();
        } catch (IOException e) {
            throw new StorageOperationException("Failed to upload profile picture", e);
        }
    }

    public byte[] readProfilePicture(String path) {
        try {
            return Files.readAllBytes(Paths.get(path));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to read profile picture", e);
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
            Files.createDirectories(Paths.get(albumCoversDirectory));
            Files.createDirectories(Paths.get(storageDirectory));
            Files.createDirectories(Paths.get(thumbnailsDirectory));
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
        String uploadedFileName = fileId + "." + fileExtension;
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
        UploadSession session = uploadSessionService.create(user, uploadedFileName, filename, fileType, fileHash, totalSize, totalChunks);
        return session.getUploadId().toString();
    }

    public Boolean processChunk(Long uploadId, int chunkIndex, MultipartFile chunk) {
        UploadSession session = uploadSessionService.getRequired(uploadId);
        if (chunkIndex < 0 || chunkIndex >= session.getTotalChunks()) {
            throw new IllegalArgumentException("Invalid chunk index");
        }
        Path chunkPath = chunkPath(uploadId, chunkIndex);
        try {
            try (InputStream in = chunk.getInputStream()) {
                Files.copy(in, chunkPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new StorageOperationException("Failed to store chunk", e);
        }
        return uploadSessionService.markChunkReceived(uploadId, chunkIndex);
    }

    public FinalizedUpload finalizeUpload(Long uploadId, User user) {
        UploadSession session = uploadSessionService.getRequired(uploadId);
        int totalChunks = session.getTotalChunks();
        Path assembledPath = Paths.get(chunksDirectory).resolve(session.getUploadedFileName() + ".assembled");
        Path encryptedPath = Paths.get(storageDirectory).resolve(session.getUploadedFileName());
        try {
            try (OutputStream out = Files.newOutputStream(assembledPath)) {
                for (int i = 0; i < totalChunks; i++) {
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
            String thumbnailPath = createThumbnailIfImage(session, assembledPath, session.getUploadedFileName(), user);
            uploadSessionService.delete(uploadId);
            return new FinalizedUpload(
                    session,
                    encryptedPath.toString(),
                    extractFormatFromFilename(session.getFileName()),
                    thumbnailPath);
        } catch (IOException e) {
            throw new StorageOperationException("Failed to finalize upload", e);
        } finally {
            deleteUploadTempFiles(uploadId, assembledPath, totalChunks);
        }
    }

    public void deleteSessionFiles(Long uploadId, String uploadedFileName, int totalChunks) {
        Path assembledPath = Paths.get(chunksDirectory).resolve(uploadedFileName + ".assembled");
        deleteUploadTempFiles(uploadId, assembledPath, totalChunks);
    }

    private void deleteUploadTempFiles(Long uploadId, Path assembledPath, int totalChunks) {
        try {
            Files.deleteIfExists(assembledPath);
            for (int i = 0; i < totalChunks; i++) {
                Files.deleteIfExists(chunkPath(uploadId, i));
            }
        } catch (IOException e) {
            throw new StorageOperationException("Failed to clean up upload chunks", e);
        }
    }

    public UploadStatus getUploadStatus(Long uploadId) {
        return uploadSessionService.find(uploadId)
                .map(uploadSessionService::toStatus)
                .orElse(null);
    }

    private Path chunkPath(Long uploadId, int chunkIndex) {
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

    public boolean thumbnailExists(String thumbnailPath) {
        return StringUtils.hasText(thumbnailPath) && Files.exists(Paths.get(thumbnailPath));
    }

    public StoredThumbnail createThumbnailFromOriginal(Path encryptedOriginal, User user) throws IOException {
        byte[] original = decryptFile(encryptedOriginal, user);
        byte[] jpeg = ImageThumbnail.toJpeg(original);
        Path destination = thumbnailPath(encryptedOriginal.getFileName().toString());
        storeEncryptedJpeg(jpeg, destination, user);
        return new StoredThumbnail(destination.toString(), jpeg);
    }

    private String createThumbnailIfImage(UploadSession session, Path assembledPath, String uploadedFileName, User user) {
        if (session.getFileType() == null || !session.getFileType().startsWith("image/")) {
            return null;
        }
        try {
            byte[] jpeg = ImageThumbnail.toJpeg(assembledPath);
            Path destination = thumbnailPath(uploadedFileName);
            storeEncryptedJpeg(jpeg, destination, user);
            return destination.toString();
        } catch (Exception e) {
            log.warn("Failed to create thumbnail for upload {}", uploadedFileName, e);
            return null;
        }
    }

    private Path thumbnailPath(String fileName) {
        return Paths.get(thumbnailsDirectory).resolve(fileName);
    }

    private void storeEncryptedJpeg(byte[] jpeg, Path destination, User user) {
        Path temp = Paths.get(destination.toString() + ".tmp");
        try {
            Files.createDirectories(destination.getParent());
            Files.write(temp, jpeg);
            encryption.encryptFile(
                    temp,
                    destination,
                    encryption.decryptWithMasterKey(user.getEncryption_key()));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to store thumbnail", e);
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (IOException e) {
                throw new StorageOperationException("Failed to clean up thumbnail temp file", e);
            }
        }
    }

    public byte[] decryptFile(Path source, User user) {
        SecretKey key = encryption.decryptWithMasterKey(user.getEncryption_key());
        return encryption.decryptFile(source, key);
    }

    public String uploadAlbumCover(Long albumId, User user, MultipartFile file) {
        validateImageFile(file);
        String extension = extractFormatFromMimeType(file.getContentType());
        String fileName = albumId + "_" + user.getId() + "." + extension;
        Path destination = Paths.get(albumCoversDirectory, fileName);
        Path tempPath = Paths.get(albumCoversDirectory, fileName + ".tmp");
        try {
            Files.createDirectories(Paths.get(albumCoversDirectory));
            Files.copy(file.getInputStream(), tempPath, StandardCopyOption.REPLACE_EXISTING);
            encryption.encryptFile(
                    tempPath,
                    destination,
                    encryption.decryptWithMasterKey(user.getEncryption_key()));
            return fileName;
        } catch (IOException e) {
            throw new StorageOperationException("Failed to upload album cover", e);
        } finally {
            try {
                Files.deleteIfExists(tempPath);
            } catch (IOException e) {
                throw new StorageOperationException("Failed to clean up album cover temp file", e);
            }
        }
    }

    public void deleteAlbumCover(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return;
        }
        deleteFileIfPresent(Paths.get(albumCoversDirectory, fileName).toString(), "Failed to delete album cover");
    }

    public byte[] decryptAlbumCover(String fileName, User user) {
        return decryptFile(Paths.get(albumCoversDirectory, fileName), user);
    }

    public String imageContentTypeFromFileName(String fileName) {
        String contentType = fileTypeFromExtension(extractFormatFromFilename(fileName));
        return contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
