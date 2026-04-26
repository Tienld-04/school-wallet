package com.ldt.user.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID userId;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String kycStatus;
    private LocalDateTime createdAt;

}
