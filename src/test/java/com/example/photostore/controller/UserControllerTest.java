package com.example.photostore.controller;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.Role;
import com.example.photostore.exception.EmailAlreadyExistsException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.UserService;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @Test
    void getUserDetails_returnsCurrentUser() throws Exception {
        UserDTO user = UserDTO.builder()
                .id(7L)
                .email("user@example.com")
                .storage_space(25600.0f)
                .role(new Role(1L, "ROLE_USER"))
                .build();
        when(userService.getUserDetails(7L)).thenReturn(user);

        mockMvc.perform(get("/api/v1/user/me")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    void getUserDetails_mapsUserNotFoundError() throws Exception {
        when(userService.getUserDetails(7L))
                .thenThrow(new UserNotFoundException("User not found with id: 7"));

        mockMvc.perform(get("/api/v1/user/me")
                        .principal(authentication()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void deleteUser_withValidPasswordDeletesUserAndClearsCookies() throws Exception {
        when(userService.verifyPassword(7L, "password")).thenReturn(true);

        mockMvc.perform(delete("/api/v1/user/me")
                        .principal(authentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("User deleted successfully!"))
                .andExpect(header().exists("Set-Cookie"));

        verify(userService).deleteUser(7L);
    }

    @Test
    void deleteUser_withInvalidPasswordReturnsUnauthorizedError() throws Exception {
        when(userService.verifyPassword(7L, "wrong")).thenReturn(false);

        mockMvc.perform(delete("/api/v1/user/me")
                        .principal(authentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_PASSWORD"));
    }

    @Test
    void updateProfile_updatesEmailAndOptionalFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "profile_picture", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/v1/user/me")
                        .file(file)
                        .file(new MockMultipartFile("email", "", "text/plain",
                                "new@example.com".getBytes()))
                        .principal(authentication())
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(content().string("Profile updated successfully!"));

        verify(userService).updateUserProfile(7L, "new@example.com", file);
    }

    @Test
    void updateProfile_updatesEmailOnlyWhenNoFileProvided() throws Exception {
        mockMvc.perform(multipart("/api/v1/user/me")
                        .file(new MockMultipartFile("email", "", "text/plain",
                                "new@example.com".getBytes()))
                        .principal(authentication())
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(content().string("Profile updated successfully!"));

        verify(userService).updateUserProfile(7L, "new@example.com", null);
    }

    @Test
    void updateProfile_mapsDuplicateEmailError() throws Exception {
        doThrow(new EmailAlreadyExistsException())
                .when(userService).updateUserProfile(7L, "taken@example.com", null);

        var request = multipart("/api/v1/user/me")
                .file(new MockMultipartFile("email", "", "text/plain",
                        "taken@example.com".getBytes()))
                .principal(authentication())
                .with(requestBuilder -> {
                    requestBuilder.setMethod("PATCH");
                    return requestBuilder;
                });

        mockMvc.perform(request)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken("7", null, java.util.List.of());
    }
}
