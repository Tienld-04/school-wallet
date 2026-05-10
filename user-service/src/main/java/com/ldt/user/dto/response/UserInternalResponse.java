package com.ldt.user.dto.response;

import com.ldt.user.model.UserStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class UserInternalResponse {
    private UUID userId;
    private UserStatus status;
    private String fullName;
    private String phone;
    private String email;
    private String kycStatus;

    public UserInternalResponse(UUID userId, UserStatus status, String fullName, String phone, String email, String kycStatus) {
        this.userId = userId;
        this.status = status;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.kycStatus = kycStatus;
    }
}
