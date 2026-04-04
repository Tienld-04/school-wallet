package com.ldt.notification.controller;

import com.ldt.notification.dto.SendEmailRequest;
import com.ldt.notification.service.EmailService;
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

    @Value("${internal.secret}")
    private String internalSecret;

    @PostMapping("/send-email")
    public ResponseEntity<Void> sendEmail(
            @RequestHeader("X-Internal-Secret") String secret,
            @Valid @RequestBody SendEmailRequest request) {
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(401).build();
        }
        emailService.sendEmail(request.getToEmail(), request.getToName(),
                request.getSubject(), request.getHtmlContent());
        return ResponseEntity.ok().build();
    }
}
