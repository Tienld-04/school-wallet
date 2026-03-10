package com.ldt.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserCreateRequest {
    @NotBlank(message = "Họ tên không được trống")
    private String fullName;
    @NotBlank @Size(min = 10, max = 10, message = "SĐT phải đúng 10 số")
    private String phone;
    @NotBlank @Email(message = "Email không hợp lệ")
    private String email;
    @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;
    @NotBlank @Size(min = 6, max = 6, message = "Mã PIN phải 6 số")
    private String transactionPin;

}
