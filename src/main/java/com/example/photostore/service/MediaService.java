package com.example.photostore.service;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.UploadSession;
import com.example.photostore.entity.User;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.repository.AlbumMediaRepository;
import com.example.photostore.repository.MediaFileRepository;
import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaFileRepository mediaFileRepository;
    private final AlbumMediaRepository albumMediaRepository;
    private final UserRepository userRepository;

    @Autowired
    private StorageService storageService;

    public MediaFile findByHash(String hash) {
        return mediaFileRepository.findByHash(hash);
    }

    @Transactional
    public MediaFile saveFromUpload(UploadSession session, String path, String extension) {
        User user = session.getUser();

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
        storageService.deleteStoredFile(path);
    }

    @Transactional
    public void deleteAllForUser(Long userId) {
        for (MediaFile mediaFile : mediaFileRepository.findByUser_Id(userId)) {
            albumMediaRepository.deleteByMedia_Id(mediaFile.getId());
            String path = mediaFile.getPath();
            mediaFileRepository.delete(mediaFile);
            storageService.deleteStoredFile(path);
        }
    }

    public MediaFile findByHashAndUser_Id(String hash, Long userId) {
        return mediaFileRepository.findByHashAndUser_Id(hash, userId);
    }

    public List<MediaFile> findByUser_IdOrderByUploadedAtDesc(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return mediaFileRepository.findByUser_IdOrderByUploadedAtDesc(userId, pageable);
    }

    public MediaFile findById(Long id, Long userId) {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new MediaFileNotFoundException(id));
        if (!mediaFile.getUser().getId().equals(userId)) {
            throw new MediaFileNotFoundException(id);
        }
        return mediaFile;
    }
}
