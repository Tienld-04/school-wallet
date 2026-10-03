package com.ldt.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpSendRequest {
    @NotBlank(message = "{validation.phone.required}")
    @Size(min = 10, max = 10, message = "{validation.phone.length}")
    private String phone;
}
