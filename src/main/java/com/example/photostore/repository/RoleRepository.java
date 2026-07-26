package com.example.photostore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.photostore.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    boolean existsByName(String name);
    Role findByName(String name);
}
