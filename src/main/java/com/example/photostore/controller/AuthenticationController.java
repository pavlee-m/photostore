package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.photostore.dtos.UserCredentialsRequest;
import com.example.photostore.security.GeneratedToken;
import com.example.photostore.security.JwtUtil;
import com.example.photostore.service.RefreshTokenService;
import com.example.photostore.service.UserService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtils;
    @Autowired
    private UserService userService;
    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/signin")
    public ResponseEntity<String> authenticateUser(@RequestBody UserCredentialsRequest userCredentialsRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(userCredentialsRequest.getEmail(), userCredentialsRequest.getPassword())
        );
        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        GeneratedToken accessToken = jwtUtils.generateToken(userDetails.getUsername());
        GeneratedToken refreshToken = jwtUtils.generateRefreshToken(userDetails.getUsername());
        refreshTokenService.addRefreshToken(userDetails.getUsername(), refreshToken.token(), refreshToken.expiresAt());
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken.token()).path("/").httpOnly(true).sameSite("Lax").build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.token()).path("/").httpOnly(true).sameSite("Lax").build();
        return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
        .body("ok!");
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@CookieValue(name = "accessToken") String accessToken, @RequestBody String newPassword) {
        final String email = jwtUtils.getUserFromToken(accessToken);
        userService.changePassword(email, passwordEncoder.encode(newPassword));
        return ResponseEntity.ok("Password changed successfully!");
    }
    
    @PostMapping("/signout")
    public ResponseEntity<String> signout(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        refreshTokenService.deleteRefreshToken(authentication.getName());
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", "").path("/").httpOnly(true).sameSite("Lax").build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "").path("/").httpOnly(true).sameSite("Lax").build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("Signed out successfully!");
    }
}
