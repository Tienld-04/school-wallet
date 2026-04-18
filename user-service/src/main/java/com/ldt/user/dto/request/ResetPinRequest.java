package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPinRequest {
    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(min = 10, max = 10, message = "SĐT phải đúng 10 số")
    private String phone;

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN phải đúng 6 số")
    private String newPin;
}
