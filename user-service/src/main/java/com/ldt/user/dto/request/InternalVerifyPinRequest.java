package com.ldt.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO dùng cho giao tiếp nội bộ giữa transaction-service và user-service
 * để xác thực PIN trước khi chuyển tiền.
 */
@Getter
@Setter
public class InternalVerifyPinRequest {
    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pin;
}
