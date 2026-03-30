package com.ldt.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpVerifyResponse {
    private String verificationToken;
}
