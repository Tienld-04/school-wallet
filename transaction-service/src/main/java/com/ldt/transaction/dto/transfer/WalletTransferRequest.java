package com.ldt.transaction.dto.transfer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
@Data
public class WalletTransferRequest {
    private UUID fromWalletId;
    private UUID toWalletId;
    private BigDecimal amount;
}
