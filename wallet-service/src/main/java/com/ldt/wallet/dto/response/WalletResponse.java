package com.ldt.wallet.dto.response;

import com.ldt.wallet.model.WalletStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
@Data
public class WalletResponse {
    private UUID walletId;
    private UUID userId;
    private BigDecimal balance;
    private WalletStatus status;
}
