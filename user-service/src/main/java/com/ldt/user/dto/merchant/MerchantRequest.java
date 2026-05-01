package com.ldt.user.dto.merchant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MerchantRequest {
    @NotBlank(message = "Tên merchant không được trống")
    @Size(max = 100, message = "Tên merchant tối đa 100 ký tự")
    private String name;

    @NotBlank(message = "Loại merchant không được trống")
    private String type;

    @NotBlank(message = "Số điện thoại không được trống")
    @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải có đúng 10 chữ số")
    private String userPhone;
}
