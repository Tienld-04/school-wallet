package com.ldt.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @NotBlank
    @Size(min = 10, max = 10, message = "{validation.phone.length}")
    private String phone;
    @NotBlank @Size(min = 6, message = "{validation.password.min_length}")
    private String password;
}
