package com.example.photostore.startup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.photostore.service.UploadStatusService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class UploadStatusInitializer implements ApplicationRunner {

    @Autowired
    private final UploadStatusService uploadStatusService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (uploadStatusService.getUploadStatus("UPLOADING") == null) {
            uploadStatusService.createUploadStatus("UPLOADING");
        }
        if (uploadStatusService.getUploadStatus("UPLOADED") == null) {
            uploadStatusService.createUploadStatus("UPLOADED");
        }
    }
}