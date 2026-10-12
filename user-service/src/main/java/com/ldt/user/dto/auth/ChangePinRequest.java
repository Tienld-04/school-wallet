package com.ldt.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePinRequest {
    @NotBlank(message = "{validation.current_otp.required}")
    @Size(min = 6, max = 6, message = "{validation.otp.length}")
    @Pattern(regexp = "\\d{6}", message = "{validation.otp.digits}")
    private String currentPin;

    @NotBlank(message = "{validation.new_otp.required}")
    @Size(min = 6, max = 6, message = "{validation.otp.length}")
    @Pattern(regexp = "\\d{6}", message = "{validation.otp.digits}")
    private String newPin;

    @NotBlank(message = "{validation.confirm_otp.required}")
    private String confirmPin;
}
