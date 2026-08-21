package com.example.photostore.dtos;

import java.time.Instant;

import com.example.photostore.entity.Album;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumDTO {
    private Long id;
    private String name;
    private String description;
    private Instant createdAt;
    private String coverPhotoUrl;

    public static AlbumDTO from(Album album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .createdAt(album.getCreatedAt())
                .coverPhotoUrl(album.getCoverPhotoUrl())
                .build();
    }
}
