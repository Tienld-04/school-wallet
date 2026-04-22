package com.ldt.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String title;
    private String description;
    private String type;
    private boolean isRead;
    private UUID transactionId;
    private String transactionType;
    private BigDecimal amount;
    private String direction;
    private String counterpartyName;
    private String counterpartyPhone;
    private LocalDateTime createdAt;
}
