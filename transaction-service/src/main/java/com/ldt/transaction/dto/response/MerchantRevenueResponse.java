package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Doanh thu tính theo từng merchant trong khoảng [from, to].
 * BE chỉ trả merchantId — FE map sang tên merchant từ danh sách merchant của admin.
 */
@Data
@Builder
public class MerchantRevenueResponse {
    private UUID merchantId;
    private long transactionCount;
    private BigDecimal totalRevenue;
}
