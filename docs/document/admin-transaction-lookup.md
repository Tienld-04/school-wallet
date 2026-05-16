# Admin — Tra cứu giao dịch

**FE:** [font-end/src/pages/admin/TransactionLookup.tsx](../font-end/src/pages/admin/TransactionLookup.tsx)
**BE chính:** transaction-service

## Tóm tắt

Trang `/admin/transaction-lookup` cho admin nhập **mã giao dịch (UUID)** để xem chi tiết + lịch sử trạng thái audit trail.

Khác `/transactions` của user thường (chỉ thấy giao dịch của mình), endpoint detail này admin có thể xem **mọi tx**.

## Sequence

```
FE                              Gateway              transaction-service
 │                                  │                       │
 │ User nhập UUID + Search          │                       │
 │ Validate UUID regex client-side                          │
 │                                                           │
 │ GET /api/v1/transactions/detail/{transactionId}          │
 │ ────────────────────────────────►── verify ADMIN          │
 │                                    getTransactionDetail   │
 │                                      - find tx
 │                                      - check ownership (admin pass-all)
 │                                      - load status_history
 │ ◄ TransactionDetailResponse ───                          │
 │                                                           │
 │ Render thông tin GD + timeline status                    │
```

## API gọi

| Path | Mã FE | Auth |
|---|---|---|
| `GET /api/v1/transactions/detail/{transactionId}` | `adminApi.getTransactionDetail(id)` | ADMIN (gateway gate `/transactions/detail/**`) |

## Validation FE

Regex UUID v4:
```ts
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
```

Sai format → `toast.error("Mã giao dịch không hợp lệ (UUID)")` không gọi API.

## Logic BE — `TransactionService.getTransactionDetail(transactionId)`

```java
Transaction tx = transactionRepository.findById(transactionId)
    .orElseThrow(() -> new AppException(TRANSACTION_NOT_FOUND));

boolean isAdmin = "ADMIN".equals(UserContext.getRole());
UUID callerId = UUID.fromString(UserContext.getUserId());
if (!isAdmin && !callerId.equals(tx.fromUserId) && !callerId.equals(tx.toUserId))
    throw TRANSACTION_NOT_FOUND;  // 404 thay vì 403 để không leak existence

BigDecimal displayAmount = null;
if (callerId.equals(tx.fromUserId)) displayAmount = tx.amount.negate();
else if (callerId.equals(tx.toUserId)) displayAmount = tx.amount;
// Nếu là admin không liên quan → displayAmount=null

List<TransactionStatusHistoryResponse> history =
    statusHistoryService.getByTransactionId(transactionId);

return TransactionDetailResponse.builder()
    .transactionId(tx.transactionId)
    .fromFullName, fromPhone, toFullName, toPhone
    .amount  .fee  .displayAmount
    .description  .transactionType  .status  .merchantId  .createdAt
    .statusHistory(history)
    .build();
```

## Status history

`statusHistoryService.getByTransactionId(id)` query bảng `transaction_status_history` order theo `changed_at` ASC. Mỗi row:
```json
{
  "historyId": "...",
  "transactionId": "...",
  "fromStatus": null | "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED",
  "toStatus": "PENDING" | ...,
  "reason": "Khởi tạo / Chuyển tiền thành công / VNPay xác nhận / Người dùng huỷ / ...",
  "changedAt": "2026-04-30T10:15:23"
}
```

Mỗi giao dịch thường có 2-3 row:
- INSERT (`null → PENDING`, "Giao dịch được khởi tạo").
- UPDATE (`PENDING → SUCCESS`, "...thành công") hoặc (`PENDING → FAILED`, error message từ wallet) hoặc (`PENDING → CANCELLED`, "Người dùng hủy").

## FE render

**Thông tin chính:**
- Mã GD (UUID full)
- Loại (TRANSFER / PAYMENT / TOPUP)
- Status badge với chấm màu (xanh/vàng/đỏ/xám)
- Số tiền + phí (nếu có)
- Người gửi: name + phone
- Người nhận: name + phone
- Mô tả
- Merchant ID (nếu PAYMENT)
- Thời gian tạo

**Timeline status history:**
```
2026-04-30 10:15:20  ┃  null → PENDING       Giao dịch được khởi tạo
2026-04-30 10:15:23  ┃  PENDING → SUCCESS    Chuyển tiền thành công
```

## Side-effects

Không có (pure read).

## Endpoint phụ

`GET /api/v1/transactions/{transactionId}/status-history` (admin) — chỉ trả mảng status history, không kèm thông tin tx. FE hiện không dùng nhưng BE có sẵn.

## Bảo mật

- Gateway: `pathMatchers("/api/v1/transactions/detail/**", "/api/v1/transactions/*/status-history").hasAuthority("ADMIN")`.
- Service: defense in depth — non-admin chỉ xem được tx mình tham gia. Tx không tồn tại hoặc không thuộc mình đều trả `TRANSACTION_NOT_FOUND` (404) để tránh leak existence.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `TRANSACTION_NOT_FOUND` | UUID không tồn tại trong DB |
| 403 trên gateway | User không có role ADMIN |
| FE validate UUID fail | Format không phải UUID v4 |
