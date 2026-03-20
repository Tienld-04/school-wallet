package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPinRequest {
    @NotBlank(message = "Mã PIN không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN phải đúng 6 số")
    private String pin;
}
