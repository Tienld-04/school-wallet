package com.ldt.notification.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_log", indexes = {
        @Index(name = "idx_nlog_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_nlog_user_id", columnList = "user_id"),
        @Index(name = "idx_nlog_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", length = 10, nullable = false)
    private NotificationChannel channel;

    @Column(name = "recipient", length = 255, nullable = false)
    private String recipient;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "transaction_id")
    private UUID transactionId;

    @Column(name = "transaction_type", length = 50)
    private String transactionType;

    @Column(name = "amount", precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", length = 10)
    private NotificationDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20, nullable = false)
    private NotificationSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    private NotificationStatus status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
