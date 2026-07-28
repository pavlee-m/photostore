package com.example.photostore.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.photostore.security.GeneratedToken;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.UserService;

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
                .username("1")
                .password("password")
                .roles("USER")
                .build();
        var authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtils.generateToken(1L))
                .thenReturn(new GeneratedToken("access-token", Instant.now()));
        when(jwtUtils.generateRefreshToken(1L))
                .thenReturn(new GeneratedToken("refresh-token", Instant.now()));

        mockMvc.perform(post("/api/v1/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("ok!"))
                .andExpect(header().exists("Set-Cookie"));

        verify(refreshTokenService).addRefreshToken(eq(1L), eq("refresh-token"), any());
    }

    @Test
    void signin_returnsUnauthorizedWhenCredentialsInvalid() throws Exception {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/v1/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void signout_returnsUnauthorizedWhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void signout_whenAuthenticated_returnsOkAndClearsCookies() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signout")
                        .principal(new UsernamePasswordAuthenticationToken("1", null, List.of())))
                .andExpect(status().isOk())
                .andExpect(content().string("Signed out successfully!"))
                .andExpect(header().exists("Set-Cookie"));

        verify(refreshTokenService).deleteRefreshToken("1");
    }

    @Test
    void changePassword_updatesPasswordForTokenUser() throws Exception {
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(new UsernamePasswordAuthenticationToken("1", null, List.of()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"new-password\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("Password changed successfully!"));

        verify(userService).changePassword(1L, "new-password");
    }

}
