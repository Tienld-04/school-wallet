package com.ldt.transaction.dto.topup;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InitiateTopupRequest {
    @NotBlank(message = "{validation.topup_request_id.required}")
    @Size(max = 64, message = "{validation.topup_request_id.max_length}")
    private String requestId;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "10000", message = "{validation.topup_amount.min}")
    @DecimalMax(value = "100000000", message = "{validation.topup_amount.max}")
    private BigDecimal amount;

    @Size(max = 20, message = "{validation.bank_code.max_length}")
    private String bankCode;

    @Size(max = 5, message = "{validation.language.max_length}")
    private String language;
}
