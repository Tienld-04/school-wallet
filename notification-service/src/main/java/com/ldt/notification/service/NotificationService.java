package com.ldt.notification.service;

import com.ldt.notification.event.TransactionNotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@Slf4j
public class NotificationService {

    public void notifySender(TransactionNotificationEvent event) {
        String message = String.format(
                "Bạn đã chuyển %s VND cho %s (%s). Nội dung: %s. Mã GD: %s",
                formatAmount(event),
                event.getToFullName(),
                event.getToPhone(),
                event.getDescription(),
                event.getTransactionId()
        );
        log.info("[NOTIFICATION - SENDER] To: {} | {}", event.getFromPhone(), message);
        // TODO: Tích hợp gửi thông báo thực tế (push notification, email, SMS...)
    }

    public void notifyReceiver(TransactionNotificationEvent event) {
        String message = String.format(
                "Bạn nhận được %s VND từ %s (%s). Nội dung: %s. Mã GD: %s",
                formatAmount(event),
                event.getFromFullName(),
                event.getFromPhone(),
                event.getDescription(),
                event.getTransactionId()
        );
        log.info("[NOTIFICATION - RECEIVER] To: {} | {}", event.getToPhone(), message);
        // TODO: Tích hợp gửi thông báo thực tế (push notification, email, SMS...)
    }

    private String formatAmount(TransactionNotificationEvent event) {
        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        return formatter.format(event.getAmount());
    }
}
