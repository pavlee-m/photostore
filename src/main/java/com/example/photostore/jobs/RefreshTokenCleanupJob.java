package com.example.photostore.jobs;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.photostore.service.RefreshTokenService;

@Component
public class RefreshTokenCleanupJob {
    

    @Autowired
    private RefreshTokenService refreshTokenService;
    
    @Scheduled(fixedDelay = 1 * 60 * 1000) // 1 minute
    public void cleanupRefreshTokens() {
        refreshTokenService.deleteExpiredTokens();
    }

}
