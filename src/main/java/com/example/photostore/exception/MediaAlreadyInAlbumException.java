package com.example.photostore.exception;

public class MediaAlreadyInAlbumException extends RuntimeException {
    public MediaAlreadyInAlbumException(Long albumId, Long mediaId) {
        super("Media file " + mediaId + " is already in album " + albumId);
    }
}
