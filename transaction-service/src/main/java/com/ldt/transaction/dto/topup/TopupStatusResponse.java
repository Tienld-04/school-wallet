package com.ldt.transaction.dto.topup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopupStatusResponse {
    private String requestId;
    private UUID transactionId;
    private String status; // PENDING | SUCCESS | FAILED
    private BigDecimal amount;
    private String description;
    private String message;
    private LocalDateTime createdAt;
}
