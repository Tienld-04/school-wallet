package com.ldt.wallet.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WalletCreateRequest {
    @NotNull(message = "{validation.user_id.required}")
    private UUID userId;
}
