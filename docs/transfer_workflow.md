# Transfer Workflow – School Wallet

## Tổng quan

FE gửi **1 request duy nhất** đến API Gateway, hệ thống tự động xác thực PIN → kiểm tra số dư → chuyển tiền → lưu giao dịch.

---

## Luồng hoạt động chi tiết

```
FE (có JWT)
  │
  │  POST /api/v1/transactions
  │  Header: Authorization: Bearer <jwt>
  │  Body: { requestId, toPhoneNumber, amount, description, pin }
  │
  ▼
[API Gateway – AuthGlobalFilter]
  1. Xác thực JWT (chữ ký, hạn dùng)
  2. Gọi user-service GET /internal/users/validate?jti=...
     → Token bị blacklist? → 401 Unauthorized
     → OK: extract từ JWT:
         X-Internal-Secret: <secret>
         X-User-Id:         <uuid>
         X-User-Role:       USER
         X-User-Phone:      <phone người gửi>
  3. Forward request kèm 4 headers trên xuống transaction-service
  │
  ▼
[transaction-service – ApiSecurityFilter]
  4. Kiểm tra header X-Internal-Secret
     → Sai / thiếu → 401 Unauthorized (chặn gọi bypass gateway)
     → Đúng: lưu X-User-Id, X-User-Phone, X-User-Role vào TransactionContext
  │
  ▼
[TransactionController]
  5. Đọc X-User-Phone từ header → fromPhone
  6. Gọi TransactionService.transfer(request, fromPhone)
  │
  ▼
[TransactionService]

  ── Bước 1: Xác thực PIN ─────────────────────────────────────────
  7. POST user-service /internal/users/verify-pin
     Body: { phone: fromPhone, pin: request.pin }
     │
     ├── Tìm user theo phone
     ├── Kiểm tra pinLockedUntil: còn khóa?
     │     → throw "Tạm khóa X phút"
     ├── BCrypt.matches(rawPin, transactionPinHash)?
     │     → Sai: tăng pinFailedAttempts
     │           >= 5 lần → pinLockedUntil = now+15p → throw "Khóa 15 phút"
     │           <  5 lần → throw "Sai PIN. Còn X lần thử"
     │     → Đúng: reset pinFailedAttempts = 0, pinLockedUntil = null
     └── 200 OK → tiếp tục

  ── Bước 2: Idempotency ──────────────────────────────────────────
  8. Kiểm tra requestId đã tồn tại trong DB chưa
     → Có → throw "Giao dịch đang được xử lí"
     → Chưa → tiếp tục

  ── Bước 3: Lấy thông tin người dùng ────────────────────────────
  9.  GET user-service /internal/users/{fromPhone}
      → fromUserId, fromFullName, fromPhone
  10. GET user-service /internal/users/{toPhoneNumber}
      → toUserId, toFullName, toPhone
      → toUser.status == LOCKED → throw "Ví bị khóa"

  ── Bước 4: Tạo giao dịch PENDING ───────────────────────────────
  11. Lưu Transaction vào DB:
      { requestId, fromUserId, fromPhone, fromFullName,
        toUserId, toPhone, toFullName,
        amount, description, type=TRANSFER, status=PENDING }

  ── Bước 5: Chuyển tiền qua wallet-service ───────────────────────
  12. POST wallet-service /internal/wallets/transfer
      Body: { fromUserId, toUserId, amount }
      → Số dư không đủ → Exception
          transaction.status = FAILED → lưu DB → trả về FAILED
      → Đủ: trừ ví gửi, cộng ví nhận → transaction.status = SUCCESS

  ── Bước 6: Trả về kết quả ───────────────────────────────────────
  13. Return TransactionResponse { transactionId, status, amount, ... }
```

---

## Request FE gửi lên

```json
POST /api/v1/transactions
Authorization: Bearer <jwt_token>

{
  "requestId":     "uuid-unique-mỗi-lần-nhấn",
  "toPhoneNumber": "0987654321",
  "amount":        100000,
  "description":   "Chuyển tiền học phí",
  "pin":           "123456"
}
```
> `fromPhoneNumber` **không cần gửi** – backend lấy từ JWT qua `X-User-Phone`.

---

## Bảng lỗi

| Trường hợp | Message |
|---|---|
| Token hết hạn / blacklist | 401 Unauthorized |
| Gọi thẳng bypass gateway | 401 Unauthorized |
| Sai PIN | "Mã PIN không đúng. Còn X lần thử" |
| Sai PIN >= 5 lần | "Tạm khóa 15 phút" |
| requestId trùng | "Giao dịch đang được xử lí" |
| Tài khoản nhận bị khóa | "Ví bị khóa" |
| Số dư không đủ | (từ wallet-service) |

---

## Các service tham gia

| Service | Vai trò |
|---------|---------|
| `api-gateway` | Xác thực JWT, kiểm tra blacklist, inject headers |
| `user-service` | Verify PIN, trả về thông tin user |
| `transaction-service` | Orchestrator: điều phối luồng, lưu giao dịch |
| `wallet-service` | Trừ/cộng số dư ví |
