package com.ldt.wallet.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WalletCreateRequest {
    private UUID userId;
}
