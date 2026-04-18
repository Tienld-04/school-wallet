package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RecentTransactionResponse {
    private UUID transactionId;
    private String description;
    private String amount; // "+500.000" hoặc "-1.200.000"
    private LocalDateTime createdAt;
}
