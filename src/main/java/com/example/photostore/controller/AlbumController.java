package com.example.photostore.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.AlbumDTO;
import com.example.photostore.dtos.MediaFileDTO;
import com.example.photostore.service.AlbumService;

@RestController
@RequestMapping("/api/v1/albums")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AlbumDTO> createAlbum(
            Authentication authentication,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "cover", required = false) MultipartFile cover) {
        final Long userId = Long.parseLong(authentication.getName());
        AlbumDTO album = albumService.create(userId, name, description, cover);
        return ResponseEntity.status(HttpStatus.CREATED).body(album);
    }

    @PatchMapping(value = "/{albumId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AlbumDTO> updateAlbum(
            Authentication authentication,
            @PathVariable Long albumId,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "cover", required = false) MultipartFile cover) {
        final Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(albumService.update(albumId, userId, name, description, cover));
    }

    @DeleteMapping("/{albumId}")
    public ResponseEntity<String> deleteAlbum(Authentication authentication, @PathVariable Long albumId) {
        final Long userId = Long.parseLong(authentication.getName());
        albumService.delete(albumId, userId);
        return ResponseEntity.ok("Album deleted successfully!");
    }

    @GetMapping
    public ResponseEntity<List<AlbumDTO>> listAlbums(Authentication authentication) {
        final Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(albumService.list(userId));
    }

    @GetMapping("/{albumId}/media")
    public ResponseEntity<List<MediaFileDTO>> listAlbumMedia(
            Authentication authentication,
            @PathVariable Long albumId) {
        final Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(albumService.listMedia(albumId, userId));
    }

    @GetMapping("/{albumId}/cover")
    public ResponseEntity<byte[]> getAlbumCover(Authentication authentication, @PathVariable Long albumId) {
        final Long userId = Long.parseLong(authentication.getName());
        AlbumService.CoverFile cover = albumService.getCover(albumId, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(cover.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(cover.data());
    }

    @PostMapping("/{albumId}/media/{mediaId}")
    public ResponseEntity<String> addMedia(
            Authentication authentication,
            @PathVariable Long albumId,
            @PathVariable Long mediaId) {
        final Long userId = Long.parseLong(authentication.getName());
        albumService.addMedia(albumId, mediaId, userId);
        return ResponseEntity.ok("Media added to album successfully!");
    }

    @DeleteMapping("/{albumId}/media/{mediaId}")
    public ResponseEntity<String> removeMedia(
            Authentication authentication,
            @PathVariable Long albumId,
            @PathVariable Long mediaId) {
        final Long userId = Long.parseLong(authentication.getName());
        albumService.removeMedia(albumId, mediaId, userId);
        return ResponseEntity.ok("Media removed from album successfully!");
    }
}
