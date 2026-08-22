package com.example.photostore.dtos;

import jakarta.annotation.Nonnull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Data
public class AdminCreateUserRequest {
    @Nonnull
    private String email;
    @Nonnull
    private String password;
    private Float storage_space;
    private String roleName;
}
