package com.ldt.user.dto.merchant;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MerchantResponse {
    private UUID merchantId;
    private String name;
    private String type;
    private Boolean active;
    private UUID userId;
    private String userPhone;
    private LocalDateTime createdAt;
}
