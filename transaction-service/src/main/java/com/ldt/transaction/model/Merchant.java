package com.ldt.transaction.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "merchants")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {
    @Id
    @GeneratedValue
    @Column(name = "merchant_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID merchantId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private MerchantType type;
    // wallet id
    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "active")
    private Boolean active = true;

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
