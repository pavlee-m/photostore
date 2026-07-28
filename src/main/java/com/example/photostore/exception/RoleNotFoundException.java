package com.example.photostore.exception;

public class RoleNotFoundException extends RuntimeException {
    public RoleNotFoundException(String roleName) {
        super("Role does not exist: " + roleName);
    }
}
