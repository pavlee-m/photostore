package com.example.photostore.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.AlbumMedia;
import com.example.photostore.entity.AlbumMediaFileId;

public interface AlbumMediaRepository extends JpaRepository<AlbumMedia, AlbumMediaFileId> {
    void deleteByMedia_Id(Long mediaId);
}
