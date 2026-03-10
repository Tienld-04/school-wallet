package com.ldt.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @NotBlank
    @Size(min = 10, max = 10, message = "SĐT phải đúng 10 số")
    private String phone;
    @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;
}
