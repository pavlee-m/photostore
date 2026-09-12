package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.UploadSession;
import com.example.photostore.entity.UploadStatus;
import com.example.photostore.entity.User;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.MediaService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UploadSessionService;
import com.example.photostore.service.UserService;
import com.example.photostore.upload.FinalizedUpload;
import com.example.photostore.upload.UploadProgress;

@WebMvcTest(MediaController.class)
@AutoConfigureMockMvc(addFilters = false)
class MediaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MediaService mediaService;

    @MockitoBean
    private StorageService storageService;

    @MockitoBean
    private UploadSessionService uploadSessionService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @Test
    void initUpload_whenFileExistsForUser_returnsExistingMediaId() throws Exception {
        User user = new User();
        user.setId(7L);
        MediaFile existing = new MediaFile();
        existing.setId(42L);
        when(userService.findById(7L)).thenReturn(user);
        when(mediaService.findByHashAndUser_Id("abc123", 7L)).thenReturn(existing);

        mockMvc.perform(post("/api/v1/media/upload-init")
                        .principal(authentication())
                        .param("filename", "photo.jpg")
                        .param("totalSize", "1024")
                        .param("totalChunks", "1")
                        .param("fileHash", "abc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyUploaded").value(true))
                .andExpect(jsonPath("$.mediaId").value(42))
                .andExpect(jsonPath("$.uploadId").doesNotExist());

        verify(storageService, never()).initializeUpload(any(), anyLong(), anyInt(), any(), any());
    }

    @Test
    void initUpload_whenFileIsNew_returnsUploadId() throws Exception {
        User user = new User();
        user.setId(7L);
        when(userService.findById(7L)).thenReturn(user);
        when(mediaService.findByHashAndUser_Id("abc123", 7L)).thenReturn(null);
        when(storageService.initializeUpload("photo.jpg", 1024L, 1, "abc123", user))
                .thenReturn("123");

        mockMvc.perform(post("/api/v1/media/upload-init")
                        .principal(authentication())
                        .param("filename", "photo.jpg")
                        .param("totalSize", "1024")
                        .param("totalChunks", "1")
                        .param("fileHash", "abc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyUploaded").value(false))
                .andExpect(jsonPath("$.uploadId").value("123"))
                .andExpect(jsonPath("$.mediaId").doesNotExist());
    }

    @Test
    void uploadChunk_whenUploadCompletes_returnsSavedMediaId() throws Exception {
        User user = new User();
        user.setId(7L);
        UploadSession session = new UploadSession();
        session.setUploadId(123L);
        session.setUser(user);
        FinalizedUpload finalized = new FinalizedUpload(
                session,
                "/storage/file.jpg",
                "jpg",
                "/thumbnails/file.jpg");
        MediaFile saved = new MediaFile();
        saved.setId(42L);

        when(uploadSessionService.getByUserIdAndUploadId(7L, 123L)).thenReturn(session);
        when(storageService.processChunk(anyLong(), anyInt(), any())).thenReturn(true);
        when(storageService.finalizeUpload(123L, user)).thenReturn(finalized);
        when(userService.findById(7L)).thenReturn(user);
        when(mediaService.saveFromUpload(
                session,
                finalized.storedPath(),
                finalized.extension(),
                finalized.thumbnailPath()))
                .thenReturn(saved);

        mockMvc.perform(multipart("/api/v1/media/upload-chunk")
                        .file(new MockMultipartFile("chunk", "chunk", "application/octet-stream", new byte[] {1}))
                        .principal(authentication())
                        .param("uploadId", "123")
                        .param("chunkIndex", "0"))
                .andExpect(status().isOk())
                .andExpect(content().string("42"));
    }

    @Test
    void uploadChunk_whenIncomplete_doesNotFinalize() throws Exception {
        UploadSession session = ownedSession();
        when(uploadSessionService.getByUserIdAndUploadId(7L, 123L)).thenReturn(session);
        when(storageService.processChunk(anyLong(), anyInt(), any())).thenReturn(false);

        mockMvc.perform(multipart("/api/v1/media/upload-chunk")
                        .file(new MockMultipartFile("chunk", "chunk", "application/octet-stream", new byte[] {1}))
                        .principal(authentication())
                        .param("uploadId", "123")
                        .param("chunkIndex", "0"))
                .andExpect(status().isOk())
                .andExpect(content().string("Chunk uploaded successfully"));

        verify(storageService, never()).finalizeUpload(anyLong(), any());
    }

    @Test
    void uploadChunk_whenNotOwned_returnsForbidden() throws Exception {
        when(uploadSessionService.getByUserIdAndUploadId(7L, 123L)).thenReturn(null);

        mockMvc.perform(multipart("/api/v1/media/upload-chunk")
                        .file(new MockMultipartFile("chunk", "chunk", "application/octet-stream", new byte[] {1}))
                        .principal(authentication())
                        .param("uploadId", "123")
                        .param("chunkIndex", "0"))
                .andExpect(status().isForbidden())
                .andExpect(content().string("Forbidden"));

        verify(storageService, never()).processChunk(anyLong(), anyInt(), any());
    }

    @Test
    void getUploadStatus_whenOwned_returnsProgressAndSessionStatus() throws Exception {
        UploadSession session = ownedSession();
        session.setUploadStatus(new UploadStatus(1L, "UPLOADING"));
        UploadProgress progress = UploadProgress.builder()
                .totalChunks(4)
                .missing(java.util.List.of(2, 3))
                .build();
        when(uploadSessionService.getByUserIdAndUploadId(7L, 123L)).thenReturn(session);
        when(storageService.getUploadStatus(123L)).thenReturn(progress);

        mockMvc.perform(get("/api/v1/media/upload-status")
                        .principal(authentication())
                        .param("uploadId", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalChunks").value(4))
                .andExpect(jsonPath("$.missing[0]").value(2))
                .andExpect(jsonPath("$.missing[1]").value(3))
                .andExpect(jsonPath("$.uploadStatus").value("UPLOADING"));
    }

    @Test
    void getUploadStatus_whenNotOwned_returnsForbidden() throws Exception {
        when(uploadSessionService.getByUserIdAndUploadId(7L, 123L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/media/upload-status")
                        .principal(authentication())
                        .param("uploadId", "123"))
                .andExpect(status().isForbidden());

        verify(storageService, never()).getUploadStatus(anyLong());
    }

    @Test
    void deleteMedia_deletesOwnedFile() throws Exception {
        mockMvc.perform(delete("/api/v1/media/42")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(content().string("Media deleted successfully!"));

        verify(mediaService).deleteMedia(42L, 7L);
    }

    @Test
    void deleteMedia_mapsNotFoundError() throws Exception {
        doThrow(new MediaFileNotFoundException(42L))
                .when(mediaService).deleteMedia(42L, 7L);

        mockMvc.perform(delete("/api/v1/media/42")
                        .principal(authentication()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MEDIA_NOT_FOUND"));
    }

    @Test
    void listMedia_returnsDtoWithoutEntityAssociations() throws Exception {
        MediaFile media = new MediaFile();
        media.setId(42L);
        media.setName("photo.jpg");
        media.setFileType("image/jpeg");
        media.setExtension("jpg");
        media.setSize(1024L);
        media.setUploadedAt(java.time.Instant.parse("2026-08-20T18:00:00Z"));
        media.setPath("/secret/storage/photo.enc");
        media.setHash("abc123");
        User owner = new User();
        owner.setId(7L);
        owner.setPassword("secret");
        media.setUser(owner);
        when(mediaService.findByUser_IdOrderByUploadedAtDesc(7L, 0, 12))
                .thenReturn(java.util.List.of(media));

        mockMvc.perform(get("/api/v1/media/list")
                        .principal(authentication())
                        .param("page", "0")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42))
                .andExpect(jsonPath("$[0].name").value("photo.jpg"))
                .andExpect(jsonPath("$[0].fileType").value("image/jpeg"))
                .andExpect(jsonPath("$[0].size").value(1024))
                .andExpect(jsonPath("$[0].user").doesNotExist())
                .andExpect(jsonPath("$[0].albumMedia").doesNotExist())
                .andExpect(jsonPath("$[0].path").doesNotExist())
                .andExpect(jsonPath("$[0].hash").doesNotExist());
    }

    @Test
    void getThumbnail_returnsJpegBytes() throws Exception {
        when(mediaService.getOrCreateThumbnail(42L, 7L)).thenReturn(new byte[] {1, 2, 3});

        mockMvc.perform(get("/api/v1/media/42/thumbnail")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(org.springframework.http.MediaType.IMAGE_JPEG));

        verify(mediaService).getOrCreateThumbnail(42L, 7L);
    }

    @Test
    void getThumbnail_mapsNotFoundError() throws Exception {
        when(mediaService.getOrCreateThumbnail(42L, 7L))
                .thenThrow(new com.example.photostore.exception.ThumbnailNotFoundException(42L));

        mockMvc.perform(get("/api/v1/media/42/thumbnail")
                        .principal(authentication()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("THUMBNAIL_NOT_FOUND"));
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken("7", null, java.util.List.of());
    }

    private static UploadSession ownedSession() {
        User user = new User();
        user.setId(7L);
        UploadSession session = new UploadSession();
        session.setUploadId(123L);
        session.setUser(user);
        return session;
    }
}
