package com.example.photostore.mappers;

import org.mapstruct.Mapper;

import com.example.photostore.dtos.UserDTO;
import com.example.photostore.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO userToUserDTO(User user);
}
