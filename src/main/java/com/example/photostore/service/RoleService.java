package com.example.photostore.service;

import org.springframework.stereotype.Service;

import com.example.photostore.entity.Role;
import com.example.photostore.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoleService {
    
    private final RoleRepository roleRepository;

    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }

    public void saveRole(Role role) {
        roleRepository.save(role);
    }

    public Role findByName(String name) {
        return roleRepository.findByName(name);
    }
}
