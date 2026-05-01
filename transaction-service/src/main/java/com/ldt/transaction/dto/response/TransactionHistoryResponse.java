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
    private String fromFullName;
    private String fromPhone;
    private String toFullName;
    private String toPhone;
    /** Tổng customer trả (gross). */
    private BigDecimal amount;
    /** Phí nền tảng admin thu (0 nếu không phải merchant payment có fee). */
    private BigDecimal fee;
    private BigDecimal displayAmount; // +amount (nhận) hoặc -amount (gửi)
    private String description;
    private String transactionType;
    private String status;
    private UUID merchantId;
    private LocalDateTime createdAt;
}
