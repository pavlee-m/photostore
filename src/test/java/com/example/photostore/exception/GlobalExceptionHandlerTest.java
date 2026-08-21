package com.example.photostore.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.photostore.config.GlobalExceptionHandler;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void mapsAlbumNotFoundToNotFoundResponse() throws Exception {
        mockMvc.perform(get("/test/album"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ALBUM_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void mapsMediaAlreadyInAlbumToConflictResponse() throws Exception {
        mockMvc.perform(get("/test/album-media"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MEDIA_ALREADY_IN_ALBUM"))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void mapsEmailAlreadyExistsToConflictResponse() throws Exception {
        mockMvc.perform(get("/test/email"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("Email already exists!"))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void mapsInvalidFileToBadRequestResponse() throws Exception {
        mockMvc.perform(get("/test/file"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_FILE"))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void mapsUnsupportedMethodToMethodNotAllowedResponse() throws Exception {
        mockMvc.perform(post("/test/get-only"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                .andExpect(jsonPath("$.message").value("HTTP method not allowed for this route."))
                .andExpect(jsonPath("$.status").value(405));
    }

    @RestController
    static class FailingController {
        @GetMapping("/test/album")
        void album() {
            throw new AlbumNotFoundException(3L);
        }

        @GetMapping("/test/album-media")
        void albumMedia() {
            throw new MediaAlreadyInAlbumException(3L, 42L);
        }

        @GetMapping("/test/email")
        void email() {
            throw new EmailAlreadyExistsException();
        }

        @GetMapping("/test/file")
        void file() {
            throw new InvalidFileException("File is empty");
        }

        @GetMapping("/test/get-only")
        void getOnly() {
        }
    }
}
