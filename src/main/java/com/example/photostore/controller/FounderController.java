package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.photostore.dtos.UserCredentialsRequest;
import com.example.photostore.entity.Role;
import com.example.photostore.entity.User;
import com.example.photostore.service.RoleService;
import com.example.photostore.service.UserService;

@RestController
@RequestMapping("/api/v1/founder")
public class FounderController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PasswordEncoder encoder;

    @PostMapping("/create-founder")
    public ResponseEntity<String> createFounder(@RequestBody UserCredentialsRequest createUserRequest) {
        if (userService.existsByRole("ROLE_FOUNDER")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Founder already exists!");
        }
        Role role = roleService.findByName("ROLE_FOUNDER");
        final User newUser = User.builder()
                .email(createUserRequest.getEmail())
                .password(encoder.encode(createUserRequest.getPassword()))
                .storage_space(25600.0f)
                .storage_used(0.0f)
                .role(role)
                .build();
        userService.saveUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body("Founder created successfully!");
    }

    @GetMapping("/exists-founder")
    public ResponseEntity<Boolean> existsFounder() {
        return ResponseEntity.status(HttpStatus.OK).body(userService.existsByRole("ROLE_FOUNDER"));
    }

}
