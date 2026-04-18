package com.ldt.wallet.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
}
