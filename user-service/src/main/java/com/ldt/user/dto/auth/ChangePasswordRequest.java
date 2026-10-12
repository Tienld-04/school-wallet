package com.ldt.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "{validation.current_password.required}")
    private String currentPassword;

    @NotBlank(message = "{validation.new_password.required}")
    @Size(min = 6, message = "{validation.new_password.min_length}")
    private String newPassword;

    @NotBlank(message = "{validation.confirm_password.required}")
    private String confirmPassword;
}
