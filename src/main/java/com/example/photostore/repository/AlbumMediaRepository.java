package com.example.photostore.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.AlbumMedia;
import com.example.photostore.entity.AlbumMediaFileId;

public interface AlbumMediaRepository extends JpaRepository<AlbumMedia, AlbumMediaFileId> {
    void deleteByMedia_Id(Long mediaId);
    void deleteByAlbum_Id(Long albumId);
    List<AlbumMedia> findByAlbum_IdOrderByAddedAtDesc(Long albumId);
}
