package com.ldt.wallet.dto.request;

import com.ldt.wallet.model.LedgerReason;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class WalletTransferRequest {
    @NotNull(message = "{validation.from_user_id.required}")
    private UUID fromUserId;

    @NotNull(message = "{validation.to_user_id.required}")
    private UUID toUserId;

    @NotNull(message = "{validation.amount.required}")
    @DecimalMin(value = "0", inclusive = false, message = "{validation.amount.positive}")
    private BigDecimal amount;

    /**
     * ID của transaction bên transaction-service — để gắn vào ledger làm audit trail.
     */
    @NotNull(message = "{validation.transaction_id.required}")
    private UUID transactionId;

    /**
     * Lý do giao dịch nhìn từ phía ví trừ tiền (TRANSFER_OUT / PAYMENT).
     * Ví nhận sẽ được ghi ledger với reason tương ứng (TRANSFER_IN hoặc PAYMENT).
     * Mặc định TRANSFER_OUT nếu không truyền.
     */
    private LedgerReason reason;

    @Size(max = 255, message = "{validation.note.max_length}")
    private String note;
}
