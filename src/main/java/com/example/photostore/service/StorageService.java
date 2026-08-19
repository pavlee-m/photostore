package com.example.photostore.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.exception.InvalidFileException;
import com.example.photostore.exception.StorageOperationException;

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

    @Value("${photostore.storage_max_size_mb}")
    private int storageMaxSizeMb;


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

    // Will be used for general image/video upload
    // private void validateUploadFile(MultipartFile file) {
    //     String contentType = file.getContentType();
    //     if (file == null || file.isEmpty()) {
    //         throw new InvalidFileException("File is empty");
    //     }
    //     else if (file.getSize() > maxFileSize.toBytes()) {
    //         throw new InvalidFileException("File size is too large");
    //     }
    //     else if (contentType == null
    //             || (!allowedFileExtensionsImage.contains(extractFormatFromMimeType(contentType))
    //                 && !allowedFileExtensionsVideo.contains(extractFormatFromMimeType(contentType)))) {
    //         throw new InvalidFileException("File type is not allowed");
    //     }
    // }

    private String extractFormatFromMimeType(String mimeType) {
        return mimeType.split("/")[1];

    }

    public void deleteProfilePicture(String profilePictureUrl) {
        if (!StringUtils.hasText(profilePictureUrl)) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(profilePictureUrl));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to delete profile picture", e);
        }
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

    public int getStorageMaxSizeMb() {
        return storageMaxSizeMb;
    }

    public void createFolders() {
        try {
            Files.createDirectories(Paths.get(profilePicturesDirectory));
            Files.createDirectories(Paths.get(storageDirectory));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to create folders", e);
        }
    }
    
}
