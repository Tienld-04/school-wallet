# QR Code Payment Workflow (Dynamic QR) – School Wallet

## Tổng quan
Luồng thanh toán qua QR Code Động (Dynamic QR). Trong luồng này, **Người nhận (hoặc Cửa hàng)** sẽ chủ động nhập số tiền cần thanh toán và nội dung. Hệ thống tạo ra một mã QR có thời hạn (1 phút). **Người gửi (hoặc Khách hàng)** chỉ việc quét QR, hệ thống tự động điền số tiền và người gửi chỉ cần xác thực mã PIN để hoàn tất giao dịch.

---

## Giai đoạn 1 – Tạo mã QR Yêu cầu thanh toán (Người nhận)

```
Người nhận (A) mở màn hình "Tạo QR Nhận tiền"
  - Nhập số tiền: 50,000đ
  - Nhập nội dung: "Thanh toán bữa sáng"
        │
        ▼
FE của A gọi: POST /api/v1/users/qr/dynamic
        Header: Authorization: Bearer <JWT của A>
        Body: 
        {
           "amount": 50000,
           "description": "Thanh toán bữa sáng"
        }
        │
        ▼
[user-service]
  - Lấy thông tin user hiện tại (A) từ UserContext (dựa vào JWT).
  - Khởi tạo thời gian hết hạn: expiredAt = currentTime + 60s.
  - Tạo chuỗi dữ liệu: data = phone + "|" + name + "|50000|Thanh toán bữa sáng|" + expiredAt
  - Ký bảo mật HMAC_SHA512: sig = hmacSha512(data, qrSecretKey)
  - Đóng gói thành chuỗi JSON:
    {
      "type": "SCHOOL_WALLET_DYNAMIC",
      "phone": "0912345670",
      "name": "Nguyễn Văn A",
      "amount": 50000,
      "description": "Thanh toán bữa sáng",
      "expiredAt": 1774164660155,
      "sig": "342384fa9..."
    }
  - Trả về FE: { "qrContent": "chuỗi JSON trên" }
        │
        ▼
FE của A nhận `qrContent` và dùng thư viện (qrcode.js / qr_flutter) 
để vẽ ra hình ảnh Mã QR trên màn hình.
```

---

## Giai đoạn 2 – Quét mã và Thanh toán (Người gửi)

```
Người gửi (B) mở màn hình "Quét Mã QR"
        │
        ▼
Camera đọc hình ảnh QR và giải mã ra lại chuỗi JSON nguyên bản (`qrContent`).
        │
        ▼
FE của B trích xuất trường `type` từ JSON:
  - Nếu `type` != "SCHOOL_WALLET_DYNAMIC" -> Hiển thị cảnh báo "Mã QR không hợp lệ!"
  - Nếu đúng -> Tiếp tục.
        │
        ▼
FE của B gọi: POST /api/v1/users/qr/verify
        Header: Authorization: Bearer <JWT của B>
        Body: { "qrContent": "<chuỗi JSON lấy được từ Camera>" }
        │
        ▼
[user-service] Xử lý Verify QR:
  1. Đọc chuỗi JSON lấy ra: phone, name, amount, description, expiredAt, sig.
  2. Kiểm tra ExpiredAt:
     - Nếu (currentTime > expiredAt) -> Throw Error: "Mã QR này đã hết hạn" ❌
  3. Kiểm tra tính toàn vẹn (Chống giả mạo số tiền/sđt):
     - Tự tính toán lại chữ ký: expectedSig = hmacSha512(tập dữ liệu, qrSecretKey)
     - So sánh expectedSig với sig trong QR.
     - Nếu KHÁC NHAU -> Throw Error: "Mã QR không hợp lệ hoặc đã bị sửa đổi" ❌
     - Nếu GIỐNG NHAU -> Trả về HTTP 200 OK kèm thông tin:
       { "phone": "0912345670", "name": "Nguyễn Văn A", "amount": 50000, "description": "Thanh toán..." } ✅
        │
        ▼
FE của B nhận cục Data thành công, hiển thị giao diện:
  ------------------------------------------------
  Chuyển tiền đến: Nguyễn Văn A (0912345670)
  Số tiền: 50,000đ
  Lời nhắn: Thanh toán bữa sáng
  ------------------------------------------------
        │
        ▼
Người gửi (B) nhập MÃ PIN GIAO DỊCH và bấm "Xác nhận Thanh toán".
        │
        ▼
FE của B gọi: POST /api/v1/transactions
        Header: Authorization: Bearer <JWT của B>
        Body:
        {
          "requestId": "unique-uuid-1234",
          "toPhoneNumber": "0912345670",   <-- Lấy từ kết quả verify QR
          "amount": 50000,                 <-- Lấy từ kết quả verify QR
          "description": "Thanh toán bữa sáng", <-- Lấy từ kết quả verify QR
          "pin": "123456"                  <-- Người dùng B vừa nhập
        }
        │
        ▼
[API Gateway -> transaction-service] (Luồng Transfer hiện tại)
  1. Transaction Service gọi user-service: Xác thực mã PIN của B.
  2. Kiểm tra requestId để tránh double-payment (idempotency).
  3. Gọi user-service lấy thông tin ví của B và A. (Check xem tài khoản A có khóa không).
  4. Lưu Database Transaction (Trạng thái PENDING).
  5. Gọi API `POST /internal/wallets/transfer` bên `wallet-service` để trừ tiền B, cộng tiền A.
  6. Thành công -> Update trạng thái Transaction thành SUCCESS.
        │
        ▼
FE của B nhận HTTP 200 OK -> Chuyển sang màn hình "Thanh toán thành công!" 🎉
```

---

## Chi tiết Security (Bảo mật luồng thanh toán)

1. **Chống làm giả (Data Tampering):** Nhờ chữ ký `sig` HMAC_SHA512. Nếu kẻ gian sửa `amount` trong QR từ 50,000 xuống 1,000, hệ thống khi verify sẽ hash lại bộ dữ liệu mới và ra một chuỗi khác biệt hoàn toàn với `sig` gốc. Backend sẽ từ chối giao dịch ngay lập tức ở bước verify.
2. **Chống dùng lại (Replay Attack / Expired):** Mã QR có `expiredAt` được xét giới hạn 1 phút. Dù kẻ xấu có copy lại toàn bộ QR JSON (có sig đúng) đem đi thanh toán lại vào lúc khác, hệ thống sẽ phát hiện đã quá hạn và từ chối.
3. **Chống Bypass Transfer:** Dù cho Hacker có tự đóng giả FE gọi trực tiếp vào API `POST /api/v1/transactions` bằng tool (như Postman), tiền vẫn sẽ không lọt ra ngoài vì Hacker buộc phải biết mã `PIN` xác thực của người gửi.
4. **Idempotency (Tính Lũy Đẳng):** Nhờ vào `requestId` do FE gắn kèm khi gọi `/transactions`, nếu mạng bị lag ngắt kết nối mà FE bấm Pay 2 lần, hệ thống DB vẫn chặn kịp thời, tiền không bao giờ bị trừ 2 lần cho 1 đơn thanh toán.
