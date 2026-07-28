package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.PasswordBodyRequest;
import com.example.photostore.dtos.UserDTO;
import com.example.photostore.exception.InvalidPasswordException;
import com.example.photostore.service.UserService;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getUserDetails(Authentication authentication) {
        final Long userId = Long.parseLong(authentication.getName());
        final UserDTO user = userService.getUserDetails(userId);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/me")
    public ResponseEntity<String> deleteUser(Authentication authentication, @RequestBody PasswordBodyRequest deleteAccountRequest) {
        final Long userId = Long.parseLong(authentication.getName());
        if (!userService.verifyPassword(userId, deleteAccountRequest.getPassword())) {
            throw new InvalidPasswordException();
        }
        userService.deleteUser(userId);
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
        Authentication authentication,
        @RequestPart("email") String email,
        @RequestPart(value="profile_picture", required=false) MultipartFile profilePicture
    )
    {
        final Long userId = Long.parseLong(authentication.getName());
        userService.updateUserProfile(userId, email, profilePicture);
        return ResponseEntity.ok("Profile updated successfully!");
    }
}
