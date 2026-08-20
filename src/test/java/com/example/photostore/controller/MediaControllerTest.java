package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken("7", null, java.util.List.of());
    }
}
