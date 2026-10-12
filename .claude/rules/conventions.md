# Quy ước toàn dự án (luôn áp dụng)

- **Env dùng chung:** `EnvLoader` đọc `.env` từ working directory của process → file `.env` ở **gốc repo trùm** `.env` của từng service. Đổi DB password / VNPay creds phải sửa `d:/BE/school-wallet/.env`.
- **Bảo mật nội bộ:** service downstream KHÔNG tự verify JWT. Gateway verify JWT → gọi `/internal/users/validate?jti` (blacklist) → strip header client gửi lên rồi inject `X-Internal-Secret` + `X-User-Id/Role/Phone` (`AuthGlobalFilter`).
- **Ai enforce `X-Internal-Secret`:** `ApiSecurityFilter` của từng service, với `shouldNotFilter() → false` nên chặn **mọi** request HTTP (cả `/api/**` lẫn `/internal/**`), thiếu header là 401. `InternalSecretFilter` là **code chết đã comment** — bị `ApiSecurityFilter` thay thế, đừng bỏ comment lại. Ngoại lệ duy nhất: `/api/transactions/topup/ipn` (VNPay callback) được `shouldNotFilter` cho qua.
- **gRPC không nằm trong lớp bảo vệ đó:** `ApiSecurityFilter` là servlet filter, còn gRPC server (wallet-service, port 9090) là Netty listener riêng → `Transfer`/`TransferWithFee`/`Topup` hiện KHÔNG check secret. Chỉ an toàn nhờ 9090 không publish ra host. Thêm auth thì phải dùng `ServerInterceptor` + `ClientInterceptor`.
- **JWT:** HS512, claims `sub=userId`, `role`, `phone`, `jti`, exp 3h. Logout = lưu `jti` vào `invalidated_tokens`.
- **`ddl-auto=update` KHÔNG cập nhật CHECK constraint** khi thêm enum value → phải `ALTER TABLE` thủ công (vd `LedgerReason.PLATFORM_FEE`) và bổ sung vào `schema.sql`. `schema.sql` hiện thiếu `PLATFORM_FEE` trong CHECK của `wallet_ledger.reason`.
- **Thêm endpoint admin:** khai báo route + rule ở gateway `SecurityConfig` AND check role trong controller (defense-in-depth).
- **Mỗi service một DB, KHÔNG FK xuyên service.** Dữ liệu chia sẻ đi qua REST `/internal/**`, riêng transaction → wallet (transfer/topup) đã chuyển sang **gRPC 9090**.
