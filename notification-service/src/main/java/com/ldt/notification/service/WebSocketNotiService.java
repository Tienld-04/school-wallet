package com.ldt.notification.service;

import com.ldt.notification.event.TransactionNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotiService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Push thông báo real-time đến người gửi và người nhận
     */
    public void pushTransactionNotification(TransactionNotificationEvent event) {
        // client subscribe /topic/transactions/{fromUserId}
        String fromUserId = event.getFromUserId().toString();
        messagingTemplate.convertAndSend(
                "/topic/transactions/" + fromUserId,
                event
        );
        log.info("[WS] Pushed notification to sender: {}", fromUserId);
        // client subscribe /topic/transactions/{toUserId}
        String toUserId = event.getToUserId().toString();
        messagingTemplate.convertAndSend(
                "/topic/transactions/" + toUserId,
                event
        );
        log.info("[WS] Pushed notification to receiver: {}", toUserId);
    }
}
