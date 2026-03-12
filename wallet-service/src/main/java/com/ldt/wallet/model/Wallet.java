package com.ldt.wallet.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
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
@Table(name = "wallets")
@EntityListeners(AuditingEntityListener.class)
public class Wallet {
    @Id
    @GeneratedValue
    @Column(name = "wallet_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID walletId;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;  // Tham chiếu, không FK

    @Column(name = "balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private WalletStatus status = WalletStatus.ACTIVE;

    @Column(name = "wallet_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private WalletType walletType = WalletType.USER_WALLET;

    @Column(name = "daily_limit", precision = 18, scale = 2)
    private BigDecimal dailyLimit = new BigDecimal("5000000.00");

    @Column(name = "monthly_limit", precision = 18, scale = 2)
    private BigDecimal monthlyLimit = new BigDecimal("30000000.00");

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "VND";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

//    @PrePersist
//    protected void onCreate() {
//        this.createdAt = LocalDateTime.now();
//    }
//    @PreUpdate
//    protected void onUpdate() {
//        this.updatedAt = LocalDateTime.now();
//    }
}
