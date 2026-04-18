package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QrVerifyRequest {
    @NotBlank(message = "Nội dung QR không được để trống")
    private String qrContent;
}
