package com.ldt.transaction.repository;

import com.ldt.transaction.model.TransactionStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionStatusHistoryRepository extends JpaRepository<TransactionStatusHistory, UUID> {
    List<TransactionStatusHistory> findByTransactionIdOrderByChangedAtAsc(UUID transactionId);
}
