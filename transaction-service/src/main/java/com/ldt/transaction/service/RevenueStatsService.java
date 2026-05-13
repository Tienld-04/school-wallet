package com.ldt.transaction.service;

import com.ldt.transaction.dto.response.MerchantRevenueResponse;
import com.ldt.transaction.dto.response.RevenueOverviewResponse;
import com.ldt.transaction.dto.response.RevenueTimeSeriesPoint;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Thống kê doanh thu từ phí nền tảng (chỉ giao dịch merchant SUCCESS với fee > 0).
 * Tách khỏi TransactionStatsService để mỗi service một concern.
 */
@Service
@RequiredArgsConstructor
public class RevenueStatsService {

    private final TransactionRepository transactionRepository;

    /**
     * KPI tổng quan: tổng doanh thu, số giao dịch, trung bình, top merchant.
     */
    public RevenueOverviewResponse getOverview(LocalDateTime from, LocalDateTime to) {
        List<Object[]> kpiRows = transactionRepository.aggregateRevenueOverview(from, to);
        Object[] kpis = kpiRows.isEmpty()
                ? new Object[]{0L, BigDecimal.ZERO, BigDecimal.ZERO}
                : kpiRows.get(0);

        long txCount = ((Number) kpis[0]).longValue();
        BigDecimal totalRevenue = toBigDecimal(kpis[1]);
        BigDecimal avgRevenue = toBigDecimal(kpis[2]).setScale(2, RoundingMode.HALF_UP);

        // Top merchant: lấy từ kết quả group by merchant đã sort DESC
        UUID topMerchantId = null;
        BigDecimal topMerchantRevenue = BigDecimal.ZERO;
        List<Object[]> merchantRows = transactionRepository.aggregateRevenueByMerchant(from, to);
        if (!merchantRows.isEmpty()) {
            Object[] top = merchantRows.get(0);
            topMerchantId = (UUID) top[0];
            topMerchantRevenue = toBigDecimal(top[2]);
        }

        return RevenueOverviewResponse.builder()
                .totalRevenue(totalRevenue)
                .transactionCount(txCount)
                .averageRevenuePerTx(avgRevenue)
                .topMerchantId(topMerchantId)
                .topMerchantRevenue(topMerchantRevenue)
                .build();
    }

    /**
     * Doanh thu theo thời gian cho biểu đồ. Dùng generate_series để fill gap (period không có data → 0).
     */
    public List<RevenueTimeSeriesPoint> getTimeSeries(LocalDateTime from, LocalDateTime to, String granularity) {
        String g = granularity == null ? "day" : granularity.toLowerCase();
        if (!Set.of("day", "week", "month").contains(g)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "granularity chỉ nhận: day | week | month");
        }
        return transactionRepository.aggregateRevenueTimeSeries(g, from, to).stream()
                .map(row -> {
                    Timestamp ts = (Timestamp) row[0];
                    long count = ((Number) row[1]).longValue();
                    BigDecimal revenue = toBigDecimal(row[2]);
                    return RevenueTimeSeriesPoint.builder()
                            .period(ts.toLocalDateTime().toLocalDate().toString())
                            .count(count)
                            .revenue(revenue)
                            .build();
                })
                .toList();
    }

    /**
     * Danh sách doanh thu theo từng merchant, sort DESC theo doanh thu.
     * FE map merchantId → merchant name từ danh sách merchant của admin.
     */
    public List<MerchantRevenueResponse> getByMerchant(LocalDateTime from, LocalDateTime to) {
        return transactionRepository.aggregateRevenueByMerchant(from, to).stream()
                .map(row -> MerchantRevenueResponse.builder()
                        .merchantId((UUID) row[0])
                        .transactionCount(((Number) row[1]).longValue())
                        .totalRevenue(toBigDecimal(row[2]))
                        .build())
                .toList();
    }

    /**
     * Defensive cast Number → BigDecimal: native query có thể trả Long khi COALESCE(..., 0).
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Long l) return BigDecimal.valueOf(l);
        if (value instanceof Integer i) return BigDecimal.valueOf(i);
        if (value instanceof Number n) return new BigDecimal(n.toString());
        return BigDecimal.ZERO;
    }
}
