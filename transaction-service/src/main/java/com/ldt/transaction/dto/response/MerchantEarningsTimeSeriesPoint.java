package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Điểm biểu đồ doanh thu merchant theo thời gian.
 * Hiển thị cả gross + net để user thấy mức ảnh hưởng của phí.
 */
@Data
@Builder
public class MerchantEarningsTimeSeriesPoint {
    private String period;            // yyyy-MM-dd
    private long count;
    private BigDecimal grossRevenue;
    private BigDecimal netRevenue;
}
