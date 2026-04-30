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
    @NotNull(message = "fromUserId không được để trống")
    private UUID fromUserId;

    @NotNull(message = "toUserId không được để trống")
    private UUID toUserId;

    @NotNull(message = "platformUserId không được để trống")
    private UUID platformUserId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Phí không được để trống")
    @DecimalMin(value = "0", message = "Phí không được âm")
    private BigDecimal fee;

    @NotNull(message = "transactionId không được để trống")
    private UUID transactionId;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}
