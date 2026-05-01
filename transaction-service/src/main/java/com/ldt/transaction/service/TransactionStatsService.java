package com.ldt.transaction.service;

import com.ldt.transaction.dto.response.StatsOverviewResponse;
import com.ldt.transaction.dto.response.TimeSeriesPoint;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TransactionStatsService {

    private final TransactionRepository transactionRepository;


    /**
     * Lấy KPI tổng quan + phân loại theo type/status trong [from, to].
     * Tối ưu 3 query DB (1 KPI gộp FILTER + 2 group by).
     */
    public StatsOverviewResponse getOverview(LocalDateTime from, LocalDateTime to) {
        List<Object[]> kpiRows = transactionRepository.aggregateOverviewKpis(from, to);
        Object[] kpis = kpiRows.isEmpty() ? new Object[]{0L, 0L, 0L, BigDecimal.ZERO, BigDecimal.ZERO} : kpiRows.get(0);
        long total = ((Number) kpis[0]).longValue();
        long successCount = ((Number) kpis[1]).longValue();
        long failedCount = ((Number) kpis[2]).longValue();
        BigDecimal volume = toBigDecimal(kpis[3]);
        BigDecimal fee = toBigDecimal(kpis[4]);

        Map<String, Long> byType = aggregateByType(transactionRepository.countGroupByType(from, to));
        Map<String, Long> byStatus = aggregateByStatus(transactionRepository.countGroupByStatus(from, to));

        double successRate = total == 0 ? 0.0 : (double) successCount / total;

        return StatsOverviewResponse.builder()
                .totalTransactions(total)
                .totalVolume(volume)
                .totalFee(fee)
                .successCount(successCount)
                .failedCount(failedCount)
                .successRate(successRate)
                .byType(byType)
                .byStatus(byStatus)
                .build();
    }

    /**
     * Volume + count theo ngày/tuần/tháng cho biểu đồ chart.
     * Validate granularity rồi map mỗi row sang TimeSeriesPoint với period dạng yyyy-MM-dd.
     */
    public List<TimeSeriesPoint> getTimeSeries(LocalDateTime from, LocalDateTime to, String granularity) {
        String g = granularity == null ? "day" : granularity.toLowerCase();
        if (!Set.of("day", "week", "month").contains(g)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "granularity chỉ nhận: day | week | month");
        }
        return transactionRepository.aggregateTimeSeries(g, from, to).stream()
                .map(row -> {
                    Timestamp ts = (Timestamp) row[0];
                    long count = ((Number) row[1]).longValue();
                    BigDecimal volume = (BigDecimal) row[2];
                    return TimeSeriesPoint.builder()
                            .period(ts.toLocalDateTime().toLocalDate().toString()) 
                            .count(count)
                            .volume(volume)
                            .build();
                })
                .toList();
    }

    /**
     * Defensive cast Number → BigDecimal vì native query có thể trả Long khi COALESCE(..., 0).
     * Tránh dùng doubleValue để không mất precision với amount lớn.
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Long l) return BigDecimal.valueOf(l);
        if (value instanceof Integer i) return BigDecimal.valueOf(i);
        if (value instanceof Number n) return new BigDecimal(n.toString());
        return BigDecimal.ZERO;
    }

  
    /**
     * Convert raw [TransactionType, count] rows → Map<typeName, count>.
     * Fill 0 cho enum value không xuất hiện trong kết quả query.
     */
    private Map<String, Long> aggregateByType(List<Object[]> rows) {
        Map<TransactionType, Long> raw = new EnumMap<>(TransactionType.class);
        for (Object[] row : rows) {
            raw.put((TransactionType) row[0], (Long) row[1]);
        }
        Map<String, Long> result = new java.util.LinkedHashMap<>();
        for (TransactionType t : TransactionType.values()) {
            result.put(t.name(), raw.getOrDefault(t, 0L));
        }
        return result;
    }
    
    /**
     * Convert raw [TransactionStatus, count] rows → Map<statusName, count>.
     * Fill 0 cho enum value không xuất hiện trong kết quả query.
     */
    private Map<String, Long> aggregateByStatus(List<Object[]> rows) {
        Map<TransactionStatus, Long> raw = new EnumMap<>(TransactionStatus.class);
        for (Object[] row : rows) {
            raw.put((TransactionStatus) row[0], (Long) row[1]);
        }
        Map<String, Long> result = new java.util.LinkedHashMap<>();
        for (TransactionStatus s : TransactionStatus.values()) {
            result.put(s.name(), raw.getOrDefault(s, 0L));
        }
        return result;
    }
}
