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
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.entity.MediaFile;
import com.example.photostore.entity.User;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.MediaService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UserService;

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
                .thenReturn("uuid.jpg");

        mockMvc.perform(post("/api/v1/media/upload-init")
                        .principal(authentication())
                        .param("filename", "photo.jpg")
                        .param("totalSize", "1024")
                        .param("totalChunks", "1")
                        .param("fileHash", "abc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyUploaded").value(false))
                .andExpect(jsonPath("$.uploadId").value("uuid.jpg"))
                .andExpect(jsonPath("$.mediaId").doesNotExist());
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
}
