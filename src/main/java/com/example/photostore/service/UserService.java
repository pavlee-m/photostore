package com.example.photostore.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.photostore.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import com.example.photostore.dtos.AdminUpdateUserRequest;
import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.User;
import com.example.photostore.exception.EmailAlreadyExistsException;
import com.example.photostore.exception.RoleNotFoundException;
import com.example.photostore.exception.StorageCapacityExceededException;
import com.example.photostore.exception.UserNotFoundException;
import com.example.photostore.mappers.UserMapper;
import com.example.photostore.security.Encryption;

import javax.crypto.SecretKey;

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
    
    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private Encryption encryption;

    @Autowired
    private AlbumService albumService;

    @Autowired
    private MediaService mediaService;

    @Autowired
    private UploadSessionService uploadSessionService;
    
    public UserDTO getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        return userMapper.userToUserDTO(user);
    }

    public User findByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        return user;
    }

    public User findById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        return user;
    }

    @Transactional
    public void saveUser(User user) {
        if (user.getEncryption_key() == null) {
            SecretKey userKey = encryption.generateKey();
            user.setEncryption_key(encryption.encryptWithMasterKey(userKey));
        }
        if (user.getStorage_used() == null) {
            user.setStorage_used(0.0f);
        }
        userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByRole(String role) {
        return userRepository.existsByRole_Name(role);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        for (var session : uploadSessionService.findByUserId(userId)) {
            storageService.deleteSessionFiles(session.getUploadId(), session.getTotalChunks());
        }
        uploadSessionService.deleteAllForUser(userId);
        albumService.deleteAllForUser(userId);
        mediaService.deleteAllForUser(userId);
        refreshTokenService.deleteAllTokensByUserId(userId);
        userRepository.deleteById(userId);
        storageService.deleteProfilePictureByUserId(userId);
    }

    @Transactional
    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        // Logs out all tokens for the user.
        refreshTokenService.deleteAllTokensByUserId(userId);
    }

    public boolean verifyPassword(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        return passwordEncoder.matches(password, user.getPassword());
    }

    @Transactional
    public void updateUserProfile(Long userId, String email, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        if (email != null) { 
            if (existsByEmail(email) && !email.equals(user.getEmail())) {
                throw new EmailAlreadyExistsException();
            }
        }
        if (file != null && !file.isEmpty()) {
            String profilePicturePath = storageService.uploadProfilePicture(user.getId(), file);
            user.setProfile_picture_url(profilePicturePath);
        }
        user.setEmail(email);
        userRepository.save(user);
    }

    @Transactional
    public void adminUpdateUser(Long id, AdminUpdateUserRequest updateUserRequest, MultipartFile profilePicture) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        if (profilePicture != null && !profilePicture.isEmpty()) {
            String profilePicturePath = storageService.uploadProfilePicture(user.getId(), profilePicture);
            user.setProfile_picture_url(profilePicturePath);
        }

        if (updateUserRequest.getEmail() != null) {
            if (userRepository.existsByEmail(updateUserRequest.getEmail()) && !updateUserRequest.getEmail().equals(user.getEmail())) {
                throw new EmailAlreadyExistsException();
            }
            else {
                user.setEmail(updateUserRequest.getEmail());
            }
        }

        if (updateUserRequest.getStorage_space() != null) {
            if (updateUserRequest.getStorage_space() > storageService.getStorageMaxSizeMb()) {
                throw new StorageCapacityExceededException();
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
                throw new RoleNotFoundException(updateUserRequest.getRoleName());
            }
        }
        
        userRepository.save(user);
    }
}