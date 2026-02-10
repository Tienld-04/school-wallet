package com.ldt.user.mapper;


import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreateRequest request);
    UserResponse toUserResponse(User user);
}
