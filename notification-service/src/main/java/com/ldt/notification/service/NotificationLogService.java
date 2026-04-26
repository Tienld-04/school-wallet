package com.ldt.notification.service;

import com.ldt.notification.event.TransactionNotificationEvent;
import com.ldt.notification.model.*;
import com.ldt.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationLogService {

    private final NotificationLogRepository notificationLogRepository;

    public void logTransaction(NotificationChannel channel,
                               String recipient,
                               UUID userId,
                               TransactionNotificationEvent event,
                               NotificationDirection direction,
                               NotificationStatus status,
                               String errorMessage) {
        try {
            notificationLogRepository.save(NotificationLog.builder()
                    .channel(channel)
                    .recipient(recipient)
                    .userId(userId)
                    .transactionId(event.getTransactionId())
                    .transactionType(event.getTransactionType())
                    .amount(event.getAmount())
                    .direction(direction)
                    .source(NotificationSource.TRANSACTION)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build());
        } catch (Exception e) {
            log.error("Failed to save notification log: {}", e.getMessage());
        }
    }

    public void logInternal(NotificationChannel channel,
                            String recipient,
                            NotificationStatus status,
                            String errorMessage) {
        try {
            notificationLogRepository.save(NotificationLog.builder()
                    .channel(channel)
                    .recipient(recipient)
                    .source(NotificationSource.INTERNAL)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build());
        } catch (Exception e) {
            log.error("Failed to save notification log: {}", e.getMessage());
        }
    }
}
