# 2.2.2. Thiết kế cơ sở dữ liệu

## A. Mô hình thực thể liên kết (ERD)

Xem file [database-erd.puml](./database-erd.puml).

Hệ thống School Wallet được thiết kế theo kiến trúc **microservices** với nguyên tắc **Database per Service** — mỗi service quản lý cơ sở dữ liệu riêng, không có khóa ngoại (FK) ràng buộc qua nhiều cơ sở dữ liệu. Mối quan hệ giữa các thực thể ở các service khác nhau được duy trì ở mức logic thông qua việc lưu UUID tham chiếu.

Hệ thống gồm 10 thực thể, được phân chia trên 4 cơ sở dữ liệu:

| Cơ sở dữ liệu | Thực thể | Mục đích |
|---|---|---|
| `user_db` | `users`, `user_kyc`, `merchants`, `invalidated_tokens` | Quản lý tài khoản, KYC, dịch vụ, phiên đăng nhập |
| `wallet_db` | `wallets`, `wallet_ledger` | Quản lý ví và sổ cái biến động số dư |
| `transaction_db` | `transactions`, `transaction_status_history` | Quản lý giao dịch và lịch sử trạng thái |
| `notification_db` | `notification`, `notification_log` | Quản lý thông báo in-app và log gửi Email/SMS |

## B. Chuyển đổi sang mô hình quan hệ

Sau khi chuyển từ ERD sang mô hình quan hệ, hệ thống bao gồm 10 quan hệ (bảng) sau, được nhóm theo từng cơ sở dữ liệu.

---

### B.1. Cơ sở dữ liệu `user_db` (user-service)

#### Bảng `users`

**Mô tả:** Lưu thông tin tài khoản người dùng trong hệ thống.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `user_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính, UUID tự sinh |
| 2 | `full_name` | VARCHAR(100) | ✓ | — | — | Họ và tên đầy đủ |
| 3 | `phone` | VARCHAR(10) | ✓ | — | UQ | Số điện thoại (10 chữ số), duy nhất |
| 4 | `email` | VARCHAR(100) | ✓ | — | UQ | Địa chỉ email, duy nhất |
| 5 | `password` | VARCHAR(255) | ✓ | — | — | Mật khẩu đã băm BCrypt |
| 6 | `role` | VARCHAR(20) | ✓ | `'USER'` | CHECK | Vai trò: `USER` \| `ADMIN` |
| 7 | `status` | VARCHAR(20) | ✓ | `'ACTIVE'` | CHECK | Trạng thái: `ACTIVE` \| `LOCKED` |
| 8 | `kyc_status` | VARCHAR(20) | ✓ | `'UNVERIFIED'` | CHECK | KYC: `UNVERIFIED` \| `PENDING` \| `VERIFIED` \| `REJECTED` |
| 9 | `last_login_at` | TIMESTAMP | — | — | — | Thời điểm đăng nhập gần nhất |
| 10 | `failed_login_count` | INT | ✓ | 0 | — | Số lần đăng nhập sai liên tiếp |
| 11 | `transaction_pin_hash` | VARCHAR(255) | ✓ | — | — | Mã PIN giao dịch đã băm BCrypt |
| 12 | `pin_failed_attempts` | INT | ✓ | 0 | — | Số lần nhập PIN sai liên tiếp |
| 13 | `pin_locked_until` | TIMESTAMP | — | — | — | Thời điểm mở khoá PIN (null = chưa khoá) |
| 14 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm tạo bản ghi |
| 15 | `updated_at` | TIMESTAMP | ✓ | — | — | Thời điểm cập nhật gần nhất |
| 16 | `create_by` | VARCHAR(255) | — | — | — | ID người tạo |
| 17 | `update_by` | VARCHAR(255) | — | — | — | ID người cập nhật gần nhất |

**Khóa:** `PK(user_id)` · `UQ(phone)` · `UQ(email)`

---

#### Bảng `user_kyc`

**Mô tả:** Lưu thông tin xác minh danh tính (KYC) của người dùng. Mỗi user có tối đa 1 hồ sơ.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `kyc_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `user_id` | UUID | ✓ | — | FK, UQ | Tham chiếu `users.user_id`, mỗi user 1 KYC |
| 3 | `full_name` | VARCHAR(100) | ✓ | — | — | Họ tên theo CCCD |
| 4 | `date_of_birth` | DATE | ✓ | — | — | Ngày sinh |
| 5 | `id_number` | VARCHAR(20) | ✓ | — | — | Số CCCD/CMND |
| 6 | `id_issue_date` | DATE | ✓ | — | — | Ngày cấp CCCD |
| 7 | `id_issue_place` | VARCHAR(255) | ✓ | — | — | Nơi cấp CCCD |
| 8 | `place_of_origin` | VARCHAR(255) | — | — | — | Quê quán (nguyên quán) theo CCCD; nullable cho dữ liệu KYC cũ |
| 9 | `permanent_address` | VARCHAR(255) | — | — | — | Địa chỉ thường trú theo CCCD; nullable cho dữ liệu KYC cũ |
| 10 | `id_front_url` | VARCHAR(500) | — | — | — | URL ảnh mặt trước (legacy) |
| 11 | `id_back_url` | VARCHAR(500) | — | — | — | URL ảnh mặt sau (legacy) |
| 12 | `id_front_image` | BYTEA | — | — | — | Ảnh mặt trước CCCD (binary) |
| 13 | `id_back_image` | BYTEA | — | — | — | Ảnh mặt sau CCCD (binary) |
| 14 | `status` | VARCHAR(20) | ✓ | `'PENDING'` | CHECK | `PENDING` \| `VERIFIED` \| `REJECTED` |
| 15 | `submitted_at` | TIMESTAMP | ✓ | — | — | Thời điểm nộp KYC |
| 16 | `verified_by` | UUID | — | — | — | UUID admin duyệt (null nếu chưa duyệt) |
| 17 | `verified_at` | TIMESTAMP | — | — | — | Thời điểm được duyệt |
| 18 | `rejection_reason` | VARCHAR(500) | — | — | — | Lý do từ chối |
| 19 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm tạo bản ghi |
| 20 | `updated_at` | TIMESTAMP | ✓ | — | — | Thời điểm cập nhật gần nhất |

**Khóa:** `PK(kyc_id)` · `UQ(user_id)` · `FK(user_id) → users(user_id)`

---

#### Bảng `merchants`

**Mô tả:** Lưu thông tin nhà cung cấp dịch vụ trong trường (căn-tin, bãi xe, thư viện…).

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `merchant_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `name` | VARCHAR(100) | ✓ | — | — | Tên merchant |
| 3 | `type` | VARCHAR(50) | ✓ | — | CHECK | Loại: `CANTEEN` \| `PARKING` \| `PRINTING` \| `LIBRARY` \| `BOOKSTORE` \| `CLUB` \| `EVENT` \| `OTHER` |
| 4 | `user_id` | UUID | ✓ | — | FK | Người quản lý merchant (tham chiếu `users.user_id`) |
| 5 | `active` | BOOLEAN | ✓ | TRUE | — | Trạng thái hoạt động |
| 6 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm tạo bản ghi |
| 7 | `updated_at` | TIMESTAMP | ✓ | — | — | Thời điểm cập nhật gần nhất |
| 8 | `create_by` | VARCHAR(255) | — | — | — | ID người tạo |
| 9 | `update_by` | VARCHAR(255) | — | — | — | ID người cập nhật gần nhất |

**Khóa:** `PK(merchant_id)` · `FK(user_id) → users(user_id)`

---

#### Bảng `invalidated_tokens`

**Mô tả:** Danh sách JWT đã bị thu hồi (blacklist) khi người dùng đăng xuất trước thời hạn hết hạn của token.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `jti` | VARCHAR(255) | ✓ | — | PK | JWT ID (claim `jti`) |
| 2 | `expiry_time` | TIMESTAMP | ✓ | — | — | Thời điểm hết hạn của token gốc (dùng cho cron dọn dẹp) |

**Khóa:** `PK(jti)`

---

### B.2. Cơ sở dữ liệu `wallet_db` (wallet-service)

#### Bảng `wallets`

**Mô tả:** Lưu thông tin ví điện tử của từng người dùng. Mỗi user có đúng 1 ví.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `wallet_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `user_id` | UUID | ✓ | — | UQ | Logic FK → `user_db.users.user_id`, mỗi user 1 ví |
| 3 | `balance` | NUMERIC(18,2) | ✓ | 0.00 | CHECK ≥ 0 | Số dư hiện tại (VND) |
| 4 | `status` | VARCHAR(20) | ✓ | `'ACTIVE'` | CHECK | `ACTIVE` \| `LOCKED` |
| 5 | `wallet_type` | VARCHAR(20) | ✓ | `'USER_WALLET'` | CHECK | `USER_WALLET` \| `ADMIN_WALLET` |
| 6 | `daily_limit` | NUMERIC(18,2) | — | 5,000,000.00 | — | Hạn mức chi tiêu trong ngày |
| 7 | `monthly_limit` | NUMERIC(18,2) | — | 30,000,000.00 | — | Hạn mức chi tiêu trong tháng |
| 8 | `daily_spent` | NUMERIC(18,2) | — | 0.00 | — | Số tiền đã chi trong ngày hiện tại |
| 9 | `last_daily_reset` | DATE | — | — | — | Ngày reset `daily_spent` gần nhất |
| 10 | `monthly_spent` | NUMERIC(18,2) | — | 0.00 | — | Số tiền đã chi trong tháng hiện tại |
| 11 | `last_monthly_reset` | DATE | — | — | — | Tháng reset `monthly_spent` gần nhất |
| 12 | `currency` | VARCHAR(3) | ✓ | `'VND'` | — | Đơn vị tiền tệ |
| 13 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm tạo ví |
| 14 | `updated_at` | TIMESTAMP | ✓ | — | — | Thời điểm cập nhật gần nhất |

**Khóa:** `PK(wallet_id)` · `UQ(user_id)`

---

#### Bảng `wallet_ledger`

**Mô tả:** Sổ cái kép (double-entry) ghi lại mọi biến động số dư của ví. Phục vụ đối soát và audit trail.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `entry_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `wallet_id` | UUID | ✓ | — | FK | Ví bị ảnh hưởng |
| 3 | `transaction_id` | UUID | — | — | — | Tham chiếu giao dịch (logic, nullable) |
| 4 | `direction` | VARCHAR(10) | ✓ | — | CHECK | Chiều tiền: `DEBIT` \| `CREDIT` |
| 5 | `amount` | NUMERIC(18,2) | ✓ | — | CHECK > 0 | Số tiền biến động |
| 6 | `balance_before` | NUMERIC(18,2) | ✓ | — | — | Số dư trước khi thực hiện |
| 7 | `balance_after` | NUMERIC(18,2) | ✓ | — | — | Số dư sau khi thực hiện |
| 8 | `reason` | VARCHAR(20) | ✓ | — | CHECK | `PAYMENT` \| `TRANSFER_IN` \| `TRANSFER_OUT` \| `TOP_UP` \| `REFUND` \| `PLATFORM_FEE` |
| 9 | `note` | VARCHAR(255) | — | — | — | Ghi chú tự do |
| 10 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm ghi sổ |

**Khóa:** `PK(entry_id)` · `FK(wallet_id) → wallets(wallet_id)`
**Chỉ mục (Index):** `idx_wallet_ledger_wallet_id`, `idx_wallet_ledger_transaction_id`, `idx_wallet_ledger_created_at`

---

### B.3. Cơ sở dữ liệu `transaction_db` (transaction-service)

#### Bảng `transactions`

**Mô tả:** Lưu toàn bộ giao dịch tài chính trong hệ thống (nạp tiền, chuyển tiền, thanh toán).

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `transaction_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `request_id` | VARCHAR(255) | ✓ | — | UQ | ID idempotency do FE gửi (chống double-submit) |
| 3 | `from_user_id` | UUID | ✓ | — | — | UUID người gửi (logic FK → `users.user_id`) |
| 4 | `from_phone` | VARCHAR(15) | — | — | — | SĐT người gửi (snapshot) |
| 5 | `from_full_name` | VARCHAR(100) | — | — | — | Họ tên người gửi (snapshot) |
| 6 | `to_user_id` | UUID | ✓ | — | — | UUID người nhận (logic FK → `users.user_id`) |
| 7 | `to_phone` | VARCHAR(15) | — | — | — | SĐT người nhận (snapshot) |
| 8 | `to_full_name` | VARCHAR(100) | — | — | — | Họ tên người nhận (snapshot) |
| 9 | `amount` | NUMERIC(18,2) | ✓ | — | CHECK > 0 | Số tiền giao dịch (VND) |
| 10 | `fee` | NUMERIC(18,2) | ✓ | 0.00 | CHECK ≥ 0 | Phí nền tảng (chỉ > 0 khi PAYMENT có thu phí) |
| 11 | `transaction_type` | VARCHAR(30) | ✓ | — | CHECK | `TOPUP` \| `TRANSFER` \| `PAYMENT` |
| 12 | `status` | VARCHAR(20) | ✓ | `'PENDING'` | CHECK | `PENDING` \| `SUCCESS` \| `FAILED` \| `CANCELLED` |
| 13 | `merchant_id` | UUID | — | — | — | UUID merchant (chỉ dùng khi `PAYMENT`, logic FK) |
| 14 | `description` | TEXT | — | — | — | Nội dung / ghi chú giao dịch |
| 15 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm khởi tạo |
| 16 | `updated_at` | TIMESTAMP | ✓ | — | — | Thời điểm cập nhật gần nhất |
| 17 | `create_by` | VARCHAR(255) | — | — | — | ID người tạo |
| 18 | `update_by` | VARCHAR(255) | — | — | — | ID người cập nhật gần nhất |

**Khóa:** `PK(transaction_id)` · `UQ(request_id)`
**Chỉ mục (Index):** `idx_from_user_id`, `idx_to_user_id`, `idx_created_at`

---

#### Bảng `transaction_status_history`

**Mô tả:** Audit trail ghi lại lịch sử chuyển trạng thái của từng giao dịch.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `history_id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `transaction_id` | UUID | ✓ | — | FK | Giao dịch liên quan |
| 3 | `from_status` | VARCHAR(20) | — | — | CHECK | Trạng thái cũ (null nếu là bản ghi đầu) |
| 4 | `to_status` | VARCHAR(20) | ✓ | — | CHECK | Trạng thái mới |
| 5 | `reason` | VARCHAR(500) | — | — | — | Lý do chuyển trạng thái |
| 6 | `changed_at` | TIMESTAMP | ✓ | — | — | Thời điểm chuyển trạng thái |

**Khóa:** `PK(history_id)` · `FK(transaction_id) → transactions(transaction_id)`
**Chỉ mục (Index):** `idx_tsh_transaction_id`, `idx_tsh_changed_at`

---

### B.4. Cơ sở dữ liệu `notification_db` (notification-service)

#### Bảng `notification`

**Mô tả:** Lưu các thông báo in-app hiển thị cho người dùng.

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `user_id` | UUID | ✓ | — | — | UUID người nhận (logic FK) |
| 3 | `title` | VARCHAR(255) | ✓ | — | — | Tiêu đề thông báo |
| 4 | `description` | VARCHAR(500) | — | — | — | Nội dung chi tiết |
| 5 | `type` | VARCHAR(20) | ✓ | — | CHECK | `TRANSACTION` \| `SYSTEM` |
| 6 | `transaction_id` | UUID | — | — | — | Giao dịch liên quan (logic FK) |
| 7 | `transaction_type` | VARCHAR(50) | — | — | — | Loại giao dịch |
| 8 | `amount` | NUMERIC(19,2) | — | — | — | Số tiền giao dịch |
| 9 | `direction` | VARCHAR(10) | — | — | CHECK | `DEBIT` \| `CREDIT` |
| 10 | `counterparty_name` | VARCHAR(255) | — | — | — | Tên đối tác giao dịch |
| 11 | `counterparty_phone` | VARCHAR(20) | — | — | — | SĐT đối tác giao dịch |
| 12 | `transaction_status` | VARCHAR(30) | — | — | — | Trạng thái giao dịch tại thời điểm thông báo |
| 13 | `is_read` | BOOLEAN | ✓ | FALSE | — | Đã đọc hay chưa |
| 14 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm tạo thông báo |

**Khóa:** `PK(id)`
**Chỉ mục (Index):** `idx_notification_user_id`, `idx_notification_created_at`

---

#### Bảng `notification_log`

**Mô tả:** Log kỹ thuật ghi lại kết quả gửi thông báo qua kênh ngoài (Email/SMS).

| STT | Tên cột | Kiểu dữ liệu | NOT NULL | Mặc định | Ràng buộc | Mô tả |
|---|---|---|:---:|---|---|---|
| 1 | `id` | UUID | ✓ | `gen_random_uuid()` | PK | Khóa chính |
| 2 | `channel` | VARCHAR(10) | ✓ | — | CHECK | Kênh gửi: `EMAIL` \| `SMS` |
| 3 | `recipient` | VARCHAR(255) | ✓ | — | — | Địa chỉ nhận |
| 4 | `user_id` | UUID | — | — | — | UUID người dùng liên quan (logic FK) |
| 5 | `transaction_id` | UUID | — | — | — | UUID giao dịch liên quan (logic FK) |
| 6 | `transaction_type` | VARCHAR(50) | — | — | — | Loại giao dịch |
| 7 | `amount` | NUMERIC(19,2) | — | — | — | Số tiền giao dịch |
| 8 | `direction` | VARCHAR(10) | — | — | CHECK | `DEBIT` \| `CREDIT` |
| 9 | `source` | VARCHAR(20) | ✓ | — | CHECK | `TRANSACTION` \| `INTERNAL` |
| 10 | `status` | VARCHAR(10) | ✓ | — | CHECK | Kết quả gửi: `SENT` \| `FAILED` |
| 11 | `error_message` | VARCHAR(500) | — | — | — | Chi tiết lỗi nếu thất bại |
| 12 | `created_at` | TIMESTAMP | ✓ | — | — | Thời điểm ghi log |

**Khóa:** `PK(id)`
**Chỉ mục (Index):** `idx_nlog_transaction_id`, `idx_nlog_user_id`, `idx_nlog_created_at`

---

## C. Tổng kết quan hệ giữa các thực thể

### C.1. Quan hệ trong cùng cơ sở dữ liệu (khóa ngoại cứng)

| Quan hệ | Bảng cha | Bảng con | Số lượng |
|---|---|---|---|
| Tài khoản — Hồ sơ KYC | `users` | `user_kyc` | 1 — 0..1 |
| Tài khoản — Dịch vụ | `users` | `merchants` | 1 — 0..N |
| Ví — Sổ cái | `wallets` | `wallet_ledger` | 1 — 0..N |
| Giao dịch — Lịch sử trạng thái | `transactions` | `transaction_status_history` | 1 — 0..N |

### C.2. Quan hệ logic (cross-service, không có khóa ngoại cứng)

Do đặc thù kiến trúc microservices, một số quan hệ được duy trì ở mức logic thông qua việc lưu UUID tham chiếu giữa các cơ sở dữ liệu:

| Quan hệ | Bảng cha | Bảng con | Cột tham chiếu |
|---|---|---|---|
| Tài khoản — Ví | `users` (user_db) | `wallets` (wallet_db) | `wallets.user_id` |
| Tài khoản — Giao dịch | `users` (user_db) | `transactions` (transaction_db) | `from_user_id`, `to_user_id` |
| Dịch vụ — Giao dịch | `merchants` (user_db) | `transactions` (transaction_db) | `transactions.merchant_id` |
| Giao dịch — Sổ cái | `transactions` (transaction_db) | `wallet_ledger` (wallet_db) | `wallet_ledger.transaction_id` |
| Tài khoản — Thông báo | `users` (user_db) | `notification` (notification_db) | `notification.user_id` |
| Giao dịch — Thông báo | `transactions` (transaction_db) | `notification` (notification_db) | `notification.transaction_id` |
| Tài khoản — Log thông báo | `users` (user_db) | `notification_log` (notification_db) | `notification_log.user_id` |
| Giao dịch — Log thông báo | `transactions` (transaction_db) | `notification_log` (notification_db) | `notification_log.transaction_id` |

> **Lưu ý:** Tính nhất quán của các quan hệ logic được đảm bảo ở tầng nghiệp vụ (application layer) thay vì ở tầng cơ sở dữ liệu. Điều này phù hợp với nguyên tắc thiết kế microservices, cho phép các service triển khai và mở rộng độc lập.
