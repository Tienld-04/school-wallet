package com.ldt.notification.service;

import com.ldt.notification.event.TransactionNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final EmailService emailService;

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

        if (event.getFromEmail() != null) {
            String subject = "School Wallet - Giao dịch chuyển tiền thành công";
            String html = buildTransactionEmailHtml(
                    event.getFromFullName(),
                    "Chuyển tiền",
                    "-" + formatAmount(event) + " VND",
                    event.getToFullName(),
                    event.getToPhone(),
                    event.getDescription(),
                    event.getTransactionId().toString(),
                    event.getStatus(),
                    "#e74c3c"
            );
            emailService.sendEmail(event.getFromEmail(), event.getFromFullName(), subject, html);
        }
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

        if (event.getToEmail() != null) {
            String subject = "School Wallet - Bạn nhận được tiền";
            String html = buildTransactionEmailHtml(
                    event.getToFullName(),
                    "Nhận tiền",
                    "+" + formatAmount(event) + " VND",
                    event.getFromFullName(),
                    event.getFromPhone(),
                    event.getDescription(),
                    event.getTransactionId().toString(),
                    event.getStatus(),
                    "#27ae60"
            );
            emailService.sendEmail(event.getToEmail(), event.getToFullName(), subject, html);
        }
    }

    private String formatAmount(TransactionNotificationEvent event) {
        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        return formatter.format(event.getAmount());
    }

    private String buildTransactionEmailHtml(
            String recipientName,
            String transactionType,
            String amount,
            String counterpartyName,
            String counterpartyPhone,
            String description,
            String transactionId,
            String status,
            String amountColor
    ) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:20px;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                        <tr>
                          <td style="background:#2c3e50;padding:24px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:24px;">School Wallet</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px;">
                            <p style="font-size:16px;color:#333;">Xin chào <strong>%s</strong>,</p>
                            <p style="font-size:15px;color:#555;">Giao dịch của bạn đã được xử lý:</p>
                            <table width="100%%" cellpadding="10" cellspacing="0" style="background:#f9f9f9;border-radius:6px;margin:16px 0;">
                              <tr>
                                <td style="color:#888;font-size:14px;">Loại giao dịch</td>
                                <td style="font-size:14px;text-align:right;font-weight:bold;">%s</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Số tiền</td>
                                <td style="font-size:18px;text-align:right;font-weight:bold;color:%s;">%s</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Đối tác</td>
                                <td style="font-size:14px;text-align:right;">%s (%s)</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Nội dung</td>
                                <td style="font-size:14px;text-align:right;">%s</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Mã giao dịch</td>
                                <td style="font-size:12px;text-align:right;color:#888;">%s</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Trạng thái</td>
                                <td style="font-size:14px;text-align:right;font-weight:bold;color:#27ae60;">%s</td>
                              </tr>
                              <tr>
                                <td style="color:#888;font-size:14px;">Thời gian</td>
                                <td style="font-size:14px;text-align:right;">%s</td>
                              </tr>
                            </table>
                            <p style="font-size:13px;color:#999;">Nếu bạn không thực hiện giao dịch này, vui lòng liên hệ hỗ trợ ngay.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f4f4f4;padding:16px;text-align:center;">
                            <p style="font-size:12px;color:#aaa;margin:0;">© 2025 School Wallet. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                recipientName,
                transactionType,
                amountColor, amount,
                counterpartyName, counterpartyPhone,
                description,
                transactionId,
                status,
                time
        );
    }
}
