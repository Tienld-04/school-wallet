package com.ldt.user.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class UsersResponse {
    private UUID userId;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String status;
}
