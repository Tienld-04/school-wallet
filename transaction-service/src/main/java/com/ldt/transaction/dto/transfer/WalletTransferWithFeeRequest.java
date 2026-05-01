package com.ldt.transaction.dto.transfer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class WalletTransferWithFeeRequest {
    private UUID fromUserId;
    private UUID toUserId;
    private UUID platformUserId;
    private BigDecimal amount;
    private BigDecimal fee;
    private UUID transactionId;
    private String note;
}
