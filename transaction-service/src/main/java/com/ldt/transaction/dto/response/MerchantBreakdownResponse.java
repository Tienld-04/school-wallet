package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Doanh thu theo từng merchant của owner — dùng khi user sở hữu nhiều merchant.
 * FE map merchantId → name từ danh sách merchant của họ (`/merchants/my-user`).
 */
@Data
@Builder
public class MerchantBreakdownResponse {
    private UUID merchantId;
    private long transactionCount;
    private BigDecimal grossRevenue;
    private BigDecimal netRevenue;
}
