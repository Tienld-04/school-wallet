# Quy ước toàn dự án (luôn áp dụng)

- **Env dùng chung:** `EnvLoader` đọc `.env` từ working directory của process → file `.env` ở **gốc repo trùm** `.env` của từng service. Đổi DB password / VNPay creds phải sửa `d:/BE/school-wallet/.env`.
- **Bảo mật nội bộ:** service downstream KHÔNG tự verify JWT. Gateway verify JWT → gọi `/internal/users/validate?jti` (blacklist) → strip rồi inject `X-User-Id/Role/Phone`. Mọi `/internal/**` bảo vệ bằng header `X-Internal-Secret`.
- **JWT:** HS512, claims `sub=userId`, `role`, `phone`, `jti`, exp 3h. Logout = lưu `jti` vào `invalidated_tokens`.
- **`ddl-auto=update` KHÔNG cập nhật CHECK constraint** khi thêm enum value → phải `ALTER TABLE` thủ công (vd `LedgerReason.PLATFORM_FEE`) và bổ sung vào `schema.sql`. `schema.sql` hiện thiếu `PLATFORM_FEE` trong CHECK của `wallet_ledger.reason`.
- **Thêm endpoint admin:** khai báo route + rule ở gateway `SecurityConfig` AND check role trong controller (defense-in-depth).
- **Mỗi service một DB, KHÔNG FK xuyên service.** Dữ liệu chia sẻ đi qua REST `/internal/**`.
