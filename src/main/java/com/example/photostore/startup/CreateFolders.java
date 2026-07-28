package com.example.photostore.startup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.photostore.service.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreateFolders implements ApplicationRunner {

    @Autowired
    private final StorageService storageService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        storageService.createFolders();
    }
}
