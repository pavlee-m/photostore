package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.Role;
import com.example.photostore.security.GeneratedToken;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.UserService;

import jakarta.servlet.http.Cookie;

@WebMvcTest(AuthenticationController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtil jwtUtils;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void signin_returnsOkAndSetsCookies() throws Exception {
        UserDetails userDetails = User.builder()
                .username("user@example.com")
                .password("password")
                .roles("USER")
                .build();
        var authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtils.generateToken("user@example.com"))
                .thenReturn(new GeneratedToken("access-token", Instant.now()));
        when(jwtUtils.generateRefreshToken("user@example.com"))
                .thenReturn(new GeneratedToken("refresh-token", Instant.now()));

        mockMvc.perform(post("/api/v1/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("ok!"))
                .andExpect(header().exists("Set-Cookie"));

        verify(refreshTokenService).addRefreshToken(eq("user@example.com"), eq("refresh-token"), any());
    }

    @Test
    void me_returnsUserDetails() throws Exception {
        Role role = new Role(1L, "ROLE_USER");
        UserDTO userDTO = UserDTO.builder()
                .id(1L)
                .email("user@example.com")
                .storage_space(25600.0f)
                .role(role)
                .build();
        when(jwtUtils.getUserFromToken("valid-token")).thenReturn("user@example.com");
        when(userService.getUserDetails("user@example.com")).thenReturn(userDTO);

        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(new Cookie("accessToken", "valid-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    void signout_returnsUnauthorizedWhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signout"))
                .andExpect(status().isUnauthorized());
    }
}
