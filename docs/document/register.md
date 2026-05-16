# Đăng ký tài khoản

**FE:** [font-end/src/pages/Auth/Register.tsx](../font-end/src/pages/Auth/Register.tsx)
**BE chính:** notification-service (OTP) + user-service (tạo user) + wallet-service (tạo ví)

## Tóm tắt

Quy trình đăng ký gồm **3 bước trên cùng 1 trang** (state-machine `STEPS = { PHONE, OTP, INFO }`):

1. Người dùng nhập số điện thoại → FE gọi `OTP send` → SMS OTP về máy.
2. Người dùng nhập OTP → FE gọi `OTP verify` → nhận `verificationToken` HMAC-SHA256.
3. Người dùng điền thông tin (họ tên, email, password, PIN) → FE gọi `register` kèm `verificationToken` → BE tạo `User` rồi gọi nội bộ wallet-service tạo ví số dư 0.

Sau khi register thành công, FE redirect về `/login` (không tự động đăng nhập).

## Sequence

```
FE                Gateway          notification-service          user-service          wallet-service
 │                   │                       │                         │                      │
 │ ① POST /otp/send  │                       │                         │                      │
 │──────────────────►│ permit-all → forward  │                         │                      │
 │                   │──────────────────────►│ Redis: otp:<phone> hash │                      │
 │                   │                       │ + cooldown 60s          │                      │
 │                   │                       │ → SpeedSMS API          │                      │
 │ ◄─────────────────┤◄──────────────────────│ 200 ok                  │                      │
 │                   │                       │                         │                      │
 │ ② POST /otp/verify                        │                         │                      │
 │──────────────────►│──────────────────────►│ Redis check + delete    │                      │
 │                   │                       │ → tạo verificationToken │                      │
 │                   │                       │   = Base64("phone|ts.<HMAC>")                  │
 │ ◄ verificationToken◄──────────────────────│                         │                      │
 │                   │                       │                         │                      │
 │ ③ POST /auth/register (kèm verificationToken)                       │                      │
 │──────────────────►│ permit-all → forward  │                         │                      │
 │                   │──────────────────────────────────────────────► verifyOTPToken         │
 │                   │                                                  (HMAC cùng INTERNAL_SECRET)
 │                   │                                                  Save User (BCrypt pwd + PIN)
 │                   │                                                  │ POST /internal/wallets
 │                   │                                                  ├─────────────────────►│
 │                   │                                                  │                      │ Wallet(balance=0)
 │                   │                                                  │ ◄────────────────────│
 │ ◄ 200 OK ─────────┤◄─────────────────────────────────────────────────│                      │
```

## API gọi

| # | Method + Path (FE → gateway) | Body | Mã FE | Service đích |
|---|---|---|---|---|
| 1 | `POST /api/v1/otp/send` | `{phone}` | `otpApi.send(phone)` | notification-service `/api/otp/send` |
| 2 | `POST /api/v1/otp/verify` | `{phone, otp}` | `otpApi.verify(phone, otp)` | notification-service `/api/otp/verify` |
| 3 | `POST /api/v1/auth/register` | `{fullName, phone, email, password, transactionPin, verificationToken}` | `authApi.register(...)` | user-service `/api/auth/register` |

## Validation FE

- Phone: `^\d{10}$` (10 chữ số).
- OTP: `^\d{6}$` (6 chữ số).
- Email: regex chuẩn.
- Password: ≥ 6 ký tự.
- PIN giao dịch: `^\d{6}$`.
- Confirm password phải khớp `password`.

## Logic BE chi tiết

### Bước 1 — `OtpService.sendOtp(phone)`

- Check Redis key `otp:cooldown:<phone>` — nếu còn → throw `OTP_RESEND_TOO_SOON`.
- Sinh OTP 6 chữ số (`SecureRandom`), BCrypt-hash, lưu Redis `otp:<phone>` TTL **5 phút** (`otp.expiration-minutes`).
- Set cooldown `otp:cooldown:<phone>` = 60 giây (`otp.resend-cooldown-seconds`).
- Gọi `SpeedSmsService.sendSms` (eSMS API `https://api.speedsms.vn/index.php/sms/send`, Basic auth, `sms_type=5`). Ghi `notification_log` (channel=SMS).

FE có UI countdown 60 giây + nút "Gửi lại".

### Bước 2 — `OtpService.verifyOtp(phone, otp)`

- Đọc `otp:attempts:<phone>` — nếu ≥ 5 lần (`otp.max-attempts`) → throw `OTP_MAX_ATTEMPTS`.
- Đọc `otp:<phone>` (hash) — nếu null → `OTP_EXPIRED`.
- BCrypt `matches(otp, hash)` — fail → tăng attempts, throw `OTP_INVALID, "...còn N lần thử"`.
- Đúng → xoá 3 keys (`otp`, `attempts`, `cooldown`) → `createVerificationToken(phone)`:
  ```
  data = phone + "|" + currentTimeMillis
  sig  = HMAC_SHA256(internalSecret, data)
  token = Base64(data + "." + sig)
  ```
- TTL token = 10 phút (`otp.token-expiration-minutes` — token tự verify timestamp ở user-service, không lưu ở đâu).

### Bước 3 — `UserService.createUser(req)`

`POST /api/auth/register` (gateway permit-all):

1. **Verify OTP token** — `VerifyOTPTokenService.verifyOTPToken(token, phone)`:
   - Decode Base64 → split "data.sig".
   - Tách `phone, ts` từ data, verify HMAC.
   - So sánh `phone` request với `phone` trong token.
   - Check timestamp ≤ 10 phút.
2. **Check trùng** — `userRepository.existsByPhone` / `existsByEmail`. Trùng → `PHONE_ALREADY_EXISTS` / `EMAIL_ALREADY_EXISTS`.
3. **Tạo User**:
   - `password = BCrypt.encode(rawPassword)`.
   - `transactionPinHash = BCrypt.encode(rawPin)`.
   - `role=USER, status=ACTIVE, kycStatus=UNVERIFIED, failedLoginCount=0, pinFailedAttempts=0`.
4. **Tạo ví** — RestTemplate `POST <wallet-service>/internal/wallets` body `{userId}` (kèm header `X-Internal-Secret`):
   - `WalletService.createWallet(req)` lưu `Wallet(balance=0, status=ACTIVE, walletType=USER_WALLET, dailyLimit=5_000_000, monthlyLimit=30_000_000, currency=VND)`.

> **Cảnh báo nhất quán:** bước 3 và 4 không nằm trong distributed transaction. Nếu wallet-service unreachable, user đã được lưu nhưng chưa có ví → throw `REGISTRATION_FAILED`. Cần xử lý lại bằng saga / retry hoặc cron repair sau.

## Side-effects

- Bảng `users` (user-service DB) thêm 1 record.
- Bảng `wallets` (wallet-service DB) thêm 1 record.
- Bảng `notification_log` (notification-service DB) thêm 1 record SMS.
- Redis có key `otp:cooldown:<phone>` tồn tại 60s sau bước 1.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `OTP_RESEND_TOO_SOON` | Bấm gửi lại OTP trong cooldown 60s |
| `OTP_EXPIRED` | OTP đã quá 5 phút |
| `OTP_INVALID` | Sai OTP, message đính kèm số lần còn lại |
| `OTP_MAX_ATTEMPTS` | Sai 5 lần liên tiếp |
| `PHONE_ALREADY_EXISTS` / `EMAIL_ALREADY_EXISTS` | Trùng |
| `REGISTRATION_FAILED` | Lỗi tạo user/ví, BE log chi tiết |
| Token verify fail | `verificationToken` quá 10 phút hoặc bị sửa |
