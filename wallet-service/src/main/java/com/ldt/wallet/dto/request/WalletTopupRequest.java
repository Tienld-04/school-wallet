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
    @NotNull(message = "Người nhận không được để trống")
    private UUID toUserId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Mã giao dịch không được để trống")
    private UUID transactionId;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}
