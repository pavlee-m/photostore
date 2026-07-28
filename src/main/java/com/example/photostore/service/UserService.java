package com.example.photostore.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import com.example.photostore.dtos.AdminUpdateUserRequest;
import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.User;
import com.example.photostore.mappers.UserMapper;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StorageService storageService;

    @Autowired
    private RoleService roleService;
    
    public UserDTO getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return userMapper.userToUserDTO(user);
    }

    public User findByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }
        return user;
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByRole(String role) {
        return userRepository.existsByRole_Name(role);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        storageService.deleteProfilePicture(user.getProfile_picture_url());
        userRepository.deleteById(userId);
    }

    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    public boolean verifyPassword(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return passwordEncoder.matches(password, user.getPassword());
    }

    public void updateUserProfile(Long userId, String email, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if (email != null) { 
            if (existsByEmail(email) && !email.equals(user.getEmail())) {
                throw new RuntimeException("Email already exists!");
            }
        }
        if (file != null && !file.isEmpty()) {
            String profilePicturePath = storageService.uploadProfilePicture(user.getId(), file);
            user.setProfile_picture_url(profilePicturePath);
        }
        user.setEmail(email);
        userRepository.save(user);
    }

    public void adminUpdateUser(Long id, AdminUpdateUserRequest updateUserRequest) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (updateUserRequest.getEmail() != null) {
            if (userRepository.existsByEmail(updateUserRequest.getEmail()) && !updateUserRequest.getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Email already exists!");
            }
            else {
                user.setEmail(updateUserRequest.getEmail());
            }
        }

        if (updateUserRequest.getStorage_space() != null) {
            if (updateUserRequest.getStorage_space() > storageService.getStorageMaxSizeMb()) {
                throw new RuntimeException("Storage space is too large!");
            }
            else {
                user.setStorage_space(updateUserRequest.getStorage_space());
            }
        }

        if (updateUserRequest.getRoleName() != null) {
            if (roleService.existsByName(updateUserRequest.getRoleName())) {
                user.setRole(roleService.findByName(updateUserRequest.getRoleName()));
            }
            else {
                throw new RuntimeException("Role does not exist!");
            }
        }
        
        userRepository.save(user);
    }
}