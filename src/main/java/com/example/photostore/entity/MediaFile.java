package com.example.photostore.entity;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "media_files")
public class MediaFile {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    @Column(nullable=false)
    private String fileType;
    
    @Column(nullable=false)
    private String path;

    @Column(nullable=false)
    private String extension;

    @Column(nullable=false)
    private Long size;

    @Column(nullable=false)
    private Instant uploadedAt;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @OneToMany(mappedBy="media", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AlbumMedia> albumMedia;

    // To avoid duplicate files
    @Column(nullable=false, unique=true)
    private String hash;

    @Column
    private String thumbnailPath;
}
