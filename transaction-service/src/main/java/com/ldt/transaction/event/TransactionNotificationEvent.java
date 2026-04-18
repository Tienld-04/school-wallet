package com.ldt.transaction.event;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionNotificationEvent implements Serializable {
    private UUID transactionId;
    private UUID fromUserId;
    private String fromFullName;
    private String fromPhone;
    private String fromEmail;
    private UUID toUserId;
    private String toFullName;
    private String toPhone;
    private String toEmail;
    private BigDecimal amount;
    private String description;
    private String transactionType;
    private String status;
}
