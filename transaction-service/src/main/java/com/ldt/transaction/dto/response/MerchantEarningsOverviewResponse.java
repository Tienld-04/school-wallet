package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * KPI doanh thu cho user là chủ merchant (filter to_user_id = current user).
 * Gross: tổng customer trả. Net: thực nhận vào ví (gross - fee). Fee: phí nền tảng đã trả.
 */
@Data
@Builder
public class MerchantEarningsOverviewResponse {
    private BigDecimal grossRevenue;          // Tổng customer trả
    private BigDecimal netRevenue;            // Thực nhận vào ví (= gross - fee)
    private BigDecimal totalFee;              // Tổng phí nền tảng đã trả
    private long transactionCount;            // Số giao dịch
    private BigDecimal averageNetPerTx;       // Net trung bình / giao dịch
    private UUID topMerchantId;               // Dịch vụ doanh thu cao nhất (nullable)
    private BigDecimal topMerchantNetRevenue;
}
