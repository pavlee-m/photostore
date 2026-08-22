package com.example.photostore.exception;

public class ProfilePictureNotFoundException extends RuntimeException {
    public ProfilePictureNotFoundException(Long userId) {
        super("Profile picture not found for user id: " + userId);
    }
}
