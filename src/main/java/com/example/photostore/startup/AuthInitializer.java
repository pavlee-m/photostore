package com.example.photostore.startup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.photostore.entity.Role;
import com.example.photostore.service.RoleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthInitializer implements ApplicationRunner {
    
    @Autowired
    private final RoleService roleService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!roleService.existsByName("ROLE_USER")) {
            roleService.saveRole(new Role(null, "ROLE_USER"));
        }
        if (!roleService.existsByName("ROLE_ADMIN")) {
            roleService.saveRole(new Role(null, "ROLE_ADMIN"));
        }
        if (!roleService.existsByName("ROLE_FOUNDER")) {
            roleService.saveRole(new Role(null, "ROLE_FOUNDER"));
        }
        // Check for admin user
    }
}
