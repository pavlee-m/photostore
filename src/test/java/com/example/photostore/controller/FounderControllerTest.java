package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
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

import com.example.photostore.service.UserService;
import com.example.photostore.service.RoleService;
import com.example.photostore.entity.Role;
import com.example.photostore.entity.User;

@WebMvcTest(FounderController.class)
@AutoConfigureMockMvc(addFilters = false)
class FounderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private RoleService roleService;

    @MockitoBean
    private PasswordEncoder encoder;

    @Test
    void createFounder_returnsCreated() throws Exception {
        when(userService.existsByRole("ROLE_FOUNDER")).thenReturn(false);
        when(roleService.findByName("ROLE_FOUNDER")).thenReturn(new Role(1L, "ROLE_FOUNDER"));
        when(encoder.encode("password")).thenReturn("encoded-password");

        mockMvc.perform(post("/api/v1/founder/create-founder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"founder@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().string("Founder created successfully!"));

        verify(userService).saveUser(any(User.class));
    }

    @Test
    void existsFounder_returnsTrueWhenFounderExists() throws Exception {
        when(userService.existsByRole("ROLE_FOUNDER")).thenReturn(true);

        mockMvc.perform(get("/api/v1/founder/exists-founder"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        verify(userService).existsByRole("ROLE_FOUNDER");
    }

    @Test
    void createFounder_returnsBadRequestWhenFounderExists() throws Exception {
        when(userService.existsByRole("ROLE_FOUNDER")).thenReturn(true);

        mockMvc.perform(post("/api/v1/founder/create-founder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"founder@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Founder already exists!"));

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void existsFounder_returnsFalseWhenFounderDoesNotExist() throws Exception {
        when(userService.existsByRole("ROLE_FOUNDER")).thenReturn(false);

        mockMvc.perform(get("/api/v1/founder/exists-founder"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));

        verify(userService).existsByRole("ROLE_FOUNDER");
    }
}
