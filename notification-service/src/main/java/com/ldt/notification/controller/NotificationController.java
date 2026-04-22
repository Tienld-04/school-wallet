package com.ldt.notification.controller;

import com.ldt.notification.dto.NotificationResponse;
import com.ldt.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Lấy danh sách thông báo của user hiện tại, sắp xếp mới nhất lên đầu, phân trang
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getInbox(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificationService.getInbox(page, size));
    }

    // Đếm số thông báo chưa đọc — dùng để hiển thị badge số đỏ trên chuông thông báo
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount()));
    }

}
