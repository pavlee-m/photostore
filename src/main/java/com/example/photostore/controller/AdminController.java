package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
@RequestMapping("/api/v1/admin")
public class AdminController {
    
    @Autowired
    private UserService userService;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private RoleService roleService;
    
    @PostMapping("/create-admin")
    public ResponseEntity<String> createAdmin(@RequestBody UserCredentialsRequest createUserRequest, Authentication authentication) {
        if (userService.existsByRole("ROLE_ADMIN")) {
            // Check if the sender is admin, if yes, create another admin
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }
            else if (!authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        }
        if (userService.existsByEmail(createUserRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email not available!");
        }
        Role role = roleService.findByName("ROLE_ADMIN");
        final User newUser = new User(null, createUserRequest.getEmail(),encoder.encode(createUserRequest.getPassword()), "", 25600.0f, role);
        userService.saveUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body("Admin created successfully!");
    }

    // This part is important because the application will initiate creating the
    // admin user if it doesn't exist.
    @GetMapping("/exists-admin")
    public ResponseEntity<String> adminExists() {
        if (userService.existsByRole("ROLE_ADMIN")) {
            return ResponseEntity.status(HttpStatus.OK).body("Admin exists!");
        }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Admin not found!");
    }

    @PostMapping("/create-user")
    public ResponseEntity<String> createUser(@RequestBody UserCredentialsRequest createUserRequest) {
        if (userService.existsByEmail(createUserRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email not available!");
        }
        Role userRole = roleService.findByName("ROLE_USER");
        final User newUser = new User(null, createUserRequest.getEmail(), encoder.encode(createUserRequest.getPassword()), "",
                25600.0f, userRole);
        userService.saveUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
    }
}