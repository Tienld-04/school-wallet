# QR Code Transfer Workflow – School Wallet

## Tổng quan

Người dùng quét mã QR của người nhận, nhập số tiền và xác thực PIN để chuyển tiền. Hệ thống gồm 2 giai đoạn: **hiển thị QR** và **quét QR để chuyển tiền**.

---

## Giai đoạn 1 – Hiển thị mã QR cá nhân (Người nhận)

```
Người nhận (A) mở màn hình "Mã QR của tôi"
        │
        ▼
FE gọi: GET /api/v1/users/my-qr
        Header: Authorization: Bearer <JWT của A>
        │
        ▼
[API Gateway]
  - Xác thực JWT
  - Gọi user-service /internal/users/validate?jti=... → kiểm tra blacklist
  - Inject headers: X-User-Id, X-User-Phone, X-User-Role, X-Internal-Secret
  - Forward sang user-service
        │
        ▼
[user-service – GET /api/users/my-qr]
  - Lấy userId từ X-User-Id header (UserContext)
  - Truy vấn DB: lấy phone + fullName của A
  - Tạo chữ ký: sig = HMAC_HS512(phone + "|" + name, QR_SECRET_KEY)
  - Build qrContent (chuỗi JSON):
      {"type":"SCHOOL_WALLET_STATIC","phone":"0912345670","name":"Nguyễn Văn A","sig":"abc123..."}
  - Trả về: { "qrContent": "..." }
        │
        ▼
FE nhận qrContent → render thành ảnh QR (thư viện qrcode.js / qr_flutter)
        │
        ▼
Người nhận A giơ điện thoại cho người gửi B quét ✅
```

---

## Giai đoạn 2 – Quét QR và chuyển tiền (Người gửi)

```
Người gửi (B) mở màn hình "Quét QR"
        │
        ▼
Camera đọc QR → FE nhận chuỗi qrContent (JSON)
        │
        ├─ Kiểm tra type === "SCHOOL_WALLET_STATIC"?
        │     Không khớp → Báo lỗi "Mã QR không thuộc hệ thống School Wallet" ❌
        │     Khớp → tiếp tục
        │
        ▼
FE gọi: POST /api/v1/users/qr/verify
        Header: Authorization: Bearer <JWT của B>
        Body: { "qrContent": "..." }
        │
        ▼
[user-service – POST /api/users/qr/verify]
  - Parse qrContent → lấy type, phone, name, sig
  - Validation: type phải là "SCHOOL_WALLET_STATIC" hoặc "SCHOOL_WALLET_DYNAMIC".
  - Vì là Static QR, data = phone + "|" + name
  - Tính lại: expectedSig = HMAC_HS512(data, QR_SECRET_KEY)
  - So sánh expectedSig với sig trong QR:
      Không khớp → 400 "Mã QR không hợp lệ hoặc đã bị giả mạo!" ❌
      Khớp → Trả về thông tin: { "phone": "0912345670", "name": "Nguyễn Văn A" } ✅
        │
        ▼
FE hiển thị thông tin người nhận:
  - Tên: Nguyễn Văn A
  - SĐT: 0912345670
        │
        ▼
Người gửi B nhập:
  - Số tiền muốn chuyển
  - Mô tả (tùy chọn)
        │
        ▼
B nhập mã PIN giao dịch
        │
        ▼
FE gọi: POST /api/v1/transactions
        Header: Authorization: Bearer <JWT của B>
        Body:
        {
          "requestId":     "uuid-unique",
          "toPhoneNumber": "0912345670",
          "amount":        100000,
          "description":   "Chuyển tiền",
          "pin":           "123456"
        }
        │
        ▼
[API Gateway + transaction-service]
  → Xác thực PIN, kiểm tra số dư, chuyển tiền
  → (Chi tiết xem transfer_workflow.md)
        │
        ▼
Chuyển tiền thành công ✅
FE hiển thị màn hình kết quả giao dịch
```

---

## Các API liên quan

| API | Service | Mô tả |
|-----|---------|-------|
| `GET /api/v1/users/my-qr` | user-service | Tạo QR content có chữ ký HMAC_HS512 |
| `POST /api/v1/users/qr/verify` | user-service | Xác minh chữ ký QR, trả về thông tin người nhận |
| `POST /api/v1/transactions` | transaction-service | Thực hiện chuyển tiền (flow như bình thường) |

---

## Bảo mật QR

| Cơ chế | Mô tả |
|--------|-------|
| **Chữ ký HMAC_HS512** | Chống làm giả `phone`/`name` trong QR |
| **`type` field** | FE lọc QR của hệ thống khác (`SCHOOL_WALLET_STATIC` hoặc `SCHOOL_WALLET_DYNAMIC`) |
| **Verify tại backend** | Không tin vào FE, sig được kiểm tra server-side |
| **Không có thời hạn** | QR cá nhân tồn tại vĩnh viễn (giống MoMo Static QR) |
| **QR thay đổi khi** | Người dùng đổi tên / admin xoay `QR_SECRET_KEY` |

---

## Trường hợp lỗi

| Trường hợp | Xử lý |
|-----------|-------|
| QR của app khác | FE từ chối (type không nằm trong hệ thống School Wallet) |
| QR bị làm giả (sửa phone/name) | Backend từ chối ở API verify (sig không khớp) |
| Người nhận bị khóa tài khoản | Bị chặn tại bước transfer (check status) |
| Sai PIN | Báo số lần còn lại, khóa 15 phút nếu sai ≥ 5 lần |
| Số dư không đủ | wallet-service từ chối, giao dịch FAILED |
