package com.ldt.transaction.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue
    @Column(name = "transaction_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID transactionId;
    /**
     * FE gửi về requestId mỗi hành động chuyển tiền = 1 requestId duy nhất
     * chống gửi trùng request (idempotency)
     */
    @Column(name = "request_id", unique = true, nullable = false)
    private String requestId;

    @Column(name = "from_wallet_id", nullable = false)
    private UUID fromWalletId;

    @Column(name = "to_wallet_id", nullable = false)
    private UUID toWalletId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    // payment
    @Column(name = "merchant_id")
    private UUID merchantId;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "create_by")
    private String createdBy;
    @Column(name = "update_by")
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
//        this.createdBy = getCurrentUser();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
//        this.updatedBy = getCurrentUser();
    }

}
