package com.ldt.wallet.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request cho 3-party split: customer DEBIT amount, merchant CREDIT (amount-fee),
 * platform CREDIT fee. Tất cả ghi cùng 1 transactionId, atomic trong 1 DB transaction.
 */
@Getter
@Setter
public class WalletTransferWithFeeRequest {
    @NotNull(message = "{validation.from_user_id.required}")
    private UUID fromUserId;

    @NotNull(message = "{validation.to_user_id.required}")
    private UUID toUserId;

    @NotNull(message = "{validation.platform_user_id.required}")
    private UUID platformUserId;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "0", inclusive = false, message = "{validation.amount.positive}")
    private BigDecimal amount;

    @NotNull(message = "{validation.fee.required}")
    @DecimalMin(value = "0", message = "{validation.fee.non_negative}")
    private BigDecimal fee;

    @NotNull(message = "{validation.transaction_id.required}")
    private UUID transactionId;

    @Size(max = 255, message = "{validation.note.max_length}")
    private String note;
}
