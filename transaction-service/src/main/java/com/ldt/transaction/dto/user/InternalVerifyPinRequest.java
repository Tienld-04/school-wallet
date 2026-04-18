package com.ldt.transaction.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * Request gửi đến user-service /internal/users/verify-pin
 */
@Getter
@Setter
@AllArgsConstructor
public class InternalVerifyPinRequest {
    private String phone;
    private String pin;
}
