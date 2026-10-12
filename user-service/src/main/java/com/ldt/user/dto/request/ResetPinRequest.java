package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPinRequest {
    @NotBlank(message = "{validation.phone.required}")
    @Size(min = 10, max = 10, message = "{validation.phone.length}")
    private String phone;

    @NotBlank(message = "{validation.new_pin.required}")
    @Size(min = 6, max = 6, message = "{validation.pin.length}")
    private String newPin;
}
