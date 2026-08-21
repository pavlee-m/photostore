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
public class UploadChunkId implements Serializable {

    @Column(name = "upload_id", nullable = false)
    private String uploadId;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;
}
