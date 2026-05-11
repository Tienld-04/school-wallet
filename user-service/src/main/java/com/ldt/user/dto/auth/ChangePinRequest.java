package com.ldt.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePinRequest {
    @NotBlank(message = "Mã OTP hiện tại không được để trống")
    @Size(min = 6, max = 6, message = "Mã OTP phải đúng 6 số")
    @Pattern(regexp = "\\d{6}", message = "Mã OTP chỉ chứa chữ số")
    private String currentPin;

    @NotBlank(message = "Mã OTP mới không được để trống")
    @Size(min = 6, max = 6, message = "Mã OTP phải đúng 6 số")
    @Pattern(regexp = "\\d{6}", message = "Mã OTP chỉ chứa chữ số")
    private String newPin;

    @NotBlank(message = "Xác nhận mã OTP không được để trống")
    private String confirmPin;
}
