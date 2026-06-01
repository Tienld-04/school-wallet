---
paths:
  - "wallet-service/**"
---
# Wallet Service — quy tắc

- **wallet-service là source-of-truth số dư.** Mọi thay đổi tiền đi qua `/internal/wallets/*` (`X-Internal-Secret`).
- **Lock ví:** `@Transactional` + `findByUserIdForUpdate` (SELECT FOR UPDATE). Lock nhiều ví theo **UUID ascending** để tránh deadlock (2 ví `transfer`, 3 ví `transfer-with-fee`).
- **Idempotency check BÊN TRONG lock** (vd `WalletTopupService`): acquire row lock trước, check ledger sau → race-safe khi callback retry.
- **Double-entry:** mỗi giao dịch ghi các `WalletLedger` entry cùng `transactionId`; reason theo `LedgerReason`.
- **transfer-with-fee (3-party split):** customer DEBIT full amount, merchant CREDIT `amount-fee`, admin CREDIT `fee` (reason `PLATFORM_FEE`). Edge: platform == merchant/customer hoặc fee==0 → fallback `transfer` thường.
- Tiền dùng `BigDecimal` (scale 2). Reset daily/monthly limit ở giao dịch đầu ngày/tháng.
