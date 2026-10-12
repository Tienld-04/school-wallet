package com.ldt.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank(message = "{validation.phone.required}")
    @Size(min = 10, max = 10, message = "{validation.phone.length}")
    private String phone;

    @NotBlank(message = "{validation.otp.required}")
    @Size(min = 6, max = 6, message = "{validation.otp.length}")
    private String otp;
}
