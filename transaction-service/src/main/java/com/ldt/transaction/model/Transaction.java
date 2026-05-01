package com.ldt.transaction.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_from_user_id", columnList = "from_user_id"),
        @Index(name = "idx_to_user_id", columnList = "to_user_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
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
     */
    @Column(name = "request_id", unique = true, nullable = false)
    private String requestId;

    @Column(name = "from_user_id", nullable = false)
    private UUID fromUserId;

    @Column(name = "from_phone", length = 15)
    private String fromPhone;

    @Column(name = "from_full_name", length = 100)
    private String fromFullName;

    @Column(name = "to_user_id", nullable = false)
    private UUID toUserId;

    @Column(name = "to_phone", length = 15)
    private String toPhone;

    @Column(name = "to_full_name", length = 100)
    private String toFullName;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    /**
     * Phí nền tảng (platform fee) admin thu về với merchant payment thông thường.
     * = 0 nếu giao dịch không tính fee (transfer/topup, hoặc admin thanh toán merchant — admin được miễn phí).
     * Số tiền merchant thực sự nhận được = amount - fee.
     */
    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "fee", nullable = false, precision = 18, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

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
    
// @ManyToOne(fetch = FetchType.LAZY)
// @JoinColumn(name = "merchant_id", nullable = true)
// private Merchant merchant;

    @Column(name = "description")
    private String description;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "create_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "update_by")
    private String updatedBy;

}
