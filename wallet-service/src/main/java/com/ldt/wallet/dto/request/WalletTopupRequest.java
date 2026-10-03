package com.ldt.wallet.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class WalletTopupRequest {
    @NotNull(message = "{validation.to_user_id.required}")
    private UUID toUserId;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "0", inclusive = false, message = "{validation.amount.positive}")
    private BigDecimal amount;

    @NotNull(message = "{validation.transaction_id.required}")
    private UUID transactionId;

    @Size(max = 255, message = "{validation.note.max_length}")
    private String note;
}
