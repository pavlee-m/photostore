package com.example.photostore.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.MediaFile;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {
    MediaFile findByHash(String hash);
    MediaFile findByHashAndUser_Id(String hash, Long userId);    
    List<MediaFile> findByUser_IdOrderByUploadedAtDesc(Long userId, Pageable pageable);

}
