package com.ldt.transaction.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
@Data
public class TransactionResponse {
    private UUID transactionId;
    //private String requestId;
    private String fromUserId;
    private String toUserId;
    /** Tổng customer trả (gross) — không phải số tiền merchant nhận. */
    private BigDecimal amount;
    /** Phí nền tảng đã tính trong amount. Merchant thực nhận = amount - fee. */
    private BigDecimal fee;
    //private UUID merchantId;
    private String description;
    private String status;
    private String transactionType;

}
