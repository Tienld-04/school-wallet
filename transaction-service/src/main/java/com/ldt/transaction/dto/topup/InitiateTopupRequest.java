package com.ldt.transaction.dto.topup;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InitiateTopupRequest {
    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "10000", message = "Số tiền nạp tối thiểu là 10,000 VND")
    @DecimalMax(value = "100000000", message = "Số tiền nạp tối đa là 100,000,000 VND")
    private BigDecimal amount;

    @Size(max = 20, message = "Mã ngân hàng tối đa 20 ký tự")
    private String bankCode;

    @Size(max = 5, message = "Locale tối đa 5 ký tự")
    private String language;
}
