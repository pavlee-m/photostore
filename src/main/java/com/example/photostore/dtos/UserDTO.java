package com.example.photostore.dtos;

import com.example.photostore.entity.Role;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
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
public class UserDTO {
    @Nonnull
    private Long id;

    @Nonnull
    private String email;


    @Nullable
    private String profile_picture_url;
    
    @Nonnull
    private float storage_space;

    @Nonnull
    private Role role;
}
