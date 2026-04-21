package com.ldt.wallet.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "wallet_ledger", indexes = {
        @Index(name = "idx_wallet_ledger_wallet_id", columnList = "wallet_id"),
        @Index(name = "idx_wallet_ledger_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_wallet_ledger_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
public class WalletLedger {
    @Id
    @GeneratedValue
    @Column(name = "entry_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID entryId;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    /**
     * Tham chiếu tới transaction bên transaction-service (không FK vì khác service).
     * Nullable vì TOP_UP / ADJUSTMENT có thể không gắn với 1 transaction cụ thể.
     */
    @Column(name = "transaction_id")
    private UUID transactionId;

    @Column(name = "direction", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private LedgerDirection direction;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_before", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "reason", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LedgerReason reason;

    @Column(name = "note", length = 255)
    private String note;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
