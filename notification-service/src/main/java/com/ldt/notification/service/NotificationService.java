package com.ldt.notification.service;

import com.ldt.notification.constant.TransactionTypeConstants;
import com.ldt.notification.context.UserContext;
import com.ldt.notification.dto.NotificationResponse;
import com.ldt.notification.event.TransactionNotificationEvent;
import com.ldt.notification.config.i18n.Messages;
import com.ldt.notification.model.Notification;
import com.ldt.notification.model.NotificationDirection;
import com.ldt.notification.model.NotificationType;
import com.ldt.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Messages messages;

    public void save(TransactionNotificationEvent event, UUID userId, NotificationDirection direction) {
        try {
            boolean isDebit = direction == NotificationDirection.DEBIT;
            notificationRepository.save(Notification.builder()
                    .userId(userId)
                    .title(buildTitle(event.getTransactionType(), direction))
                    .type(NotificationType.TRANSACTION)
                    .transactionId(event.getTransactionId())
                    .transactionType(event.getTransactionType())
                    .amount(event.getAmount())
                    .direction(direction)
                    .counterpartyName(isDebit ? event.getToFullName() : event.getFromFullName())
                    .counterpartyPhone(isDebit ? event.getToPhone() : event.getFromPhone())
                    .transactionStatus(event.getStatus())
                    .description(event.getDescription())
                    .build());
        } catch (Exception e) {
            log.error("Failed to save notification inbox for userId={}: {}", userId, e.getMessage());
        }
    }
    
    private String buildTitle(String transactionType, NotificationDirection direction) {
        boolean isDebit = direction == NotificationDirection.DEBIT;
        return switch (transactionType) {
            case TransactionTypeConstants.TRANSFER -> messages.getVi(isDebit ? "notification.title.transfer.debit" : "notification.title.transfer.credit");
            case TransactionTypeConstants.TOPUP -> messages.getVi("notification.title.topup");
            case TransactionTypeConstants.PAYMENT -> messages.getVi(isDebit ? "notification.title.payment.debit" : "notification.title.payment.credit");
            default -> messages.getVi(isDebit ? "notification.title.default.debit" : "notification.title.default.credit");
        };
    }
    
    // Lấy inbox + tự động đánh dấu tất cả đã đọc khi user mở chuông thông báo
    @Transactional
    public Page<NotificationResponse> getInbox(int page, int size) {
        UUID userId = UUID.fromString(UserContext.getUserId());
        Page<NotificationResponse> result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toResponse);
        notificationRepository.markAllAsRead(userId);
        return result;
    }

    public long getUnreadCount() {
        UUID userId = UUID.fromString(UserContext.getUserId());
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .description(n.getDescription())
                .type(n.getType().name())
                .isRead(n.isRead())
                .transactionId(n.getTransactionId())
                .transactionType(n.getTransactionType())
                .amount(n.getAmount())
                .direction(n.getDirection() != null ? n.getDirection().name() : null)
                .counterpartyName(n.getCounterpartyName())
                .counterpartyPhone(n.getCounterpartyPhone())
                .createdAt(n.getCreatedAt())
                .build();
    }

}
