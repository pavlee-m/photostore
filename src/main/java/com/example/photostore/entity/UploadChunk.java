package com.example.photostore.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "upload_chunks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadChunk {

    @EmbeddedId
    private UploadChunkId id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @MapsId("uploadId")
    @JoinColumn(name = "upload_id", nullable = false)
    private UploadSession session;
}
