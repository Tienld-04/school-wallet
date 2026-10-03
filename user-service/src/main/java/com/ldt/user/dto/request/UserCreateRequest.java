package com.ldt.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserCreateRequest {
    @NotBlank(message = "{validation.full_name.required}")
    private String fullName;
    @NotBlank @Pattern(regexp = "^\\d{10}$", message = "{validation.phone.length}")
    private String phone;
    @NotBlank @Email(message = "{validation.email.invalid}")
    private String email;
    @NotBlank @Size(min = 6, message = "{validation.password.min_length}")
    private String password;
    @NotBlank @Pattern(regexp = "^\\d{6}$", message = "{validation.pin.length}")
    private String transactionPin;

    @NotBlank(message = "{validation.verification_token.required}")
    private String verificationToken;
}
