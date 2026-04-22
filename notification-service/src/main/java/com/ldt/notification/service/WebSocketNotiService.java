package com.ldt.notification.service;

import com.ldt.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotiService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    // Đẩy số thông báo chưa đọc lên chuông của user
    // Client subscribe: /topic/notifications/{userId}
    // Payload: { "unreadCount": N }
    public void pushUnreadCount(UUID userId) {
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userId,
                Map.of("unreadCount", unreadCount)
        );
        log.info("[WS] Pushed unreadCount={} to userId={}", unreadCount, userId);
    }
}
