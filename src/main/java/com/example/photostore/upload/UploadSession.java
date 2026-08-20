package com.example.photostore.upload;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class UploadSession {
    private Long userId;
    private String fileName;
    private String fileType;
    private String hash;
    private Long totalSize;
    private Integer totalChunks;
    private Boolean[] receivedChunks;
    private Instant createdAt;
}
