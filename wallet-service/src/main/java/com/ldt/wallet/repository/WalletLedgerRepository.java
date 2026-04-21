package com.ldt.wallet.repository;

import com.ldt.wallet.model.WalletLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WalletLedgerRepository extends JpaRepository<WalletLedger, UUID> {

    Page<WalletLedger> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);

    List<WalletLedger> findByTransactionId(UUID transactionId);

    Optional<WalletLedger> findTopByWalletIdOrderByCreatedAtDesc(UUID walletId);
}
