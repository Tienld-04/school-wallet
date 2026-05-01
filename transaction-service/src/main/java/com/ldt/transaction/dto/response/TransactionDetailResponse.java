package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Data
@Builder
public class TransactionDetailResponse {
    private UUID transactionId;
    private String fromFullName;
    private String fromPhone;
    private String toFullName;
    private String toPhone;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal displayAmount;
    private String description;
    private String transactionType;
    private String status;
    private UUID merchantId;
    private LocalDateTime createdAt;
    private List<TransactionStatusHistoryResponse> statusHistory;
}
