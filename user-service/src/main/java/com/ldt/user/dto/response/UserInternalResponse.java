package com.ldt.user.dto.response;

import com.ldt.user.model.UserStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class UserInternalResponse {
    private UUID userId;
    private UserStatus status;

    public UserInternalResponse(UUID userId, UserStatus status) {
        this.userId = userId;
        this.status = status;
    }
}
