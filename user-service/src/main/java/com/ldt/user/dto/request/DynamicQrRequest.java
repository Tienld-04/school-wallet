package com.ldt.user.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DynamicQrRequest {

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "1000", message = "{validation.amount.min}")
    private BigDecimal amount;
    private String description;

}
