package com.example.photostore.dtos;

import java.time.Instant;

import com.example.photostore.entity.MediaFile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaFileDTO {
    private Long id;
    private String name;
    private String fileType;
    private String extension;
    private Long size;
    private Instant uploadedAt;

    public static MediaFileDTO from(MediaFile media) {
        return MediaFileDTO.builder()
                .id(media.getId())
                .name(media.getName())
                .fileType(media.getFileType())
                .extension(media.getExtension())
                .size(media.getSize())
                .uploadedAt(media.getUploadedAt())
                .build();
    }
}
