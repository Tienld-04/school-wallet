package com.ldt.transaction.dto.topup;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request gửi sang wallet-service POST /internal/wallets/topup.
 * Mirror của com.ldt.wallet.dto.request.WalletTopupRequest.
 */
@Getter
@Setter
public class WalletTopupRequest {
    private UUID toUserId;
    private BigDecimal amount;
    private UUID transactionId;
    private String note;
}
