package com.ldt.wallet.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WalletCreateRequest {
    @NotNull(message = "userId không được để trống")
    private UUID userId;
}
