package com.example.photostore.exception;

public class AlbumCoverNotFoundException extends RuntimeException {
    public AlbumCoverNotFoundException(Long albumId) {
        super("Album cover not found for album id: " + albumId);
    }
}
