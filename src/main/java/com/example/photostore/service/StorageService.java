package com.example.photostore.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {
    
    // TODO: Implement file upload
    // TODO: Implement file validation to allow only images
    public void uploadFile(Long userId, MultipartFile file) {
        throw new UnsupportedOperationException("Not implemented");
    }
}
