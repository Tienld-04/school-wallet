---
name: api-contract-review
description: Rà soát hợp đồng API của School Wallet — REST endpoint, request/response DTO, routing & phân quyền ở gateway, đồng bộ type FE↔BE, internal endpoint + header bảo mật. Dùng khi thêm/sửa endpoint, đổi DTO, hoặc review PR động đến contract giữa các service hay giữa FE và BE.
---

# API Contract Review — School Wallet

Kiến trúc: React SPA → `api-gateway` (8080) → user/wallet/transaction/notification-service. Đọc [CLAUDE.md](../../../CLAUDE.md) để nắm port, package, quy ước.

## Khi nào dùng
- Thêm/sửa/xóa endpoint REST (public, authenticated, admin, hoặc `/internal/**`).
- Thêm/đổi field trong request/response DTO.
- Đổi routing, phân quyền, CORS ở gateway.
- Review PR chạm tới giao tiếp FE↔BE hoặc service↔service.

## Checklist

### 1. Routing & phân quyền (api-gateway)
- [ ] Endpoint mới đã khai báo route ở `GatewayConfig` (rewrite `/api/v1/** → /api/**`).
- [ ] Quy tắc bảo mật ở `SecurityConfig`: public / `authenticated` / `hasAuthority('ADMIN')` đúng ý định.
- [ ] **Admin endpoint phải gate ở CẢ gateway AND check role trong controller** (defense-in-depth).
- [ ] Endpoint cần callback ngoài (vd VNPay IPN) → permit-all ở gateway + skip `ApiSecurityFilter`.

### 2. Header & context
- [ ] Controller lấy user từ `UserContext` (do gateway inject `X-User-Id/Role/Phone`), KHÔNG tự parse JWT.
- [ ] Endpoint `/internal/**` được bảo vệ bằng `X-Internal-Secret` (qua `InternalSecretFilter`); không lộ ra route public ở gateway.

### 3. DTO request/response
- [ ] Request có validation (`@NotBlank`, `@Size`, `@Positive`…) đúng ràng buộc nghiệp vụ.
- [ ] Thao tác tạo/chuyển tiền có `requestId` (idempotency, FE generate).
- [ ] Response KHÔNG leak field nhạy cảm (passwordHash, pinHash, internalSecret…).
- [ ] Số tiền dùng `BigDecimal`, không dùng `double`/`float`.
- [ ] Dùng `PageResponse<T>` cho danh sách phân trang (đồng nhất toàn project).

### 4. Đồng bộ FE↔BE (font-end)
- [ ] Có interface tương ứng trong `font-end/src/types/index.ts`.
- [ ] Có method trong api client phù hợp (`authApi`/`userApi`/`walletApi`/`transactionApi`/`merchantApi`/`adminApi`/…).
- [ ] Path FE gọi (`/api/v1/...`) khớp route gateway sau rewrite.
- [ ] FE xử lý lỗi qua `getErrorMessage()` (utils/errorMessage), khớp `ErrorCode` BE trả về.

### 5. Hợp đồng giữa service (internal)
- [ ] DTO internal được **mirror đúng** ở cả service gọi và service nhận (vd `UserInternalResponse` ở user-service ↔ transaction-service). Thêm field một bên phải cập nhật bên kia.
- [ ] Đổi enum trong DTO/entity → cập nhật CHECK constraint DB thủ công (`ddl-auto=update` không tự sync) và bổ sung vào `schema.sql`.

### 6. Tài liệu
- [ ] Đổi luồng/contract lớn → cập nhật `CLAUDE.md` và sơ đồ trong `docs/`.

## Output review
Nêu theo nhóm: **Lỗi chặn merge** (sai phân quyền, leak field, lệch internal DTO) → **Cần sửa** (thiếu validation, FE chưa đồng bộ) → **Gợi ý**. Mỗi mục dẫn `file:line`.
