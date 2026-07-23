package com.example.photostore.security;

import java.time.Instant;

public record GeneratedToken(String token, Instant expiresAt) {}
