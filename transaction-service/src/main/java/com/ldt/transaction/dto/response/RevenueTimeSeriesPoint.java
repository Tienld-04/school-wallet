package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Một điểm trên biểu đồ doanh thu theo thời gian.
 */
@Data
@Builder
public class RevenueTimeSeriesPoint {
    private String period;       // yyyy-MM-dd (đầu khoảng theo granularity)
    private long count;          // Số giao dịch merchant trong period
    private BigDecimal revenue;  // Tổng fee thu được trong period
}
