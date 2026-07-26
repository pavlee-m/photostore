package com.example.photostore.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

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
    
    public UserDTO getUserDetails(String email) throws RuntimeException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }
        return userMapper.userToUserDTO(user);
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

    public void deleteUser(String email) {
        userRepository.deleteByEmail(email);
    }

    public void changePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    public boolean verifyPassword(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }
        return passwordEncoder.encode(password).equals(user.getPassword());
    }

}
