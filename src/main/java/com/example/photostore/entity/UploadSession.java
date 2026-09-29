package com.example.photostore.entity;

import java.time.Instant;
import java.util.ArrayList;
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

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "upload_sessions")
public class UploadSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long uploadId;

    // So as to not trust file names uploaded from the client.
    // True filename is stored, but physically is stored with this name.
    @Column(nullable = false)
    private String uploadedFileName;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private String hash;

    @Column(nullable = false)
    private Long totalSize;

    @Column(nullable = false)
    private Integer totalChunks;

    @ManyToOne
    @JoinColumn(name = "upload_status_id", nullable = false)
    private UploadStatus uploadStatus;

    @Column(nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UploadChunk> chunks = new ArrayList<>();
}
