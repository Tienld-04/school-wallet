package com.ldt.user.dto.merchant;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MerchantListResponse {
    private UUID merchantId;
    private String name;
    private String type;
    private UUID userId;
    private String userPhone;
}
