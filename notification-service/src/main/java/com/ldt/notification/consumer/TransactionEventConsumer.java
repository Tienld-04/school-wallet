package com.ldt.notification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ldt.notification.event.TransactionNotificationEvent;
import com.ldt.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionEventConsumer {
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @JmsListener(destination = "transaction-notification", subscription = "notification-sub", containerFactory = "jmsListenerContainerFactory")
    public void onTransactionEvent(String message) {
        try {
            TransactionNotificationEvent event = objectMapper.readValue(message, TransactionNotificationEvent.class);
            log.info("Received transaction event: {}", event.getTransactionId());

            notificationService.notifySender(event);
            notificationService.notifyReceiver(event);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize transaction event: {}", e.getMessage());
        }
    }
}
