package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionStatusHistoryResponse {
    private UUID historyId;
    private UUID transactionId;
    private String fromStatus;
    private String toStatus;
    private String reason;
    private LocalDateTime changedAt;
}
