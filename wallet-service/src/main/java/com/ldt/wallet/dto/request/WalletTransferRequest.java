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
    @NotNull(message = "fromUserId không được để trống")
    private UUID fromUserId;

    @NotNull(message = "toUserId không được để trống")
    private UUID toUserId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    /**
     * ID của transaction bên transaction-service — để gắn vào ledger làm audit trail.
     */
    @NotNull(message = "transactionId không được để trống")
    private UUID transactionId;

    /**
     * Lý do giao dịch nhìn từ phía ví trừ tiền (TRANSFER_OUT / PAYMENT).
     * Ví nhận sẽ được ghi ledger với reason tương ứng (TRANSFER_IN hoặc PAYMENT).
     * Mặc định TRANSFER_OUT nếu không truyền.
     */
    private LedgerReason reason;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}
