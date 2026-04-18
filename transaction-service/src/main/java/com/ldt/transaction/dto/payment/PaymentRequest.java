package com.ldt.transaction.dto.payment;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class PaymentRequest {
    @NotBlank(message = "Request ID không được để trống")
    private String requestId;

    @NotNull(message = "Merchant ID không được để trống")
    private UUID merchantId;

    @NotBlank(message = "Tên merchant không được để trống")
    private String merchantName;

    @NotBlank(message = "Số điện thoại merchant không được để trống")
    private String merchantPhone;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền tối thiểu là 1,000đ")
    private BigDecimal amount;

    private String description;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pin;
}
