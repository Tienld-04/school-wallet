package com.ldt.transaction.dto.transfer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
@Data
public class WalletTransferRequest {
    private UUID fromUserId;
    private UUID toUserId;
    private BigDecimal amount;
}
