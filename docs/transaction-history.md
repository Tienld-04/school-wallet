# Lịch sử giao dịch

**FE:** [font-end/src/pages/TransactionHistory.tsx](../font-end/src/pages/TransactionHistory.tsx)
**BE chính:** transaction-service

## Tóm tắt

Hiển thị toàn bộ giao dịch của user (cả gửi và nhận) — chuyển khoản, thanh toán, nạp tiền — theo thứ tự mới nhất trước, **phân trang 10 record/trang**.

Mỗi item:
- Icon ↑ (chi) / ↓ (nhận) tuỳ `displayAmount` (BE compute).
- Tên + phone đối tác (người nhận nếu chi, người gửi nếu nhận).
- Status badge (SUCCESS / PENDING / FAILED / CANCELLED).
- Mã giao dịch rút gọn `#xxxxxxxx` (8 ký tự đầu UUID), click để copy full UUID.
- Thời gian dạng `DD/MM/YYYY HH:mm`.
- Phí (nếu là khoản merchant CREDIT có fee > 0).

## Sequence

```
FE (TransactionHistory.tsx)
 │
 │ Mount → fetchData(0)
 │ POST /api/v1/transactions/history {page:0, size:10}
 │ ────────────────────────────────────►──── transaction-service
 │                                            TransactionService.getTransactionHistory
 │                                              repository.findByFromUserIdOrToUserId
 │                                              (sort createdAt DESC, paged)
 │ ◄ PageResponse<TransactionHistoryItem> ─
 │
 │ Render bảng + Pagination component
 │
 │ User click sang trang khác → fetchData(newPage) → repeat
```

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `POST /api/v1/transactions/history` | `{page, size}` | `transactionApi.getHistory(page, size)` |

> Endpoint dùng POST với body thay vì GET với query — không thông dụng nhưng hợp lệ.

## Logic BE — `TransactionService.getTransactionHistory(userId, page, size)`

```java
UUID userUUID = UUID.fromString(userId);
Pageable pageable = PageRequest.of(page, size, Sort.by(DESC, "createdAt"));
Page<Transaction> txPage = repo.findByFromUserIdOrToUserId(userUUID, userUUID, pageable);

List<TransactionHistoryResponse> content = txPage.getContent().stream().map(tx -> {
    boolean isOutgoing = userUUID.equals(tx.getFromUserId());
    BigDecimal displayAmount = isOutgoing
        ? tx.getAmount().negate()  // âm = chi
        : tx.getAmount();           // dương = nhận

    return TransactionHistoryResponse.builder()
        .transactionId(tx.transactionId)
        .fromFullName(tx.fromFullName)  .fromPhone(tx.fromPhone)
        .toFullName(tx.toFullName)      .toPhone(tx.toPhone)
        .amount(tx.amount)
        .fee(tx.fee)
        .displayAmount(displayAmount)
        .description(tx.description)
        .transactionType(tx.transactionType.name())
        .status(tx.status.name())
        .merchantId(tx.merchantId)
        .createdAt(tx.createdAt)
        .build();
}).toList();

return PageResponse(content, page, size, totalElements, totalPages);
```

## Hiển thị FE — đọc từ `displayAmount`

```ts
const isCredit = tx.displayAmount > 0;
const counterName = isCredit ? tx.fromFullName : tx.toFullName;
const counterPhone = isCredit ? tx.fromPhone : tx.toPhone;
```

UI:
- `displayAmount > 0` → mũi tên ↓ xanh, "+X.XXX VND".
- `displayAmount < 0` → mũi tên ↑ xám, "-X.XXX VND" (nhưng FE format `Math.abs` rồi prefix dấu).
- Phí hiển thị riêng nếu là khoản nhận có fee (merchant nhận tiền sau khi trừ fee — phần fee đó admin nhận).

## Status badge

```ts
const statusStyle = {
  SUCCESS:   { label: 'Thành công',  bg: 'bg-secondary-50', text: 'text-secondary-700' },
  PENDING:   { label: 'Đang xử lý', bg: 'bg-amber-50',     text: 'text-amber-700' },
  FAILED:    { label: 'Thất bại',   bg: 'bg-red-50',       text: 'text-red-700' },
  CANCELLED: { label: 'Đã hủy',     bg: 'bg-slate-100',    text: 'text-slate-600' },
};
```

## Topup hiển thị thế nào?

Topup có `fromUserId = VNPAY_USER_ID hardcode` và `toUserId = user`. Khi user xem history:
- `isOutgoing = false` (toUserId là user) → `displayAmount > 0`, icon ↓.
- counterName = "VNPay", counterPhone = "VNPay Gateway".
- transactionType = TOPUP → label "Nạp tiền".

## Pagination component

[font-end/src/components/common/Pagination/Pagination.tsx](../font-end/src/components/common/Pagination/Pagination.tsx) — props `{page, totalPages, onPageChange}`.

Footer:
```
Hiển thị 10 / 23 giao dịch                  [<] 1 [2] 3 [>]
```

## Side-effects

Không có (pure read).

## Endpoint chi tiết riêng cho admin

Admin có thêm:
- `GET /api/v1/transactions/detail/{transactionId}` → chi tiết + status history (xem [admin-transaction-lookup.md](admin-transaction-lookup.md)).
- `GET /api/v1/transactions/{transactionId}/status-history` → chỉ list status history.

User thường nếu gọi `/detail/{id}` mà tx không thuộc mình (cả from và to) → BE trả 404 `TRANSACTION_NOT_FOUND` (security).
