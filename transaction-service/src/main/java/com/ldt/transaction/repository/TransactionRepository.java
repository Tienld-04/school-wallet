package com.ldt.transaction.repository;

import com.ldt.transaction.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    boolean existsByRequestId(String requestId);
    Optional<Transaction> findByRequestId(String requestId);
    Page<Transaction> findByFromUserIdOrToUserId(UUID fromUserId, UUID toUserId, Pageable pageable);
}
