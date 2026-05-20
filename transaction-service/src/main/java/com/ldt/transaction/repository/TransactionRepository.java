package com.ldt.transaction.repository;

import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    boolean existsByRequestId(String requestId);

    Optional<Transaction> findByRequestId(String requestId);

    List<Transaction> findByToUserIdAndTransactionTypeAndStatus(
            UUID toUserId, TransactionType transactionType, TransactionStatus status);

    List<Transaction> findByTransactionTypeAndStatusAndCreatedAtBefore(
            TransactionType transactionType, TransactionStatus status, LocalDateTime createdAt);

    Page<Transaction> findByFromUserIdOrToUserId(UUID fromUserId, UUID toUserId, Pageable pageable);

    List<Transaction> findTop5ByFromUserIdOrToUserIdOrderByCreatedAtDesc(UUID fromUserId, UUID toUserId);

    @Query("SELECT t FROM Transaction t " +
            "WHERE (t.fromUserId = :userId OR t.toUserId = :userId) " +
            "AND t.status = :status " +
            "ORDER BY t.createdAt DESC")
    List<Transaction> findTop5ByUserIdAndStatus(@Param("userId") UUID userId,
                                                @Param("status") TransactionStatus status,
                                                Pageable pageable);

    // For admin dashboard - group by type and status
    @Query("SELECT t.transactionType, COUNT(t) FROM Transaction t " +
            "WHERE t.createdAt BETWEEN :from AND :to " +
            "GROUP BY t.transactionType")
    List<Object[]> countGroupByType(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT t.status, COUNT(t) FROM Transaction t " +
            "WHERE t.createdAt BETWEEN :from AND :to " +
            "GROUP BY t.status")
    List<Object[]> countGroupByStatus(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value =
            "WITH series AS ( " +
                    "  SELECT generate_series( " +
                    "    DATE_TRUNC(:granularity, CAST(:from AS timestamp)), " +
                    "    DATE_TRUNC(:granularity, CAST(:to AS timestamp)), " +
                    "    CAST('1 ' || :granularity AS interval) " +
                    "  ) AS period " +
                    ") " +
                    "SELECT s.period, " +
                    "       COUNT(t.transaction_id) AS cnt, " +
                    "       COALESCE(SUM(t.amount), 0) AS volume " +
                    "FROM series s " +
                    "LEFT JOIN transactions t " +
                    "  ON DATE_TRUNC(:granularity, t.created_at) = s.period " +
                    "  AND t.status = 'SUCCESS' " +
                    "  AND t.created_at BETWEEN :from AND :to " +
                    "GROUP BY s.period " +
                    "ORDER BY s.period ASC",
            nativeQuery = true)
    List<Object[]> aggregateTimeSeries(@Param("granularity") String granularity,
                                       @Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);

    @Query(value =
            "SELECT " +
                    "  COUNT(*) AS total_count, " +
                    "  COUNT(*) FILTER (WHERE status = 'SUCCESS') AS success_count, " +
                    "  COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count, " +
                    "  COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) AS total_volume, " +
                    "  COALESCE(SUM(fee) FILTER (WHERE status = 'SUCCESS'), 0) AS total_fee " +
                    "FROM transactions " +
                    "WHERE created_at BETWEEN :from AND :to",
            nativeQuery = true)
    List<Object[]> aggregateOverviewKpis(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);

    // ── Revenue (platform fee) statistics — chỉ tính tx merchant SUCCESS có fee > 0 ──
    @Query(value =
            "SELECT " +
                    "  COUNT(*) AS tx_count, " +
                    "  COALESCE(SUM(fee), 0) AS total_revenue, " +
                    "  COALESCE(AVG(fee), 0) AS avg_revenue " +
                    "FROM transactions " +
                    "WHERE merchant_id IS NOT NULL " +
                    "  AND status = 'SUCCESS' " +
                    "  AND fee > 0 " +
                    "  AND created_at BETWEEN :from AND :to",
            nativeQuery = true)
    List<Object[]> aggregateRevenueOverview(@Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to);

    @Query(value =
            "WITH series AS ( " +
                    "  SELECT generate_series( " +
                    "    DATE_TRUNC(:granularity, CAST(:from AS timestamp)), " +
                    "    DATE_TRUNC(:granularity, CAST(:to AS timestamp)), " +
                    "    CAST('1 ' || :granularity AS interval) " +
                    "  ) AS period " +
                    ") " +
                    "SELECT s.period, " +
                    "       COUNT(t.transaction_id) AS cnt, " +
                    "       COALESCE(SUM(t.fee), 0) AS revenue " +
                    "FROM series s " +
                    "LEFT JOIN transactions t " +
                    "  ON DATE_TRUNC(:granularity, t.created_at) = s.period " +
                    "  AND t.merchant_id IS NOT NULL " +
                    "  AND t.status = 'SUCCESS' " +
                    "  AND t.fee > 0 " +
                    "  AND t.created_at BETWEEN :from AND :to " +
                    "GROUP BY s.period " +
                    "ORDER BY s.period ASC",
            nativeQuery = true)
    List<Object[]> aggregateRevenueTimeSeries(@Param("granularity") String granularity,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    @Query(value =
            "SELECT " +
                    "  merchant_id, " +
                    "  COUNT(*) AS tx_count, " +
                    "  SUM(fee) AS total_revenue " +
                    "FROM transactions " +
                    "WHERE merchant_id IS NOT NULL " +
                    "  AND status = 'SUCCESS' " +
                    "  AND fee > 0 " +
                    "  AND created_at BETWEEN :from AND :to " +
                    "GROUP BY merchant_id " +
                    "ORDER BY total_revenue DESC",
            nativeQuery = true)
    List<Object[]> aggregateRevenueByMerchant(@Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    // ── Merchant earnings (cho USER là chủ merchant — filter to_user_id) ──

    @Query(value =
            "SELECT " +
                    "  COUNT(*) AS tx_count, " +
                    "  COALESCE(SUM(amount), 0) AS gross_revenue, " +
                    "  COALESCE(SUM(amount - fee), 0) AS net_revenue, " +
                    "  COALESCE(SUM(fee), 0) AS total_fee " +
                    "FROM transactions " +
                    "WHERE to_user_id = :toUserId " +
                    "  AND merchant_id IS NOT NULL " +
                    "  AND status = 'SUCCESS' " +
                    "  AND created_at BETWEEN :from AND :to",
            nativeQuery = true)
    List<Object[]> aggregateMerchantEarningsOverview(@Param("toUserId") UUID toUserId,
                                                     @Param("from") LocalDateTime from,
                                                     @Param("to") LocalDateTime to);

    @Query(value =
            "WITH series AS ( " +
                    "  SELECT generate_series( " +
                    "    DATE_TRUNC(:granularity, CAST(:from AS timestamp)), " +
                    "    DATE_TRUNC(:granularity, CAST(:to AS timestamp)), " +
                    "    CAST('1 ' || :granularity AS interval) " +
                    "  ) AS period " +
                    ") " +
                    "SELECT s.period, " +
                    "       COUNT(t.transaction_id) AS cnt, " +
                    "       COALESCE(SUM(t.amount), 0) AS gross_revenue, " +
                    "       COALESCE(SUM(t.amount - t.fee), 0) AS net_revenue " +
                    "FROM series s " +
                    "LEFT JOIN transactions t " +
                    "  ON DATE_TRUNC(:granularity, t.created_at) = s.period " +
                    "  AND t.to_user_id = :toUserId " +
                    "  AND t.merchant_id IS NOT NULL " +
                    "  AND t.status = 'SUCCESS' " +
                    "  AND t.created_at BETWEEN :from AND :to " +
                    "GROUP BY s.period " +
                    "ORDER BY s.period ASC",
            nativeQuery = true)
    List<Object[]> aggregateMerchantEarningsTimeSeries(@Param("toUserId") UUID toUserId,
                                                       @Param("granularity") String granularity,
                                                       @Param("from") LocalDateTime from,
                                                       @Param("to") LocalDateTime to);

    @Query(value =
            "SELECT " +
                    "  merchant_id, " +
                    "  COUNT(*) AS tx_count, " +
                    "  SUM(amount) AS gross_revenue, " +
                    "  SUM(amount - fee) AS net_revenue " +
                    "FROM transactions " +
                    "WHERE to_user_id = :toUserId " +
                    "  AND merchant_id IS NOT NULL " +
                    "  AND status = 'SUCCESS' " +
                    "  AND created_at BETWEEN :from AND :to " +
                    "GROUP BY merchant_id " +
                    "ORDER BY net_revenue DESC",
            nativeQuery = true)
    List<Object[]> aggregateMerchantEarningsByMerchant(@Param("toUserId") UUID toUserId,
                                                       @Param("from") LocalDateTime from,
                                                       @Param("to") LocalDateTime to);
}
