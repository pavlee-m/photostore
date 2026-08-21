package com.example.photostore.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.AlbumDTO;
import com.example.photostore.dtos.MediaFileDTO;
import com.example.photostore.entity.Album;
import com.example.photostore.entity.AlbumMedia;
import com.example.photostore.entity.AlbumMediaFileId;
import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.User;
import com.example.photostore.exception.AlbumCoverNotFoundException;
import com.example.photostore.exception.AlbumNotFoundException;
import com.example.photostore.exception.MediaAlreadyInAlbumException;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.repository.AlbumMediaRepository;
import com.example.photostore.repository.AlbumRepository;
import com.example.photostore.repository.MediaFileRepository;
import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final AlbumMediaRepository albumMediaRepository;
    private final MediaFileRepository mediaFileRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Transactional
    public AlbumDTO create(Long userId, String name, String description, MultipartFile cover) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        Album album = new Album();
        album.setName(requireName(name));
        album.setDescription(description != null ? description : "");
        album.setCreatedAt(Instant.now());
        album.setUser(user);
        album = albumRepository.save(album);

        if (cover != null && !cover.isEmpty()) {
            String fileName = storageService.uploadAlbumCover(album.getId(), user, cover);
            album.setCoverPhotoUrl(fileName);
            album = albumRepository.save(album);
        }
        return AlbumDTO.from(album);
    }

    @Transactional
    public AlbumDTO update(Long albumId, Long userId, String name, String description, MultipartFile cover) {
        Album album = requireOwnedAlbum(albumId, userId);
        if (name != null) {
            album.setName(requireName(name));
        }
        if (description != null) {
            album.setDescription(description);
        }
        if (cover != null && !cover.isEmpty()) {
            String previousCover = album.getCoverPhotoUrl();
            String fileName = storageService.uploadAlbumCover(album.getId(), album.getUser(), cover);
            if (previousCover != null && !previousCover.equals(fileName)) {
                storageService.deleteAlbumCover(previousCover);
            }
            album.setCoverPhotoUrl(fileName);
        }
        return AlbumDTO.from(albumRepository.save(album));
    }

    @Transactional
    public void delete(Long albumId, Long userId) {
        Album album = requireOwnedAlbum(albumId, userId);
        albumMediaRepository.deleteByAlbum_Id(albumId);
        storageService.deleteAlbumCover(album.getCoverPhotoUrl());
        albumRepository.delete(album);
    }

    @Transactional
    public void addMedia(Long albumId, Long mediaId, Long userId) {
        Album album = requireOwnedAlbum(albumId, userId);
        MediaFile media = mediaFileRepository.findByIdAndUser_Id(mediaId, userId)
                .orElseThrow(() -> new MediaFileNotFoundException(mediaId));
        AlbumMediaFileId joinId = new AlbumMediaFileId(albumId, mediaId);
        if (albumMediaRepository.existsById(joinId)) {
            throw new MediaAlreadyInAlbumException(albumId, mediaId);
        }
        AlbumMedia albumMedia = new AlbumMedia();
        albumMedia.setId(joinId);
        albumMedia.setAlbum(album);
        albumMedia.setMedia(media);
        albumMedia.setAddedAt(Instant.now());
        albumMediaRepository.save(albumMedia);
    }

    @Transactional
    public void removeMedia(Long albumId, Long mediaId, Long userId) {
        requireOwnedAlbum(albumId, userId);
        AlbumMediaFileId joinId = new AlbumMediaFileId(albumId, mediaId);
        if (!albumMediaRepository.existsById(joinId)) {
            throw new MediaFileNotFoundException(mediaId);
        }
        albumMediaRepository.deleteById(joinId);
    }

    public List<AlbumDTO> list(Long userId) {
        return albumRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AlbumDTO::from)
                .toList();
    }

    public List<MediaFileDTO> listMedia(Long albumId, Long userId) {
        requireOwnedAlbum(albumId, userId);
        List<MediaFileDTO> media = new ArrayList<>();
        for (AlbumMedia albumMedia : albumMediaRepository.findByAlbum_IdOrderByAddedAtDesc(albumId)) {
            media.add(MediaFileDTO.from(albumMedia.getMedia()));
        }
        return media;
    }

    public CoverFile getCover(Long albumId, Long userId) {
        Album album = requireOwnedAlbum(albumId, userId);
        if (!StringUtils.hasText(album.getCoverPhotoUrl())) {
            throw new AlbumCoverNotFoundException(albumId);
        }
        return new CoverFile(
                storageService.decryptAlbumCover(album.getCoverPhotoUrl(), album.getUser()),
                storageService.imageContentTypeFromFileName(album.getCoverPhotoUrl()));
    }

    public record CoverFile(byte[] data, String contentType) {
    }

    @Transactional
    public void deleteAllForUser(Long userId) {
        for (Album album : albumRepository.findByUser_Id(userId)) {
            albumMediaRepository.deleteByAlbum_Id(album.getId());
            storageService.deleteAlbumCover(album.getCoverPhotoUrl());
            albumRepository.delete(album);
        }
    }

    private Album requireOwnedAlbum(Long albumId, Long userId) {
        return albumRepository.findByIdAndUser_Id(albumId, userId)
                .orElseThrow(() -> new AlbumNotFoundException(albumId));
    }

    private String requireName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Album name is required");
        }
        return name.trim();
    }
}
