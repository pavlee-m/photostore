package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.entity.Role;
import com.example.photostore.entity.User;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.RoleService;
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
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @Test
    void createAdmin_returnsCreatedWhenNoAdminExists() throws Exception {
        when(userService.existsByRole("ROLE_ADMIN")).thenReturn(false);
        when(userService.existsByEmail("admin@example.com")).thenReturn(false);
        when(roleService.findByName("ROLE_ADMIN")).thenReturn(new Role(1L, "ROLE_ADMIN"));
        when(encoder.encode("password")).thenReturn("encoded-password");

        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().string("Admin created successfully!"));

        verify(userService).saveUser(any(User.class));
    }

    @Test
    void createAdmin_returnsBadRequestWhenEmailTaken() throws Exception {
        when(userService.existsByRole("ROLE_ADMIN")).thenReturn(false);
        when(userService.existsByEmail("admin@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email not available!"));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void createAdmin_returnsUnauthorizedWhenAdminExistsAndNotAuthenticated() throws Exception {
        when(userService.existsByRole("ROLE_ADMIN")).thenReturn(true);

        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Unauthorized"));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void existsAdmin_returnsOkWhenAdminExists() throws Exception {
        when(userService.existsByRole("ROLE_ADMIN")).thenReturn(true);

        mockMvc.perform(get("/api/v1/admin/exists-admin"))
                .andExpect(status().isOk())
                .andExpect(content().string("Admin exists!"));
    }

    @Test
    void existsAdmin_returnsNotFoundWhenNoAdmin() throws Exception {
        when(userService.existsByRole("ROLE_ADMIN")).thenReturn(false);

        mockMvc.perform(get("/api/v1/admin/exists-admin"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Admin not found!"));
    }

    @Test
    void createUser_returnsCreatedWhenEmailAvailable() throws Exception {
        when(userService.existsByEmail("user@example.com")).thenReturn(false);
        when(roleService.findByName("ROLE_USER")).thenReturn(new Role(2L, "ROLE_USER"));
        when(encoder.encode("password")).thenReturn("encoded-password");

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
}
