---
name: java-code-review
description: Review code Java/Spring Boot của School Wallet — bug, bảo mật, ranh giới transaction, idempotency, xử lý exception, và các "gotcha" đặc thù của dự án (gateway header, internal secret, platform fee, KYC cache, wallet lock). Dùng khi review/sửa code backend trong các service Spring Boot.
---

# Java Code Review — School Wallet

Stack: Spring Boot 3.5.10, Java 21, Spring Data JPA, Spring Security. Đọc [CLAUDE.md](../../../CLAUDE.md) trước khi review.

## Khi nào dùng
Review hoặc tự kiểm tra code backend vừa sửa ở `user/wallet/transaction/notification-service` hoặc `api-gateway`.

## Checklist

### 1. Tính đúng & nghiệp vụ
- [ ] Số tiền dùng `BigDecimal` + `setScale(2, HALF_UP)`; không so sánh bằng `==`.
- [ ] Thao tác tiền **idempotent** theo `requestId`/`transactionId` (check trước khi ghi).
- [ ] Platform fee: chỉ áp `/merchant/payment`; customer trả full amount; edge customer==admin → fee=0.
- [ ] Trạng thái chuyển hợp lệ (PENDING→SUCCESS/FAILED/CANCELLED), có ghi `TransactionStatusHistory`.

### 2. Transaction & concurrency
- [ ] Method ghi DB có `@Transactional`; dùng `findByUserIdForUpdate` (SELECT FOR UPDATE) khi cần lock.
- [ ] Lock nhiều ví theo **UUID ascending** để tránh deadlock (2 ví transfer / 3 ví transfer-with-fee).
- [ ] Không gọi REST ra service khác *bên trong* lock DB lâu (giữ tx ngắn).
- [ ] Publish ActiveMQ event qua `TransactionSynchronization.afterCommit` (chỉ khi SUCCESS), không publish giữa tx.

### 3. Bảo mật
- [ ] Không tự verify JWT ở downstream; chỉ tin `UserContext` từ header gateway.
- [ ] `/internal/**` luôn qua `InternalSecretFilter` (X-Internal-Secret).
- [ ] Password/PIN hash BCrypt; không log/return giá trị nhạy cảm.
- [ ] Endpoint admin check role ở controller (ngoài gate gateway).
- [ ] Ownership: USER chỉ xem được tài nguyên của mình; lệch quyền trả `*_NOT_FOUND` để không leak tồn tại.

### 4. Exception & response
- [ ] Ném `AppException(ErrorCode.X)`, không ném `RuntimeException` trần.
- [ ] `ErrorCode` mới khai báo đủ code + message + HttpStatus; được `GlobalExceptionHandler` map.
- [ ] Gọi service ngoài bắt `HttpClientErrorException`/timeout → map sang ErrorCode rõ ràng (không để 500 thô).

### 5. JPA & dữ liệu
- [ ] Enum `@Enumerated(STRING)`. **Thêm enum value → ALTER CHECK constraint thủ công + cập nhật `schema.sql`** (`ddl-auto=update` không sync CHECK).
- [ ] Audit field (`createdAt/updatedAt/...`) để Spring Data Auditing tự fill, không set tay.
- [ ] Query phân trang trả `PageResponse<T>`; tránh N+1.
- [ ] Không tạo FK xuyên service (mỗi service 1 DB).

### 6. Cache (user-service)
- [ ] Method đổi `kycStatus`/dữ liệu user đã cache phải `@CacheEvict(value="users", allEntries=true)`.

### 7. Sạch & nhất quán
- [ ] Lombok dùng nhất quán; không trùng logic đã có helper.
- [ ] Log level hợp lý (routine = debug, lỗi = warn/error); không log thông tin nhạy cảm.
- [ ] Đọc env qua `${VAR:default}` / `EnvLoader`; nhớ env thật nằm ở **root `.env`**.

## Output review
Phân nhóm theo mức độ: **Bug/Bảo mật (chặn)** → **Cần sửa** → **Nên cải thiện**. Mỗi finding: `file:line`, vì sao sai, cách sửa. Bug về tiền/đồng thời/bảo mật ưu tiên cao nhất.
