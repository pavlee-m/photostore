package com.example.photostore.upload;

import com.example.photostore.entity.UploadSession;

public record FinalizedUpload(UploadSession session, String storedPath, String extension, String thumbnailPath) {
}
