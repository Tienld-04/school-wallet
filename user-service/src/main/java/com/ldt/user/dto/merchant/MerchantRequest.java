package com.ldt.user.dto.merchant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class MerchantRequest {
    @NotBlank(message = "Tên merchant không được trống")
    @Size(max = 100, message = "Tên merchant tối đa 100 ký tự")
    private String name;

    @NotBlank(message = "Loại merchant không được trống")
    private String type;

    @NotNull(message = "User ID không được trống")
    private UUID userId;
}
