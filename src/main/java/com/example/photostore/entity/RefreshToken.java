package com.example.photostore.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="refresh_tokens")
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(name="token", unique=true, nullable=false)
    private String token;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;
    
    @Column(name="expires_at", nullable=false)
    private Instant expiresAt;
}
