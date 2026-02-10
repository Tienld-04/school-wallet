package com.ldt.transaction.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class TransferRequest {
    private String requestId;
    private UUID fromWalletId;
    private UUID toWalletId;
    private BigDecimal amount;
    private String description;
}