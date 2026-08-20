package com.example.photostore.upload;

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
public class UploadInitResponse {
    private boolean alreadyUploaded;
    private String uploadId;
    private Long mediaId;

    public static UploadInitResponse started(String uploadId) {
        return UploadInitResponse.builder()
                .alreadyUploaded(false)
                .uploadId(uploadId)
                .build();
    }

    public static UploadInitResponse existing(Long mediaId) {
        return UploadInitResponse.builder()
                .alreadyUploaded(true)
                .mediaId(mediaId)
                .build();
    }
}
