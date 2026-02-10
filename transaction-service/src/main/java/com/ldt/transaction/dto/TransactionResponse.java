package com.ldt.transaction.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
@Data
public class TransactionResponse {
    private UUID transactionId;
    //private String requestId;
    private String fromWalletId;
    private String toWalletId;
    private BigDecimal amount;
    //private UUID merchantId;
    private String description;

}
