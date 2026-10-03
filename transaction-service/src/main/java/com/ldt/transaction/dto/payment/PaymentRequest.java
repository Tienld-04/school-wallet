package com.ldt.transaction.dto.payment;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class PaymentRequest {
    @NotBlank(message = "{validation.request_id.required}")
    private String requestId;

    @NotNull(message = "{validation.merchant_id.required}")
    private UUID merchantId;

    @NotBlank(message = "{validation.merchant_name.required}")
    private String merchantName;

    @NotBlank(message = "{validation.merchant_phone.required}")
    private String merchantPhone;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "1000", message = "{validation.amount.min}")
    private BigDecimal amount;

    private String description;

    @NotBlank(message = "{validation.pin.required}")
    private String pin;
}
