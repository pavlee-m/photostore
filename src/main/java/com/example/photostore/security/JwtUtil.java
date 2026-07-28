package com.example.photostore.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${jwt.refresh.expiration}")
    private int jwtRefreshExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public GeneratedToken generateToken(Long userId) {
        Instant expiresAt = Instant.now().plus(jwtExpirationMs, ChronoUnit.MILLIS);
        String token = Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key)
                .compact();
        return new GeneratedToken(token, expiresAt);
    }

    public GeneratedToken generateRefreshToken(Long userId) {
        Instant expiresAt = Instant.now().plus(jwtRefreshExpirationMs, ChronoUnit.MILLIS);
        String token = Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtRefreshExpirationMs))
                .signWith(key)
                .compact();
        return new GeneratedToken(token, expiresAt);
    }

    public Long getUserIdFromToken(String token) {
        String subject = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
        return Long.parseLong(subject);
    }

    public boolean validateJwtToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        }
        catch (ExpiredJwtException e) {
            // Expiration can be an expected case when access-token refresh is enabled.
            log.debug("JWT expired: {}", e.getMessage());
        }
        catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }
        return false;
    }

}
