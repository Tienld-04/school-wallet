package com.ldt.user.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO dùng cho giao tiếp nội bộ giữa transaction-service và user-service
 * để xác thực PIN trước khi chuyển tiền.
 */
@Getter
@Setter
public class InternalVerifyPinRequest {
    private String phone;
    private String pin;
}
