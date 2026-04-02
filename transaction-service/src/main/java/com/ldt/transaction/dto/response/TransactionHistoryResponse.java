package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionHistoryResponse {
    private UUID transactionId;
    private UUID fromUserId;
    private String fromFullName;
    private String fromPhone;
    private UUID toUserId;
    private String toFullName;
    private String toPhone;
    private BigDecimal amount;
    private String description;
    private String transactionType;
    private String status;
    private LocalDateTime createdAt;
}
