package com.ldt.transaction.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferRequest {
    @NotBlank(message = "{validation.request_id.required}")
    private String requestId;

    @NotBlank(message = "{validation.to_phone.required}")
    private String toPhoneNumber;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "1000", message = "{validation.amount.min}")
    private BigDecimal amount;
    
    @Size(max = 255, message = "{validation.description.max_length}")
    private String description;

    @NotBlank(message = "{validation.pin.required}")
    private String pin;
}

