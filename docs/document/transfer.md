# Chuyển tiền P2P

**FE:** [font-end/src/pages/Transfer.tsx](../font-end/src/pages/Transfer.tsx)
+ [font-end/src/components/qr/QrTransferScreen.tsx](../font-end/src/components/qr/QrTransferScreen.tsx)
**BE:** user-service (search recipient + verify QR + verify PIN) + transaction-service (orchestration) + wallet-service (số dư) + notification-service (event)

## Tóm tắt

User chuyển tiền cho user khác trong hệ thống (P2P, không có phí). FE có 3 cách bắt đầu:

1. **Nhập số điện thoại trực tiếp** → search user → nhập amount + description → nhập PIN → submit.
2. **Quét QR Static** (chỉ có phone+name) → giống flow 1 từ bước nhập amount.
3. **Quét QR Dynamic** (đã có sẵn amount + description + expiredAt) → bỏ qua step amount, chuyển thẳng vào step PIN.

State machine FE: `step ∈ { method, phone, details, pin }`.

## Sequence cho luồng nhập số điện thoại trực tiếp

```
FE                          Gateway      user-service       transaction-service       wallet-service       notification-service
 │                              │                                                                                │
 │ 1. GET /wallets/my-balance (preload số dư khi vào trang)                                                      │
 │ ────────────────────────────────────────────►──────────────────► (cache để check trước khi gửi)              │
 │                                                                                                                │
 │ 2. user nhập phone, click "Tìm tài khoản"                                                                     │
 │ GET /users/by-phone/{phone}                                                                                   │
 │ ────────────────────────────►───────────────► getRecipientByPhone                                             │
 │                                              (phone, fullName) [check LOCKED]                                 │
 │ ◄ {fullName, phone} ──────────────────────── │                                                                │
 │                                                                                                                │
 │ 3. user nhập amount + description → confirm → modal PIN                                                       │
 │                                                                                                                │
 │ 4. POST /transactions/transfer                                                                                │
 │   body {requestId, toPhoneNumber, amount, description, pin}                                                   │
 │ ────────────────────────────────────────────────────────────► TransactionService2.transfer                   │
 │                                                                  (chi tiết engine bên dưới)                  │
 │                                                                                                                │
 │ ◄ {transactionId,...,status:SUCCESS} ──────────────────────── │                                                │
 │ FE: toast "Chuyển tiền thành công" + reset form                                                                │
```

## API gọi

| # | Path | Khi nào | Mã FE |
|---|---|---|---|
| 1 | `GET /api/v1/wallets/my-balance` | Khi mount trang (preload) | `walletApi.getMyBalance()` |
| 2a | `GET /api/v1/users/by-phone/{phone}` | Search recipient (luồng nhập số) | `userApi.getRecipientByPhone(phone)` |
| 2b | `POST /api/v1/users/qr/verify` | Quét QR (Static hoặc Dynamic) | `userApi.verifyQr(content)` |
| 3 | `POST /api/v1/transactions/transfer` | Submit cuối cùng | `transactionApi.transfer({requestId, toPhoneNumber, amount, description, pin})` |

`requestId = crypto.randomUUID()` (UUID v4 string) — dùng cho idempotency.

## Validation FE

- Phone: 10 chữ số.
- Amount ≥ 1000 VND, không vượt quá `balance` đã preload.
- PIN: 6 chữ số (auto focus next ô khi nhập).

## Logic BE (transaction-service)

`TransactionService2.transfer(req, fromPhone, TransactionType.TRANSFER)`:

1. Reject nếu `fromPhone == toPhone` → `SELF_TRANSFER`.
2. Build `TransactionContext` với `applyPlatformFee=false`.
3. Gọi `executeTransaction(ctx)` — engine 7 pha:

### Engine `executeTransaction(ctx)`

#### Pha 1 — Idempotency

```java
Optional<Transaction> existing = transactionRepository.findByRequestId(requestId);
if (existing.isPresent()) {
    if (status == SUCCESS || status == FAILED) return mapper.toResponse(existing);
    throw DUPLICATE_TRANSACTION;  // PENDING → có request đang chạy
}
```

#### Pha 2 — Verify PIN

`POST <user-service>/internal/users/verify-pin` body `{phone, pin}`.

`InternalUserService.verifyPinByPhone`:
- Check `user.pinLockedUntil` — đang khoá → `PIN_LOCKED`.
- BCrypt `matches(rawPin, transactionPinHash)`:
  - Sai: `pinFailedAttempts += 1`, ≥5 → `pinLockedUntil = now + 15 phút`. Throw `INVALID_PIN`.
  - Đúng: reset `pinFailedAttempts = 0, pinLockedUntil = null`.

#### Pha 3 — Batch fetch user

`POST <user-service>/internal/users/batch` body `[fromPhone, toPhone]`. Trả `List<UserInternalResponse>` chứa `userId, status, fullName, phone, email`.

Reject nếu fromUser hoặc toUser `LOCKED`.

#### Pha 4 — Tính fee

Vì là transfer P2P, `applyPlatformFee = false`:
```java
fee = ZERO; txAmount = amount;
```

#### Pha 5 — Save Transaction PENDING

```java
Transaction tx = new Transaction();
tx.setRequestId(...);
tx.setFromUserId(fromUser.userId);
tx.setFromPhone, fromFullName  (snapshot)
tx.setToUserId, toPhone, toFullName  (snapshot)
tx.setAmount(txAmount); tx.setFee(0);
tx.setTransactionType(TRANSFER);
tx.setStatus(PENDING);
transactionRepository.saveAndFlush(tx);
statusHistoryService.record(tx.id, null, PENDING, "Giao dịch được khởi tạo");
```

`saveAndFlush` để bắt `DataIntegrityViolationException` (unique `request_id`) ngay tại flush — race condition 2 request cùng requestId. Bị bắt → trả Optional.empty → handleRaceCondition.

#### Pha 6 — Gọi wallet-service

`POST <wallet-service>/internal/wallets/transfer`:
```json
{
  "fromUserId": "...",
  "toUserId": "...",
  "amount": 100000,
  "transactionId": "<tx.id>",
  "reason": "TRANSFER_OUT",
  "note": "<description>"
}
```

`WalletService.transfer`:
1. Idempotency check: nếu transactionId đã có ledger → return ok.
2. Lock 2 ví theo thứ tự `UUID.compareTo` ascending (tránh deadlock).
3. Reject nếu wallet LOCKED.
4. Reset `dailySpent`/`monthlySpent` nếu sang ngày/tháng mới (so với `lastDailyReset`/`lastMonthlyReset`).
5. Check hạn mức:
   - `dailySpent + amount > dailyLimit (5,000,000)` → `DAILY_LIMIT_EXCEEDED`.
   - `monthlySpent + amount > monthlyLimit (30,000,000)` → `MONTHLY_LIMIT_EXCEEDED`.
6. Check `balance >= amount` → `INSUFFICIENT_BALANCE`.
7. Update: `fromWallet.balance -= amount`, `toWallet.balance += amount`, `fromWallet.dailySpent += amount, monthlySpent += amount`. Save 2 wallet.
8. Ghi 2 ledger entries cùng `transactionId`:
   - `fromWallet`: DEBIT, reason=TRANSFER_OUT.
   - `toWallet`: CREDIT, reason=TRANSFER_IN (`resolveCounterpartReason`).
9. Return ok.

Wrap kết quả trong `WalletCallResult.ok()/fail(msg)` để pha 7 còn finalize.

#### Pha 7 — Finalize Transaction

```java
status = walletResult.success() ? SUCCESS : FAILED;
tx.setStatus(status); save();
statusHistoryService.record(tx.id, PENDING, status, reason);

if (success) {
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override public void afterCommit() {
            notificationProducer.sendNotification(event);  // ActiveMQ topic
        }
    });
}

if (!success) throw TRANSFER_FAILED(walletResult.errorMessage);
return mapper.toResponse(tx);
```

Khi commit DB transaction → publish `TransactionNotificationEvent` (JSON) lên topic `transaction-notification` ActiveMQ.

## Notification side-effect

`TransactionEventConsumer` (notification-service) listen topic `transaction-notification`:
1. `notifySender(event)` — email "Bạn đã chuyển X VND cho Y" (-, đỏ).
2. `notifyReceiver(event)` — email "Bạn nhận được X VND từ Y" (+, xanh).
3. `NotificationService.save(event, fromUserId, DEBIT)` — tạo record inbox cho người gửi.
4. `NotificationService.save(event, toUserId, CREDIT)` — tạo record inbox cho người nhận.
5. `webSocketNotiService.pushUnreadCount(fromUserId)` và `(toUserId)` — push `{unreadCount: N}` qua STOMP `/topic/notifications/{userId}`.

Xem chi tiết [notification.md](notification.md).

## Side-effects DB

| DB | Bảng | Thay đổi |
|---|---|---|
| user-service | `users` | Reset `pinFailedAttempts`, `pinLockedUntil` của sender (sau verify PIN thành công) |
| transaction-service | `transactions` | INSERT tx mới |
| transaction-service | `transaction_status_history` | INSERT 2 row (`null→PENDING`, `PENDING→SUCCESS/FAILED`) |
| wallet-service | `wallets` | UPDATE 2 row (số dư, dailySpent, monthlySpent của sender) |
| wallet-service | `wallet_ledger` | INSERT 2 row (DEBIT + CREDIT) |
| notification-service | `notification` | INSERT 2 row (DEBIT cho sender, CREDIT cho receiver) |
| notification-service | `notification_log` | INSERT 2 row (EMAIL gửi cho cả 2 phía) |

## Lỗi thường gặp

| Lỗi | Pha | Nguyên nhân |
|---|---|---|
| `SELF_TRANSFER` | 0 | fromPhone == toPhone |
| `DUPLICATE_TRANSACTION` | 1 | requestId đã có tx PENDING |
| `PIN_VERIFICATION_FAILED`, `INVALID_PIN`, `PIN_LOCKED` | 2 | PIN sai hoặc bị khoá |
| `SENDER_LOCKED` / `RECIPIENT_LOCKED` | 3 | Tài khoản bị admin khoá |
| `INSUFFICIENT_BALANCE` | 6 | Số dư không đủ |
| `DAILY_LIMIT_EXCEEDED` / `MONTHLY_LIMIT_EXCEEDED` | 6 | Vượt hạn mức 5M/ngày hoặc 30M/tháng |
| `WALLET_LOCKED` | 6 | Ví đang bị khoá |
| `TRANSFER_FAILED` | 6/7 | Generic wrap, message là body từ wallet-service |
