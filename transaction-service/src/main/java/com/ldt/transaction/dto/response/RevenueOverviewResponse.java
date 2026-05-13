package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * KPI tổng quan doanh thu từ phí nền tảng (chỉ tính giao dịch SUCCESS có merchant + fee > 0).
 */
@Data
@Builder
public class RevenueOverviewResponse {
    private BigDecimal totalRevenue;          // Tổng phí nền tảng thu được
    private long transactionCount;            // Số lượng giao dịch merchant tính phí
    private BigDecimal averageRevenuePerTx;   // Doanh thu trung bình / giao dịch
    private UUID topMerchantId;               // Merchant đóng góp nhiều nhất (null nếu không có data)
    private BigDecimal topMerchantRevenue;
}
