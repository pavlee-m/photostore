package com.example.photostore.entity;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "upload_chunks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadChunk {

    @EmbeddedId
    private UploadChunkId id;

    @ManyToOne
    @MapsId("uploadId")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "upload_id", nullable = false)
    private UploadSession session;
}
