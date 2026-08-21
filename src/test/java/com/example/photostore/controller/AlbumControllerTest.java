package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.dtos.AlbumDTO;
import com.example.photostore.dtos.MediaFileDTO;
import com.example.photostore.exception.AlbumNotFoundException;
import com.example.photostore.exception.MediaAlreadyInAlbumException;
import com.example.photostore.service.AlbumService;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;

@WebMvcTest(AlbumController.class)
@AutoConfigureMockMvc(addFilters = false)
class AlbumControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AlbumService albumService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @Test
    void createAlbum_returnsCreatedAlbum() throws Exception {
        AlbumDTO album = AlbumDTO.builder()
                .id(3L)
                .name("Vacation")
                .description("2024 trip")
                .createdAt(Instant.parse("2026-08-21T12:00:00Z"))
                .coverPhotoUrl("3_7.jpeg")
                .build();
        when(albumService.create(eq(7L), eq("Vacation"), eq("2024 trip"), any()))
                .thenReturn(album);

        mockMvc.perform(multipart("/api/v1/albums")
                        .file(new MockMultipartFile("cover", "cover.jpg", "image/jpeg", new byte[] {1, 2, 3}))
                        .param("name", "Vacation")
                        .param("description", "2024 trip")
                        .principal(authentication()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Vacation"))
                .andExpect(jsonPath("$.coverPhotoUrl").value("3_7.jpeg"))
                .andExpect(jsonPath("$.user").doesNotExist())
                .andExpect(jsonPath("$.albumMedia").doesNotExist());
    }

    @Test
    void updateAlbum_updatesNameAndDescription() throws Exception {
        AlbumDTO album = AlbumDTO.builder()
                .id(3L)
                .name("Updated")
                .description("New description")
                .createdAt(Instant.parse("2026-08-21T12:00:00Z"))
                .build();
        when(albumService.update(eq(3L), eq(7L), eq("Updated"), eq("New description"), isNull()))
                .thenReturn(album);

        mockMvc.perform(multipart("/api/v1/albums/3")
                        .param("name", "Updated")
                        .param("description", "New description")
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        })
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.description").value("New description"));
    }

    @Test
    void deleteAlbum_deletesOwnedAlbum() throws Exception {
        mockMvc.perform(delete("/api/v1/albums/3")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(content().string("Album deleted successfully!"));

        verify(albumService).delete(3L, 7L);
    }

    @Test
    void deleteAlbum_mapsNotFoundError() throws Exception {
        doThrow(new AlbumNotFoundException(3L)).when(albumService).delete(3L, 7L);

        mockMvc.perform(delete("/api/v1/albums/3")
                        .principal(authentication()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ALBUM_NOT_FOUND"));
    }

    @Test
    void addMedia_addsOwnedPhoto() throws Exception {
        mockMvc.perform(post("/api/v1/albums/3/media/42")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(content().string("Media added to album successfully!"));

        verify(albumService).addMedia(3L, 42L, 7L);
    }

    @Test
    void addMedia_mapsConflictWhenAlreadyInAlbum() throws Exception {
        doThrow(new MediaAlreadyInAlbumException(3L, 42L))
                .when(albumService).addMedia(3L, 42L, 7L);

        mockMvc.perform(post("/api/v1/albums/3/media/42")
                        .principal(authentication()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEDIA_ALREADY_IN_ALBUM"));
    }

    @Test
    void removeMedia_removesPhotoFromAlbum() throws Exception {
        mockMvc.perform(delete("/api/v1/albums/3/media/42")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(content().string("Media removed from album successfully!"));

        verify(albumService).removeMedia(3L, 42L, 7L);
    }

    @Test
    void listAlbums_returnsDtoWithoutAssociations() throws Exception {
        AlbumDTO album = AlbumDTO.builder()
                .id(3L)
                .name("Vacation")
                .description("2024 trip")
                .createdAt(Instant.parse("2026-08-21T12:00:00Z"))
                .coverPhotoUrl("3_7.jpeg")
                .build();
        when(albumService.list(7L)).thenReturn(List.of(album));

        mockMvc.perform(get("/api/v1/albums")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].name").value("Vacation"))
                .andExpect(jsonPath("$[0].user").doesNotExist())
                .andExpect(jsonPath("$[0].albumMedia").doesNotExist());
    }

    @Test
    void listAlbumMedia_returnsMediaDtos() throws Exception {
        MediaFileDTO media = MediaFileDTO.builder()
                .id(42L)
                .name("photo.jpg")
                .fileType("image/jpeg")
                .extension("jpg")
                .size(1024L)
                .uploadedAt(Instant.parse("2026-08-21T12:00:00Z"))
                .build();
        when(albumService.listMedia(3L, 7L)).thenReturn(List.of(media));

        mockMvc.perform(get("/api/v1/albums/3/media")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42))
                .andExpect(jsonPath("$[0].name").value("photo.jpg"))
                .andExpect(jsonPath("$[0].path").doesNotExist());
    }

    @Test
    void getAlbumCover_returnsDecryptedBytes() throws Exception {
        when(albumService.getCover(3L, 7L))
                .thenReturn(new AlbumService.CoverFile(new byte[] {9, 8, 7}, "image/jpeg"));

        mockMvc.perform(get("/api/v1/albums/3/cover")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(new byte[] {9, 8, 7}));
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken("7", null, List.of());
    }
}
