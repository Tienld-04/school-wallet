package com.ldt.user.dto.merchant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MerchantRequest {
    @NotBlank(message = "{validation.merchant_name.required}")
    @Size(max = 100, message = "{validation.merchant_name.max_length}")
    private String name;

    @NotBlank(message = "{validation.merchant_type.required}")
    private String type;

    @NotBlank(message = "{validation.merchant_phone.required}")
    @Pattern(regexp = "^\\d{10}$", message = "{validation.merchant_phone.pattern}")
    private String userPhone;
}
