package com.example.photostore.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.photostore.entity.User;

// import com.example.photostore.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole_Name(String name);
}