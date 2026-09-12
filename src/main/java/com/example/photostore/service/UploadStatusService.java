package com.example.photostore.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import com.example.photostore.entity.UploadStatus;
import com.example.photostore.repository.UploadStatusRepository;

@Service
@RequiredArgsConstructor
public class UploadStatusService {
    
    private final UploadStatusRepository uploadStatusRepository;

    public UploadStatus createUploadStatus(String uploadStatus) {
        UploadStatus uploadStatusEntity = new UploadStatus();
        uploadStatusEntity.setStatus(uploadStatus);
        return uploadStatusRepository.save(uploadStatusEntity);
    }

    public UploadStatus getUploadStatus(String uploadStatus) {
        return uploadStatusRepository.findByStatus(uploadStatus);
    }

}
