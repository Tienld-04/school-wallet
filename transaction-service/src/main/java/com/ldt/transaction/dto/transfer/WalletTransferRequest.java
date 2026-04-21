package com.ldt.transaction.dto.transfer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class WalletTransferRequest {
    private UUID fromUserId;
    private UUID toUserId;
    private BigDecimal amount;
    /** ID của transaction ở transaction-service — wallet-service dùng để gắn ledger. */
    private UUID transactionId;
    /** Khớp với LedgerReason bên wallet-service: TRANSFER_OUT hoặc PAYMENT. */
    private String reason;
    private String note;
}
