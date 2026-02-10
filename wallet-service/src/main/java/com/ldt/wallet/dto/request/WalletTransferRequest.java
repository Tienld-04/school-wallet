package com.ldt.wallet.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;
@Getter
@Setter
public class WalletTransferRequest {
    private UUID fromWalletId;
    private UUID toWalletId;
    private BigDecimal amount;
}
