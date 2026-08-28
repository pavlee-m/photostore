package com.example.photostore.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
import org.springframework.mock.web.MockMultipartFile;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RouteSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @Order(1)
    void existsFounder_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/founder/exists-founder"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    void adminEndpoints_stillRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
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

    @Test
    @Order(7)
    void signin_isPublic() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @Order(8)
    void changePassword_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"new-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(9)
    void getUserDetails_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/user/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(10)
    void deleteUser_requiresAdminRole() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/delete-user/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/admin/delete-user/1")
                        .with(user("user@example.com").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    void updateUser_requiresAdminRole() throws Exception {
        MockMultipartFile userPart = new MockMultipartFile(
                "user", "", MediaType.APPLICATION_JSON_VALUE,
                "{\"email\":\"updated@example.com\"}".getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "profile_picture", "avatar.jpg", "image/jpeg", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/v1/admin/update-user/1")
                        .file(userPart)
                        .file(filePart)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart("/api/v1/admin/update-user/1")
                        .file(userPart)
                        .file(filePart)
                        .with(user("user@example.com").roles("USER"))
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void openApiDocs_arePublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.openapi").exists());
    }

    @Test
    @Order(13)
    void swaggerUi_isPublic() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(14)
    void changePasswordForUser_requiresAdminRole() throws Exception {
        mockMvc.perform(post("/api/v1/admin/change-password/1")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("new-password"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/admin/change-password/1")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("new-password")
                        .with(user("user@example.com").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(15)
    void deleteMedia_requiresAuthentication() throws Exception {
        mockMvc.perform(delete("/api/v1/media/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(16)
    void createAlbum_requiresAuthentication() throws Exception {
        mockMvc.perform(multipart("/api/v1/albums")
                        .param("name", "Vacation"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(17)
    void listUsers_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/users")
                        .with(user("user@example.com").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/users")
                        .with(user("founder@example.com").roles("FOUNDER")))
                .andExpect(status().isOk());
    }
}
