package com.example.photostore.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbumMediaFileId implements Serializable {

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    @Column(name = "media_file_id", nullable = false)
    private Long mediaId;
}
