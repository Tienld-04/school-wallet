package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPinRequest {
    @NotBlank(message = "{validation.pin.required}")
    @Size(min = 6, max = 6, message = "{validation.pin.length}")
    private String pin;
}
