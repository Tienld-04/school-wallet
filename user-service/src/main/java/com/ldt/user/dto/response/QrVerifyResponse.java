package com.ldt.user.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class QrVerifyResponse {
    private String phone;
    private String name;
    // null -> QR Static
    private BigDecimal amount;
    private String description;
}
