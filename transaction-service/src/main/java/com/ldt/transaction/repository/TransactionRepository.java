package com.ldt.transaction.repository;

import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
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
}
