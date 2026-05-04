# School Wallet — Tài liệu các luồng nghiệp vụ

Tài liệu mô tả từng luồng (flow) trong hệ thống — cách FE gọi API, BE xử lý, các service và side-effect liên quan.

## Quy ước chung

- **Gateway prefix:** mọi request từ FE đi qua `<gateway>/api/v1/**`. Gateway rewrite path `/api/v1/<x>` → `/api/<x>` rồi forward sang service đích.
- **Auth header:** `axiosClient` tự thêm `Authorization: Bearer <jwt>` từ `localStorage["school_wallet_token"]`.
- **Header gateway inject xuống service:** `X-Internal-Secret`, `X-User-Id`, `X-User-Role`, `X-User-Phone`.
- **Idempotency:** mọi giao dịch chuyển/thanh toán/nạp tiền đều cần `requestId` (UUID v4 từ `crypto.randomUUID()`).

## Danh sách luồng

### Người dùng (USER)

| File | Luồng |
|---|---|
| [register.md](register.md) | Đăng ký tài khoản (3 bước: phone → OTP → info) |
| [login.md](login.md) | Đăng nhập + lấy role |
| [logout.md](logout.md) | Đăng xuất (blacklist JWT) |
| [forgot-password.md](forgot-password.md) | Quên mật khẩu (email password mới) |
| [change-password.md](change-password.md) | Đổi mật khẩu (đã đăng nhập) |
| [dashboard.md](dashboard.md) | Trang chủ — số dư, info, 5 giao dịch gần đây |
| [transfer.md](transfer.md) | Chuyển tiền P2P (3 cách: phone / static QR / dynamic QR) |
| [merchant-payment.md](merchant-payment.md) | Thanh toán merchant (có phí 10%) |
| [topup.md](topup.md) | Nạp tiền VNPay (initiate → redirect → IPN → poll status) |
| [transaction-history.md](transaction-history.md) | Lịch sử giao dịch (phân trang) |
| [qr-flow.md](qr-flow.md) | Sinh + quét QR (Static / Dynamic) |
| [kyc-submit.md](kyc-submit.md) | Nộp hồ sơ KYC |
| [profile.md](profile.md) | Xem thông tin cá nhân + tab đổi mật khẩu / KYC |
| [notification.md](notification.md) | Inbox + WebSocket push real-time |

### Quản trị (ADMIN)

| File | Luồng |
|---|---|
| [admin-stats.md](admin-stats.md) | Dashboard thống kê + biểu đồ time-series |
| [admin-transaction-lookup.md](admin-transaction-lookup.md) | Tra cứu chi tiết giao dịch theo UUID |
| [admin-user-management.md](admin-user-management.md) | Quản lý người dùng (lọc, khoá/mở khoá) |
| [admin-merchant-management.md](admin-merchant-management.md) | CRUD merchant |
| [admin-kyc-management.md](admin-kyc-management.md) | Duyệt / từ chối hồ sơ KYC |
