package com.ldt.notification.controller;

import com.ldt.notification.dto.SendEmailRequest;
import com.ldt.notification.model.NotificationChannel;
import com.ldt.notification.model.NotificationStatus;
import com.ldt.notification.service.EmailService;
import com.ldt.notification.service.NotificationLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/notification")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final EmailService emailService;
    private final NotificationLogService notificationLogService;

    @Value("${internal.secret}")
    private String internalSecret;

    @PostMapping("/send-email")
    public ResponseEntity<Void> sendEmail(
            @RequestHeader("X-Internal-Secret") String secret,
            @Valid @RequestBody SendEmailRequest request) {
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(401).build();
        }
        boolean sent = emailService.sendEmail(request.getToEmail(), request.getToName(),
                request.getSubject(), request.getHtmlContent());
        notificationLogService.logInternal(
                NotificationChannel.EMAIL,
                request.getToEmail(),
                sent ? NotificationStatus.SENT : NotificationStatus.FAILED,
                sent ? null : "SendGrid failed"
        );
        return ResponseEntity.ok().build();
    }
}
