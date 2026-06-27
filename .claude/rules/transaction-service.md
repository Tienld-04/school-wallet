---
paths:
  - "transaction-service/**"
---
# Transaction Service — quy tắc

- **`TransactionService2` là engine production** (V1 `TransactionService` read-only). Orchestration 4 pha:
  1. Idempotency `findByRequestId` (đã SUCCESS/FAILED → trả response cũ; PENDING → `DUPLICATE_TRANSACTION`).
  2. Pre-check: verify PIN (`/internal/users/verify-pin`), batch fetch user, reject LOCKED, check `KYC_NOT_VERIFIED` cho **sender**, tính fee.
  3. Save PENDING `saveAndFlush` (bắt `DataIntegrityViolationException` do unique `request_id` → handle race) + ghi `TransactionStatusHistory`.
  4. Call wallet (`transfer` / `transfer-with-fee`) + finalize SUCCESS/FAILED + history.
- **Idempotency:** `requestId` do FE generate, unique.
- **Platform fee:** `platform.fee-rate=0.10`, **chỉ** `/merchant/payment`. Customer trả full amount; edge customer==admin → fee waive về 0, đi `transfer` thường.
- **ActiveMQ:** publish `TransactionNotificationEvent` ở `TransactionSynchronization.afterCommit` — **chỉ khi SUCCESS, KHÔNG cho TOPUP**.
- **TOPUP:** `fromUserId` dùng sentinel UUID `0000000e-e000-e000-e000-e00000000000`. `TopupCleanupScheduler` đang **DISABLED**.
- Tiền dùng `BigDecimal` scale 2 HALF_UP. Ném `AppException(ErrorCode.X)`.
