package com.example.photostore.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.photostore.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // Used for logging out from a particular device.
    void deleteByToken(String token);
    // Delete all refresh tokens for a user, full logout.
    void deleteAllTokensByUserId(Long userId);
    // Delete all expired refresh tokens.
    void deleteByExpiresAtBefore(Instant now);
    // Find a refresh token by its token.
    RefreshToken findByToken(String token);
}