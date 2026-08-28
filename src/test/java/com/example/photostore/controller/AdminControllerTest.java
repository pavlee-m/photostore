package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
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

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.AdminUpdateUserRequest;
import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.Role;
import com.example.photostore.entity.User;
import com.example.photostore.exception.EmailAlreadyExistsException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.RoleService;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UserService;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private PasswordEncoder encoder;

    @MockitoBean
    private RoleService roleService;

    @MockitoBean
    private StorageService storageService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void mockTargetUserAsNonFounder() {
        when(userService.findById(any(Long.class)))
                .thenReturn(User.builder().role(new Role(2L, "ROLE_USER")).build());
    }

    @Test
    void createUser_returnsCreatedWhenEmailAvailable() throws Exception {
        when(userService.existsByEmail("user@example.com")).thenReturn(false);
        when(roleService.findByName("ROLE_USER")).thenReturn(new Role(2L, "ROLE_USER"));
        when(encoder.encode("password")).thenReturn("encoded-password");
        when(storageService.getStorageMaxSizeMb()).thenReturn(102400);

        mockMvc.perform(post("/api/v1/admin/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().string("User registered successfully!"));

        verify(userService).saveUser(any(User.class));
    }

    @Test
    void createUser_returnsBadRequestWhenEmailTaken() throws Exception {
        when(userService.existsByEmail("user@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/v1/admin/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email not available!"));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void listUsers_returnsPagedUsers() throws Exception {
        UserDTO user = UserDTO.builder()
                .id(1L)
                .email("admin@example.com")
                .storage_space(25600.0f)
                .storage_used(128.0f)
                .role(new Role(1L, "ROLE_ADMIN"))
                .build();
        when(userService.listUsers(any()))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/admin/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@example.com"))
                .andExpect(jsonPath("$.content[0].storage_used").value(128.0))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void createUser_usesRequestedStorageAndRole() throws Exception {
        when(userService.existsByEmail("user@example.com")).thenReturn(false);
        when(roleService.findByName("ROLE_ADMIN")).thenReturn(new Role(1L, "ROLE_ADMIN"));
        when(encoder.encode("password")).thenReturn("encoded-password");
        when(storageService.getStorageMaxSizeMb()).thenReturn(102400);

        mockMvc.perform(post("/api/v1/admin/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password\",\"storage_space\":51200,\"roleName\":\"ROLE_ADMIN\"}"))
                .andExpect(status().isCreated());

        verify(userService).saveUser(any(User.class));
    }

    @Test
    void updateUser_allowsMissingProfilePicture() throws Exception {
        MockMultipartFile userPart = new MockMultipartFile(
                "user", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"email\":\"updated@example.com\",\"storage_space\":1024}".getBytes());

        mockMvc.perform(multipart("/api/v1/admin/update-user/42")
                        .file(userPart)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(content().string("User updated successfully!"));

        verify(userService).adminUpdateUser(
                any(Long.class),
                any(AdminUpdateUserRequest.class),
                isNull());
    }

    @Test
    void deleteUser_deletesTargetUser() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/delete-user/42"))
                .andExpect(status().isOk())
                .andExpect(content().string("User deleted successfully!"));

        verify(userService).deleteUser(42L);
    }

    @Test
    void deleteUser_mapsUserNotFoundError() throws Exception {
        doThrow(new UserNotFoundException("User not found with id: 42"))
                .when(userService).deleteUser(42L);

        mockMvc.perform(delete("/api/v1/admin/delete-user/42"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void updateUser_acceptsJsonUserPartAndFile() throws Exception {
        MockMultipartFile userPart = new MockMultipartFile(
                "user", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"email\":\"updated@example.com\",\"storage_space\":51200}".getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "profile_picture", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/v1/admin/update-user/42")
                        .file(userPart)
                        .file(filePart)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(content().string("User updated successfully!"));

        verify(userService).adminUpdateUser(
                any(Long.class),
                any(AdminUpdateUserRequest.class),
                any(MultipartFile.class));
    }

    @Test
    void updateUser_mapsUserNotFoundError() throws Exception {
        MockMultipartFile userPart = new MockMultipartFile(
                "user", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"email\":\"updated@example.com\"}".getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "profile_picture", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});
        doThrow(new UserNotFoundException("User not found with id: 42"))
                .when(userService).adminUpdateUser(any(Long.class), any(AdminUpdateUserRequest.class), any(MultipartFile.class));

        mockMvc.perform(multipart("/api/v1/admin/update-user/42")
                        .file(userPart)
                        .file(filePart)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void updateUser_mapsDuplicateEmailError() throws Exception {
        MockMultipartFile userPart = new MockMultipartFile(
                "user", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"email\":\"taken@example.com\"}".getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "profile_picture", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});
        doThrow(new EmailAlreadyExistsException())
                .when(userService).adminUpdateUser(any(Long.class), any(AdminUpdateUserRequest.class), any(MultipartFile.class));

        mockMvc.perform(multipart("/api/v1/admin/update-user/42")
                        .file(userPart)
                        .file(filePart)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void changePassword_updatesTargetUser() throws Exception {
        mockMvc.perform(post("/api/v1/admin/change-password/42")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("new-password"))
                .andExpect(status().isOk())
                .andExpect(content().string("Password changed successfully!"));

        verify(userService).changePassword(42L, "new-password");
    }

    @Test
    void changePassword_mapsUserNotFoundError() throws Exception {
        doThrow(new UserNotFoundException("User not found with id: 42"))
                .when(userService).changePassword(42L, "new-password");

        mockMvc.perform(post("/api/v1/admin/change-password/42")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("new-password"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }
}
