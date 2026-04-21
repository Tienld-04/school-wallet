package com.ldt.transaction.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferRequest {
    @NotBlank(message = "Request ID không được để trống")
    private String requestId;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    private String toPhoneNumber;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền tối thiểu là 1,000đ")
    private BigDecimal amount;
    
    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String description;

    @NotBlank(message = "Mã PIN không được để trống")
    private String pin;
}

