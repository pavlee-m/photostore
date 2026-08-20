package com.example.photostore.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "album_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbumMedia {

    @EmbeddedId
    private AlbumMediaFileId id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @MapsId("albumId")
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @MapsId("mediaId")
    @JoinColumn(name = "media_file_id", nullable = false)
    private MediaFile media;

    @Column(nullable = false)
    private Instant addedAt;
}
