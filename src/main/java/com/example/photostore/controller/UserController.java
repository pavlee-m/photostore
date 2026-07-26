package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.UserDTO;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.StorageService;
import com.example.photostore.service.UserService;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtils;

    @Autowired
    private StorageService storageService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getUserDetails(@CookieValue(name = "accessToken") String accessToken) {
        final String email = jwtUtils.getUserFromToken(accessToken);
        final UserDTO user = userService.getUserDetails(email);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/me")
    public ResponseEntity<String> deleteUser(@CookieValue(name = "accessToken") String accessToken, @RequestBody String password) {
        final String email = jwtUtils.getUserFromToken(accessToken);
        if (!userService.verifyPassword(email, password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password!");
        }
        userService.deleteUser(email);
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", "").path("/").httpOnly(true).sameSite("Lax").build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "").path("/").httpOnly(true).sameSite("Lax").build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("User deleted successfully!");
    }

    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateProfile
    (
        @CookieValue(name = "accessToken") String accessToken,
        @RequestPart("email") String email,
        @RequestPart(value="file", required=false) MultipartFile file
    )
    {
        final String currentEmail = jwtUtils.getUserFromToken(accessToken);
        final Long userId = userService.getUserDetails(currentEmail).getId();
        // Check if email available
        if (userService.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists!");
        }
        // Update profile picture
        try{
            storageService.uploadFile(userId, file);
            return ResponseEntity.ok("Profile updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update profile!");
        }
    }
}
