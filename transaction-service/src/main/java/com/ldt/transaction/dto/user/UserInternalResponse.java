package com.ldt.transaction.dto.user;

import lombok.Data;

import java.util.UUID;
@Data
public class UserInternalResponse {
    private UUID userId;
    private String status;
}
