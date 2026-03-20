package com.ldt.transaction.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferRequest {
    private String requestId;
    private String toPhoneNumber;
    private BigDecimal amount;
    private String description;
    private String pin;
}

