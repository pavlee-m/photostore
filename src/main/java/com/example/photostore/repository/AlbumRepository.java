package com.example.photostore.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.Album;

public interface AlbumRepository extends JpaRepository<Album, Long> {
    List<Album> findByUser_IdOrderByCreatedAtDesc(Long userId);
    Optional<Album> findByIdAndUser_Id(Long id, Long userId);
    List<Album> findByUser_Id(Long userId);
}