package com.example.photostore.service;

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
    
}
