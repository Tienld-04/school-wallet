# Notification (Inbox + WebSocket Real-time)

**FE:**
- API client: [font-end/src/api/](../font-end/src/api/) — chưa có module riêng cho notification (FE hiện chưa render UI inbox; chỉ dùng badge unread-count).
- Note: trong codebase FE hiện tại, các endpoint `/notifications/**` đã sẵn ở BE nhưng FE chưa tích hợp UI hoàn chỉnh — phần dưới mô tả những gì BE cung cấp.

**BE chính:** notification-service (consumer + REST + WebSocket)

## Tóm tắt

Notification có 3 lớp:

1. **Inbox (DB record)** — bảng `notification` lưu mỗi giao dịch thành 2 record (1 cho người gửi DEBIT, 1 cho người nhận CREDIT).
2. **Email** — qua SendGrid, log vào `notification_log`.
3. **WebSocket push** — STOMP `/topic/notifications/{userId}` đẩy `{unreadCount}` real-time.

Trigger duy nhất: ActiveMQ topic `transaction-notification` được transaction-service publish khi 1 giao dịch transfer/payment SUCCESS commit DB.

> **Lưu ý:** topup VNPay hiện KHÔNG publish event (xem `// TODO` trong `TopupService.handleIpn`). User nạp tiền không nhận email/inbox.

## Sequence — Transaction → Notification

```
transaction-service                ActiveMQ              notification-service                  Client
 │                                       │                       │                                 │
 │ tx commit DB OK                       │                       │                                 │
 │ TransactionSynchronization.afterCommit│                       │                                 │
 │ JmsTemplate.convertAndSend(           │                       │                                 │
 │   "transaction-notification",         │                       │                                 │
 │   JSON(TransactionNotificationEvent)) │                       │                                 │
 │ ────────────────────────────────────► │                       │                                 │
 │                                       │ topic publish         │                                 │
 │                                       │──────────────────────►│ TransactionEventConsumer       │
 │                                       │                       │   onTransactionEvent             │
 │                                       │                       │   1. notifySender → SendGrid    │
 │                                       │                       │   2. notifyReceiver → SendGrid  │
 │                                       │                       │   3. save inbox DEBIT (sender)  │
 │                                       │                       │   4. save inbox CREDIT (recv)   │
 │                                       │                       │   5. webSocket.pushUnreadCount(sender)
 │                                       │                       │   6. webSocket.pushUnreadCount(receiver)
 │                                       │                       │      ──────────────────────────►│ /topic/notifications/{userId}
 │                                       │                       │                                 │ payload {unreadCount: N}
 │                                       │                       │                                 │
 │                                       │                       │                                 │ Client refresh badge
```

## API Inbox

| Path | Mô tả |
|---|---|
| `GET /api/v1/notifications?page=&size=` | Lấy inbox phân trang. **Side-effect:** auto mark all as read khi gọi |
| `GET /api/v1/notifications/unread-count` | `{unreadCount: number}` cho badge |

### `NotificationService.getInbox(page, size)`

```java
UUID userId = UUID.fromString(UserContext.getUserId());
Page<NotificationResponse> result = notificationRepository
    .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
    .map(this::toResponse);
notificationRepository.markAllAsRead(userId);  // side-effect: set is_read=true cho TẤT CẢ
return result;
```

**Hệ quả:** Mỗi lần user mở chuông xem inbox → toàn bộ notification chưa đọc lập tức được mark read. Lần fetch tiếp theo `unreadCount = 0`. Đây là design "open inbox = read all", không có UI mark từng cái.

### `NotificationService.getUnreadCount()`

```java
return notificationRepository.countByUserIdAndIsReadFalse(userId);
```

Polling đơn giản hoặc dùng WebSocket push để khỏi poll.

## Logic — Consumer ActiveMQ

`TransactionEventConsumer.onTransactionEvent(message)`:

```java
@JmsListener(destination = "transaction-notification",
             subscription = "notification-sub",
             containerFactory = "jmsListenerContainerFactory")
public void onTransactionEvent(String message) {
    TransactionNotificationEvent event = objectMapper.readValue(message, ...);
    notificationTransactionService.notifySender(event);
    notificationTransactionService.notifyReceiver(event);
    notificationService.save(event, event.fromUserId, DEBIT);
    notificationService.save(event, event.toUserId, CREDIT);
    webSocketNotiService.pushUnreadCount(event.fromUserId);
    webSocketNotiService.pushUnreadCount(event.toUserId);
}
```

Topic config: `pub-sub-domain=true` (Topic, không phải Queue) — mỗi consumer-subscription nhận 1 lần.

## Email — `NotificationTransactionService`

### `notifySender(event)`

- Subject:
  - `PAYMENT` → "School Wallet - Thanh toán thành công"
  - khác → "School Wallet - Chuyển tiền thành công"
- Build HTML với amount màu đỏ "-X,XXX VND".
- `EmailService.sendEmail(fromEmail, fromFullName, subject, html)` → SendGrid.
- `notificationLogService.logTransaction(EMAIL, fromEmail, fromUserId, event, DEBIT, status, errorMessage)`.

### `notifyReceiver(event)`

- Subject:
  - `PAYMENT` → "School Wallet - Bạn nhận được thanh toán"
  - khác → "School Wallet - Bạn nhận được tiền"
- Amount màu xanh "+X,XXX VND".
- Tương tự log notification_log.

HTML template (xem `buildTransactionEmailHtml` trong `NotificationTransactionService.java`):
- Header xanh đậm + tiêu đề "School Wallet".
- Bảng thông tin: loại, số tiền, đối tác, nội dung, mã GD, trạng thái, thời gian.
- Footer hỗ trợ `0936733881`.

## Inbox save — `NotificationService.save`

```java
public void save(TransactionNotificationEvent event, UUID userId, NotificationDirection direction) {
    boolean isDebit = direction == DEBIT;
    notificationRepository.save(Notification.builder()
        .userId(userId)
        .title(buildTitle(event.transactionType, direction))
        .type(NotificationType.TRANSACTION)
        .transactionId(event.transactionId)
        .transactionType(event.transactionType)
        .amount(event.amount)
        .direction(direction)
        .counterpartyName(isDebit ? event.toFullName : event.fromFullName)
        .counterpartyPhone(isDebit ? event.toPhone : event.fromPhone)
        .transactionStatus(event.status)
        .description(event.description)
        .build());
}
```

`buildTitle(transactionType, direction)`:
- TRANSFER + DEBIT → "Chuyển tiền thành công"
- TRANSFER + CREDIT → "Bạn nhận được tiền"
- TOPUP → "Nạp tiền thành công"
- PAYMENT + DEBIT → "Thanh toán thành công"
- PAYMENT + CREDIT → "Bạn nhận được thanh toán"

## WebSocket push — `WebSocketNotiService.pushUnreadCount(userId)`

```java
public void pushUnreadCount(UUID userId) {
    long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
    messagingTemplate.convertAndSend(
        "/topic/notifications/" + userId,
        Map.of("unreadCount", unreadCount)
    );
}
```

### Client subscribe

- Endpoint STOMP qua gateway: `wss://<gateway>/ws` (route `/ws/**` được forward sang notification-service `/ws`, có SockJS fallback).
- `WebSocketConfig`:
  - Simple broker `/topic`.
  - Endpoint `/ws` allowedOrigins `*`, `withSockJS()`.
- Topic theo từng user: `/topic/notifications/{userId}`.
- Payload: `{ "unreadCount": <number> }`.

Client (chưa có code FE chính thức) dùng `@stomp/stompjs` hoặc `sockjs-client`:
```ts
const sock = new SockJS(`${baseURL}/ws`);
const client = Stomp.over(sock);
client.connect({}, () => {
  client.subscribe(`/topic/notifications/${userId}`, (msg) => {
    const { unreadCount } = JSON.parse(msg.body);
    setBadge(unreadCount);
  });
});
```

## Internal email API (luồng forgot password)

`POST /internal/notification/send-email` (header `X-Internal-Secret`):
- User-service gọi cho luồng [forgot-password.md](forgot-password.md).
- `EmailService.sendEmail` → SendGrid → log `notification_log` (channel=EMAIL, source=INTERNAL).

## OTP API

Xem [register.md](register.md) — `/api/otp/send` và `/api/otp/verify` cũng do notification-service phục vụ.

## Side-effects mỗi giao dịch

Mỗi 1 giao dịch SUCCESS sinh:
- 2 record trong `notification` (DEBIT cho sender, CREDIT cho receiver).
- 2 record trong `notification_log` (EMAIL gửi cho sender + receiver).
- 2 lần WebSocket push.
- 2 email SendGrid quota.

## Lỗi thường gặp

- SendGrid fail → log `notification_log.status=FAILED, error_message=...`. Inbox + WebSocket vẫn được tạo bình thường.
- Consumer process exception → log error, message bị skip (Topic, không có DLQ trong cấu hình hiện tại).
- WebSocket disconnect → client phải tự reconnect (SockJS xử lý heartbeat).

## Khả năng mở rộng

- Topic ActiveMQ có thể scale thêm consumer cho push notification mobile (FCM/APNS).
- Inbox có thể thêm `markAsRead(notificationId)` từng cái nếu UI có nút mark riêng.
- Hiện chưa có pagination cursor-based — chỉ offset-based.
