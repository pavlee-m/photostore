package com.example.photostore.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.User;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.exception.StorageOperationException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.repository.AlbumMediaRepository;
import com.example.photostore.repository.MediaFileRepository;
import com.example.photostore.repository.UserRepository;
import com.example.photostore.upload.UploadSession;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaFileRepository mediaFileRepository;
    private final AlbumMediaRepository albumMediaRepository;
    private final UserRepository userRepository;

    public MediaFile findByHash(String hash) {
        return mediaFileRepository.findByHash(hash);
    }

    @Transactional
    public MediaFile saveFromUpload(UploadSession session, String path, String extension) {
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + session.getUserId()));

        MediaFile mediaFile = new MediaFile();
        mediaFile.setName(session.getFileName());
        mediaFile.setFileType(session.getFileType());
        mediaFile.setPath(path);
        mediaFile.setExtension(extension);
        mediaFile.setSize(session.getTotalSize());
        mediaFile.setUploadedAt(Instant.now());
        mediaFile.setUser(user);
        mediaFile.setHash(session.getHash());

        MediaFile saved = mediaFileRepository.save(mediaFile);
        user.setStorage_used(user.getStorage_used() + (float) (session.getTotalSize() / (1024.0 * 1024.0)));
        userRepository.save(user);
        return saved;
    }

    @Transactional
    public void deleteMedia(Long mediaId, Long userId) {
        MediaFile mediaFile = mediaFileRepository.findById(mediaId)
                .orElseThrow(() -> new MediaFileNotFoundException(mediaId));
        if (!mediaFile.getUser().getId().equals(userId)) {
            throw new MediaFileNotFoundException(mediaId);
        }

        albumMediaRepository.deleteByMedia_Id(mediaId);

        User user = mediaFile.getUser();
        float remaining = user.getStorage_used() - (float) (mediaFile.getSize() / (1024.0 * 1024.0));
        user.setStorage_used(Math.max(0.0f, remaining));
        userRepository.save(user);

        String path = mediaFile.getPath();
        mediaFileRepository.delete(mediaFile);
        deleteStoredFile(path);
    }

    private void deleteStoredFile(String path) {
        if (!StringUtils.hasText(path)) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (IOException e) {
            throw new StorageOperationException("Failed to delete media file", e);
        }
    }

    public MediaFile findByHashAndUser_Id(String hash, Long userId) {
        return mediaFileRepository.findByHashAndUser_Id(hash, userId);
    }
}
