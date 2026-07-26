package com.example.photostore.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RouteSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @Order(1)
    void existsAdmin_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/admin/exists-admin"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(2)
    void createAdmin_bootstrapThenRequiresAuthForSecondAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin2@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Unauthorized"));
    }

    @Test
    @Order(3)
    void createAdmin_allowsSecondAdminWhenAuthenticatedAsAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/admin/create-admin")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin3@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().string("Admin created successfully!"));
    }

    @Test
    @Order(4)
    void createUser_requiresAdminRole() throws Exception {
        mockMvc.perform(post("/api/v1/admin/create-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"newuser@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void signout_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    void signout_whenAuthenticated_returnsOkAndClearsCookies() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signout")
                        .with(user("user@example.com")))
                .andExpect(status().isOk())
                .andExpect(content().string("Signed out successfully!"))
                .andExpect(header().exists("Set-Cookie"));
    }
}
