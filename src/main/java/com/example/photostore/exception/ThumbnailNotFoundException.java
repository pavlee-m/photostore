package com.example.photostore.exception;

public class ThumbnailNotFoundException extends RuntimeException {
    public ThumbnailNotFoundException(Long mediaId) {
        super("Thumbnail not found for media id: " + mediaId);
    }
}
