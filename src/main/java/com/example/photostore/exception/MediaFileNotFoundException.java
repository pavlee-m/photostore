package com.example.photostore.exception;

public class MediaFileNotFoundException extends RuntimeException {
    public MediaFileNotFoundException(Long mediaId) {
        super("Media file not found with id: " + mediaId);
    }
}
