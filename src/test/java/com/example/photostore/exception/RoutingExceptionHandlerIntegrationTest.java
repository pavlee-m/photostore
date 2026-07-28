package com.example.photostore.exception;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoutingExceptionHandlerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unknownRoute_returnsNotFoundErrorResponse() throws Exception {
        mockMvc.perform(get("/api/v1/does-not-exist")
                        .with(user("1").roles("USER")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Route not found."))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void unsupportedMethodOnPublicRoute_returnsMethodNotAllowedErrorResponse() throws Exception {
        mockMvc.perform(get("/api/v1/auth/signin"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                .andExpect(jsonPath("$.message").value("HTTP method not allowed for this route."))
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    void unsupportedMethodOnProtectedRoute_returnsMethodNotAllowedErrorResponse() throws Exception {
        mockMvc.perform(post("/api/v1/user/me")
                        .with(user("1").roles("USER")))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                .andExpect(jsonPath("$.status").value(405));
    }
}
