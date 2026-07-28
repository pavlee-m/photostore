package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.AdminUpdateUserRequest;
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
        final User newUser = new User(null, createUserRequest.getEmail(),encoder.encode(createUserRequest.getPassword()), null, 25600.0f, role);
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
        final User newUser = new User(null, createUserRequest.getEmail(), encoder.encode(createUserRequest.getPassword()), null,
                25600.0f, userRole);
        userService.saveUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
    }

    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.status(HttpStatus.OK).body("User deleted successfully!");
    }

    @PatchMapping(value="/update-user/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // Figure out the best way to represent this request
    public ResponseEntity<String> updateUserProfile(@PathVariable Long id, @RequestPart("profile_picture") MultipartFile profilePicture, @RequestPart("user") AdminUpdateUserRequest updateUserRequest) {
        userService.adminUpdateUser(id, updateUserRequest, profilePicture);
        return ResponseEntity.status(HttpStatus.OK).body("User updated successfully!");
    }

    @PostMapping("/change-password/{id}")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody String newPassword) {
        userService.changePassword(id, newPassword);
        return ResponseEntity.status(HttpStatus.OK).body("Password changed successfully!");
    }
}