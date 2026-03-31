# Luồng đăng ký tài khoản (OTP Verification)

## Tổng quan

Người dùng đăng ký qua 3 bước: nhập thông tin → xác thực SĐT bằng OTP → hoàn tất đăng ký. Hệ thống chỉ tạo user khi SĐT đã được verify.

## Flow

```
FE (3 màn hình)              API Gateway (:8080)         notification-service (:8085)      user-service (:8081)
                                    |                              |                              |
Màn 1: Nhập họ tên                  |                              |                              |
        ↓                           |                              |                              |
Màn 2: Nhập SĐT                    |                              |                              |
  Bấm "Nhận OTP"                    |                              |                              |
  ---- API 1 ----→  POST /api/v1/otp/send  ----→  POST /api/otp/send                             |
                                    |              Tạo OTP 6 số → hash BCrypt → lưu Redis         |
                                    |              Gửi SMS qua eSMS API                           |
                     ←── { message } ←────────────────────────────                                |
                                    |                              |                              |
  Nhập OTP                          |                              |                              |
  Bấm "Xác nhận"                    |                              |                              |
  ---- API 2 ----→  POST /api/v1/otp/verify  ──→  POST /api/otp/verify                           |
                                    |              Check Redis: hết hạn? sai quá 5 lần?           |
                                    |              OTP đúng → tạo verificationToken (HMAC)        |
                     ←── { verificationToken } ←──────────────────                                |
                                    |                              |                              |
        ↓                           |                              |                              |
Màn 3: Nhập email + mật khẩu + PIN |                              |                              |
  Bấm "Đăng ký"                     |                              |                              |
  ---- API 3 ----→  POST /api/v1/users/register  ─────────────────────→  POST /api/users/register
                                    |                              |      Verify token HMAC        |
                                    |                              |      Check phone khớp token   |
                                    |                              |      Check token chưa hết hạn |
                                    |                              |      Tạo user (ACTIVE)        |
                                    |                              |      Tạo ví (wallet-service)  |
                     ←── 200 OK ←─────────────────────────────────────────────────────────────────
```

## Chi tiết API

### API 1 — Gửi OTP

```
POST /api/v1/otp/send
```

| Field | Value |
|-------|-------|
| Request | `{ "phone": "0912345678" }` |
| Success 200 | `{ "message": "Mã OTP đã được gửi đến số điện thoại của bạn" }` |
| Error 429 | `{ "code": 2004, "message": "Vui lòng chờ trước khi yêu cầu mã mới" }` — cooldown 60s |
| Error 500 | `{ "code": 2005, "message": "Gửi mã OTP thất bại" }` — eSMS lỗi |

### API 2 — Xác thực OTP

```
POST /api/v1/otp/verify
```

| Field | Value |
|-------|-------|
| Request | `{ "phone": "0912345678", "otp": "123456" }` |
| Success 200 | `{ "verificationToken": "MDkxMjM0NTY3OHwxNzE..." }` |
| Error 400 | `{ "code": 2001, "message": "Mã OTP đã hết hạn" }` — quá 5 phút |
| Error 400 | `{ "code": 2002, "message": "Mã OTP không đúng. Còn 4 lần thử" }` |
| Error 400 | `{ "code": 2003, "message": "Nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới" }` — sai 5 lần |

### API 3 — Đăng ký

```
POST /api/v1/users/register
```

| Field | Value |
|-------|-------|
| Request | `{ "fullName": "Nguyen Van A", "phone": "0912345678", "email": "a@gmail.com", "password": "123456", "transactionPin": "123456", "verificationToken": "MDkxMjM0NTY3OHwxNzE..." }` |
| Success 200 | (empty body) |
| Error 400 | `{ "code": 1017, "message": "Token xác thực không hợp lệ" }` — token giả mạo |
| Error 400 | `{ "code": 1018, "message": "Số điện thoại không khớp với token xác thực" }` — đổi SĐT |
| Error 400 | `{ "code": 1019, "message": "Phiên xác thực đã hết hạn, vui lòng xác thực lại" }` — token quá 10 phút |
| Error 400 | `{ "code": 1003, "message": "Số điện thoại đã được đăng ký" }` |
| Error 400 | `{ "code": 1004, "message": "Email đã được đăng ký" }` |

## Bảo mật

- **OTP** lưu Redis dạng BCrypt hash, TTL 5 phút tự xóa
- **verificationToken** ký bằng HMAC-SHA256 với `INTERNAL_SECRET` — client không thể giả mạo
- Token chứa phone + timestamp → chống đổi SĐT và chống dùng lại token cũ
- Sai OTP 5 lần → khóa, phải gửi OTP mới
- Cooldown 60s giữa các lần gửi OTP → chống spam SMS
