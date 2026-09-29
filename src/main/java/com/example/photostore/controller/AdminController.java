package com.example.photostore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.dtos.AdminCreateUserRequest;
import com.example.photostore.dtos.AdminUpdateUserRequest;
import com.example.photostore.dtos.PagedResponse;
import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.Role;
import com.example.photostore.entity.User;
import com.example.photostore.service.RoleService;
import com.example.photostore.service.StorageService;
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
    @Autowired
    private StorageService storageService;

    @GetMapping("/users")
    public ResponseEntity<PagedResponse<UserDTO>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(PagedResponse.from(userService.listUsers(
                PageRequest.of(pageIndex, pageSize, Sort.by("id").ascending()))));
    }

    @PostMapping("/create-user")
    public ResponseEntity<String> createUser(@RequestBody AdminCreateUserRequest createUserRequest) {
        if (userService.existsByEmail(createUserRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email not available!");
        }
        String roleName = createUserRequest.getRoleName() == null ? "ROLE_USER" : createUserRequest.getRoleName();
        if (roleName.equals("ROLE_FOUNDER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        Role userRole = roleService.findByName(roleName);
        float storageSpace = storageService.resolveStorageSpace(createUserRequest.getStorage_space());
        final User newUser = User.builder()
                .email(createUserRequest.getEmail())
                .password(encoder.encode(createUserRequest.getPassword()))
                .storage_space(storageSpace)
                .storage_used(0.0f)
                .role(userRole)
                .build();
        userService.saveUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
    }

    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        if (userService.findById(id).getRole().getName().equals("ROLE_FOUNDER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        userService.deleteUser(id);
        return ResponseEntity.status(HttpStatus.OK).body("User deleted successfully!");
    }

    @PatchMapping(value="/update-user/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateUserProfile(
            @PathVariable Long id,
            @RequestPart(value = "profile_picture", required = false) MultipartFile profilePicture,
            @RequestPart("user") AdminUpdateUserRequest updateUserRequest) {
        // Check if the user being edited is the founder
        if (userService.findById(id).getRole().getName().equals("ROLE_FOUNDER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        userService.adminUpdateUser(id, updateUserRequest, profilePicture);
        return ResponseEntity.status(HttpStatus.OK).body("User updated successfully!");
    }

    @PostMapping("/change-password/{id}")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody String newPassword) {
        if (userService.findById(id).getRole().getName().equals("ROLE_FOUNDER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        userService.changePassword(id, newPassword);
        return ResponseEntity.status(HttpStatus.OK).body("Password changed successfully!");
    }
}