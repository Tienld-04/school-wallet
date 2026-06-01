---
name: spring-boot-patterns
description: Các pattern/idiom Spring Boot chuẩn của School Wallet mà code mới phải tuân theo — cấu trúc service, gateway header + UserContext, internal secret, orchestration giao dịch 4 pha, lock ví, idempotency, exception/ErrorCode, env, ActiveMQ event. Dùng khi viết code backend mới hoặc cần biết "cách dự án này làm".
---

# Spring Boot Patterns — School Wallet

Tham chiếu nhanh các idiom chuẩn để code mới đồng nhất với codebase. Chi tiết kiến trúc xem [CLAUDE.md](../../../CLAUDE.md).

## Khi nào dùng
Viết feature/endpoint/service mới ở backend, hoặc khi phân vân "dự án này quy ước thế nào".

## 1. Layout mỗi service
`config/` · `context/` · `controller/` · `dto/` · `model/` (entity + enum) · `repository/` · `service/` · `exception/`. Base package `com.ldt.<service>`. Enum để **cạnh entity trong `model/`**, không tách `enums/` (trừ vài enum thuần utility như QrCodeType, VnPay*).

## 2. Lấy user hiện tại
Downstream KHÔNG verify JWT. Gateway inject `X-User-Id/Role/Phone`; `ApiSecurityFilter` đẩy vào `UserContext` (ThreadLocal).
```java
String userId = UserContext.getUserId();
String role   = UserContext.getRole();
```

## 3. Gọi service khác (internal)
Dùng `RestTemplate` + header `X-Internal-Secret`, endpoint `/internal/**`. Bên nhận bảo vệ bằng `InternalSecretFilter`. Bắt `HttpClientErrorException` → map `AppException(ErrorCode.X)`.

## 4. Orchestration giao dịch (transaction-service) — 4 pha
Theo `TransactionService2` (engine production; V1 read-only):
1. **Idempotency** — `findByRequestId`; đã SUCCESS/FAILED → trả response cũ, đang PENDING → `DUPLICATE_TRANSACTION`.
2. **Pre-check** — verify PIN (`/internal/users/verify-pin`), batch fetch user, check LOCKED + KYC (`KYC_NOT_VERIFIED` cho sender), tính fee.
3. **Save PENDING** — `saveAndFlush`, bắt `DataIntegrityViolationException` (unique `request_id`) → handle race; ghi history `(null→PENDING)`.
4. **Call wallet + finalize** — gọi wallet (`transfer` / `transfer-with-fee`), set SUCCESS/FAILED + history; `afterCommit` publish ActiveMQ (chỉ SUCCESS, không cho TOPUP).

## 5. Thao tác ví (wallet-service)
- `@Transactional` + `findByUserIdForUpdate` (SELECT FOR UPDATE).
- Lock nhiều ví theo **UUID ascending** tránh deadlock.
- Idempotency check **bên trong lock** (vd `WalletTopupService`).
- Ghi double-entry: mỗi giao dịch tạo các `WalletLedger` entry cùng `transactionId`.

## 6. Exception
```java
throw new AppException(ErrorCode.KYC_NOT_VERIFIED);
```
`ErrorCode` enum giữ (code, message, HttpStatus); `GlobalExceptionHandler` map ra JSON `{code, message}`. Không ném exception trần.

## 7. Tiền & enum
- Tiền: `BigDecimal`, scale 2, `HALF_UP`.
- Enum `@Enumerated(STRING)`. Thêm value → ALTER CHECK constraint thủ công + cập nhật `schema.sql`.

## 8. Cache (user-service)
`@Cacheable(value="users", ...)` cho lookup; mọi chỗ đổi user (đặc biệt `kycStatus`) → `@CacheEvict(value="users", allEntries=true)`.

## 9. Sự kiện bất đồng bộ
Producer `@Async` + `JmsTemplate` gửi `TransactionNotificationEvent` (JSON) lên topic `transaction-notification` (`pub-sub-domain=true`). Consumer ở notification-service → lưu inbox + email + push WebSocket `/topic/notifications/{userId}`.

## 10. Cấu hình & env
`application.yaml` dùng `${VAR:default}`; `EnvLoader` đọc `.env` từ working dir. **Env thật ở root `d:/BE/school-wallet/.env`** (trùm `.env` của từng service). DB mỗi service tách riêng, không FK xuyên service.

## 11. Phân quyền
Admin endpoint: gate ở gateway `SecurityConfig` AND check `UserContext.getRole()` trong controller (defense-in-depth). USER chỉ truy cập tài nguyên của mình; lệch quyền trả `*_NOT_FOUND`.
