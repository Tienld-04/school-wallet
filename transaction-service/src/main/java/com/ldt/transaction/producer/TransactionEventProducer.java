package com.ldt.transaction.producer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ldt.transaction.event.TransactionNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionEventProducer {
    private final JmsTemplate jmsTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC = "transaction-notification";

    @Async
    public void sendNotification(TransactionNotificationEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            jmsTemplate.convertAndSend(TOPIC, message);
            log.info("Sent notification event for transaction: {}", event.getTransactionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification event: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Failed to send notification event: {}", e.getMessage());
        }
    }
}
