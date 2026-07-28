package com.example.photostore.service;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.example.photostore.entity.RefreshToken;
import com.example.photostore.entity.User;
import com.example.photostore.repository.RefreshTokenRepository;
import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;


    public void addRefreshToken(Long userId, String refreshToken, Instant expiresAt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setUser(user);
        newRefreshToken.setToken(refreshToken);
        newRefreshToken.setExpiresAt(expiresAt);
        refreshTokenRepository.save(newRefreshToken);
    }

    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    public void deleteRefreshToken(String refreshToken) {
        refreshTokenRepository.deleteByToken(refreshToken);
    }

    public boolean isRefreshTokenValid(String refreshToken) {
        return refreshTokenRepository.findByToken(refreshToken) != null;
    }

}
