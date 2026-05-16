# Quên mật khẩu

**FE:** [font-end/src/pages/Auth/ForgotPassword.tsx](../font-end/src/pages/Auth/ForgotPassword.tsx)
**BE chính:** user-service (sinh password) + notification-service (gửi email qua SendGrid)

## Tóm tắt

User nhập email → BE sinh mật khẩu ngẫu nhiên 6 ký tự → gọi nội bộ notification-service gửi email HTML → set lại password (BCrypt). User nhận email, dùng password mới đăng nhập, nên đổi mật khẩu ngay.

## Sequence

```
FE                Gateway          user-service                     notification-service
 │                   │                   │                                    │
 │ POST /auth/forgot-password           │                                    │
 │ {email}           │                   │                                    │
 │──────────────────►│ permit-all        │                                    │
 │                   │──────────────────►│ AuthService.forgotPassword         │
 │                   │                   │  - findByEmail (404 → EMAIL_NOT_FOUND)
 │                   │                   │  - generate random 6-char password │
 │                   │                   │  - build HTML template             │
 │                   │                   │  - POST <notification>/internal/notification/send-email
 │                   │                   │     (X-Internal-Secret)            │
 │                   │                   │    ────────────────────────────────►│ EmailService.sendEmail
 │                   │                   │                                    │  - SendGrid API
 │                   │                   │                                    │  - log notification_log (channel=EMAIL, source=INTERNAL)
 │                   │                   │    ◄───────────────────────────────│
 │                   │                   │  - user.password = BCrypt(newPwd)  │
 │                   │                   │  - save                            │
 │ ◄ 200 OK ─────────┤◄──────────────────│                                    │
 │ FE hiển thị "Mật khẩu mới đã được gửi đến email"                          │
```

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `POST /api/v1/auth/forgot-password` | `{email}` | `authApi.forgotPassword(email)` |

Endpoint này nằm trong danh sách permit-all của gateway → không cần JWT.

## Validation FE

- Email regex chuẩn (`utils/validators.ts`).

## Logic BE — `AuthService.forgotPassword(ForgotPasswordRequest)`

1. `userRepository.findByEmail(email)` → `EMAIL_NOT_FOUND` nếu không có.
2. `generateRandomPassword(6)` — 6 ký tự từ tập `[A-Za-z0-9]` dùng `SecureRandom`.
3. `buildResetPasswordEmailHtml(fullName, newPassword)` — template HTML có:
   - Header màu `#2c3e50` "School Wallet".
   - Hiển thị mật khẩu mới rõ ràng (font 24px letter-spacing 4px).
   - Cảnh báo đỏ "Vui lòng đăng nhập và đổi mật khẩu ngay".
   - Footer hỗ trợ "0936733881".
4. `restTemplate.postForEntity(<notification>/internal/notification/send-email, body, Void.class)` với:
   ```json
   {
     "toEmail":"...", "toName":"...",
     "subject":"School Wallet - Mật khẩu mới",
     "htmlContent":"<!DOCTYPE html>..."
   }
   ```
   Header: `Content-Type: application/json`, `X-Internal-Secret: <secret>` (RestTemplate config).
   - Nếu lỗi → throw `SEND_EMAIL_FAILED` (không update password).
5. `user.setPassword(BCrypt.encode(newPassword)); save();`

## Logic BE — notification-service `sendEmail`

`InternalNotificationController.sendEmail`:
- Verify `X-Internal-Secret` (chống public abuse).
- `EmailService.sendEmail(toEmail, toName, subject, htmlContent)` → SendGrid API call.
- `notificationLogService.logInternal(channel=EMAIL, recipient=email, status=SENT/FAILED, errorMessage)`.

## Side-effects

- Bảng `users.password` được cập nhật (BCrypt hash của random password).
- Bảng `notification_log` (notification-service DB) thêm 1 record EMAIL.
- Email gửi qua SendGrid với password plain trong body (chỉ user mới đọc được).

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `EMAIL_NOT_FOUND` | Email chưa từng đăng ký |
| `SEND_EMAIL_FAILED` | SendGrid API fail (sai API key, quota, network) |

## Cảnh báo bảo mật

- Password mới được gửi plain qua email — phụ thuộc bảo mật của hộp thư người dùng.
- Random password 6 ký tự chỉ chống brute-force tạm thời. User nên đổi mật khẩu (dùng [change-password.md](change-password.md)) ngay sau khi đăng nhập lại.
- Không có rate-limit FE ngoài UX submit-once → có thể bị abuse spam reset (mỗi lần đều ghi đè password). Có thể bổ sung cooldown sau.
