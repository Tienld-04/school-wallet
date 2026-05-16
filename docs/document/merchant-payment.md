# Thanh toán Merchant (có phí 10%)

**FE:** [font-end/src/pages/Payment.tsx](../font-end/src/pages/Payment.tsx)
**BE:** user-service (verify PIN + batch user + first-admin) + transaction-service (orchestration với fee) + wallet-service (3-party split) + notification-service

## Tóm tắt

User chọn merchant trong danh sách (lọc theo type), thanh toán cho merchant. Khác chuyển tiền P2P:

- **Phí nền tảng (platform fee) 10%** mặc định (`PLATFORM_FEE_RATE=0.10`), được tách ra ghi vào ví **admin** (admin được lấy theo `findFirstByRoleOrderByCreatedAtAsc(ADMIN)`).
- Wallet ledger ghi **3 entries** atomic trong cùng 1 transactionId:
  1. Customer DEBIT FULL `amount` (PAYMENT).
  2. Merchant CREDIT `amount - fee` (PAYMENT).
  3. Admin/platform CREDIT `fee` (PLATFORM_FEE).
- Đặc biệt: merchant `PARKING` có **phí cố định theo khung giờ** (3k/5k/10k) được FE compute, không cho user chỉnh.

## Sequence

```
FE (Payment.tsx)              Gateway        user-service        transaction-service       wallet-service        notification-service
 │                                │                                                                                    │
 │ Mount: gọi song song                                                                                                │
 │  - GET /merchants/types  ──────►──────── trả MerchantType[] (CANTEEN, PARKING, ...)                                 │
 │  - GET /merchants/list?type= ──►──────── trả MerchantListResponse[]                                                 │
 │  - GET /wallets/my-balance  ───►─────────────────────────────────────────────────────► balance                      │
 │                                                                                                                       │
 │ user click merchant → modal "details"                                                                                │
 │  - PARKING: amount auto theo khung giờ (3k ban ngày / 5k tối / 10k đêm), description = "Phí gửi xe ..."             │
 │  - Loại khác: free input                                                                                              │
 │                                                                                                                       │
 │ confirm → modal PIN                                                                                                   │
 │                                                                                                                       │
 │ POST /transactions/merchant/payment {requestId, merchantId, merchantName, merchantPhone, amount, description, pin}  │
 │ ───────────────────────────────────────────────────────────────► TransactionService2.merchantPayment                │
 │                                                                  applyPlatformFee=true → executeTransaction         │
 │ ◄ TransactionResponse(SUCCESS) ──────────────────────────────────│                                                    │
 │                                                                                                                       │
 │ FE: refetch balance + reset modal                                                                                     │
```

## API gọi

| # | Path | Khi nào | Mã FE |
|---|---|---|---|
| 1 | `GET /api/v1/merchants/types` | Mount | `merchantApi.getTypes()` |
| 2 | `GET /api/v1/merchants/list?type=` | Mount + đổi filter | `merchantApi.getList(type)` |
| 3 | `GET /api/v1/wallets/my-balance` | Mount + sau submit | `walletApi.getMyBalance()` |
| 4 | `POST /api/v1/transactions/merchant/payment` | Submit cuối cùng | `transactionApi.merchantPayment({...})` |

`/merchants/list`, `/merchants/types` là **permit-all** (gateway), không cần JWT — list merchant công khai để cả guest có thể xem dịch vụ.

## Validation FE

- `amount >= 1000`, không vượt `balance`.
- PIN: 6 chữ số.
- Với `PARKING`: amount cố định, user không sửa được.

## Logic FE — phí PARKING

```ts
const computeParkingFee = (date = new Date()): {fee, label} => {
  const h = date.getHours();
  if (h >= 6 && h < 18) return { fee: 3000, label: 'Ban ngày (06:00 – 18:00)' };
  if (h >= 18 && h < 22) return { fee: 5000, label: 'Buổi tối (18:00 – 22:00)' };
  return { fee: 10000, label: 'Đêm khuya (22:00 – 06:00)' };
};
```

> Đây là pricing client-side, không có authority — BE không validate. Chỉ phù hợp với project học tập.

## Logic BE — `TransactionService2.merchantPayment`

```java
if (fromPhone.equals(req.getMerchantPhone())) throw SELF_TRANSFER;
String description = req.description != null && !blank
    ? req.description
    : "Thanh toán " + req.merchantName;

return executeTransaction(new TransactionContext(
    requestId, pin,
    fromPhone, merchantPhone,
    amount, description,
    PAYMENT,
    merchantId,            // lưu vào tx.merchantId
    "PAYMENT",             // wallet reason
    "Thanh toán merchant thành công",
    true                   // applyPlatformFee
));
```

### Engine `executeTransaction(ctx)` (giống transfer nhưng có fee)

Pha 1-3: idempotency, verify PIN, batch fetch user — y hệt [transfer.md](transfer.md).

#### Pha 4 — Fetch admin + tính fee

```java
UserInternalResponse admin = fetchFirstAdmin();  // GET /internal/users/first-admin
boolean adminIsCustomer = admin.userId.equals(fromUser.userId);

if (applyPlatformFee && !adminIsCustomer) {
    fee = amount.multiply(feeRate).setScale(2, HALF_UP);  // amount * 0.10
    txAmount = amount;
} else if (applyPlatformFee && adminIsCustomer) {
    // Edge: admin tự thanh toán → bỏ fee
    BigDecimal waivedFee = amount.multiply(feeRate).setScale(2, HALF_UP);
    txAmount = amount.subtract(waivedFee);
    fee = ZERO;
} else {
    fee = ZERO; txAmount = amount;
}
```

`fetchFirstAdmin` gọi `GET <user-service>/internal/users/first-admin` (`findFirstByRoleOrderByCreatedAtAsc(ADMIN)`). Nếu hệ thống chưa có admin → `ADMIN_NOT_CONFIGURED` → `TRANSFER_FAILED`.

#### Pha 5 — Save Transaction PENDING

`tx.amount = txAmount`, `tx.fee = fee` (cột `fee` mới được thêm vào schema).

#### Pha 6 — Gọi wallet 3-party split

Khi `applyPlatformFee=true` và admin ≠ sender:

`POST <wallet-service>/internal/wallets/transfer-with-fee`:
```json
{
  "fromUserId": "<customer>",
  "toUserId": "<merchantOwner>",
  "platformUserId": "<admin>",
  "amount": 100000,
  "fee": 10000,
  "transactionId": "<tx.id>",
  "note": "..."
}
```

`WalletService.transferWithFee`:
1. Idempotency check.
2. Edge: nếu `platformId == fromId || platformId == toId || fee == 0` → fallback xuống `transfer` thường (reason=PAYMENT).
3. Lock 3 ví theo thứ tự UUID ascending (3 elements).
4. Reject nếu bất kỳ ví nào LOCKED.
5. Reset daily/monthly spent của sender nếu sang ngày/tháng mới.
6. Check hạn mức + balance trên FULL `amount` (customer chi 100, không phải 90):
   ```
   dailySpent + amount <= dailyLimit
   monthlySpent + amount <= monthlyLimit
   balance >= amount
   ```
7. Tính `merchantAmount = amount - fee`.
8. Update 3 wallet:
   - `fromWallet.balance -= amount`, dailySpent += amount, monthlySpent += amount.
   - `toWallet.balance += merchantAmount`.
   - `platformWallet.balance += fee`.
9. Ghi 3 ledger entries cùng `transactionId`:
   - Customer: DEBIT amount, reason=PAYMENT.
   - Merchant: CREDIT (amount-fee), reason=PAYMENT.
   - Admin: CREDIT fee, reason=PLATFORM_FEE, note=`"Phí nền tảng giao dịch <tx.id>"`.

Khi `adminIsCustomer` → wallet được gọi `transfer` thường với `txAmount = amount - waivedFee`.

#### Pha 7 — Finalize

Giống transfer P2P. `afterCommit` publish event ActiveMQ → email "Thanh toán thành công" / "Bạn nhận được thanh toán".

## Side-effects DB

Trường hợp 3-party split (case phổ biến):

| DB | Bảng | Thay đổi |
|---|---|---|
| transaction-service | `transactions` | INSERT (`amount = txAmount`, `fee` ≥ 0) |
| transaction-service | `transaction_status_history` | INSERT 2 (PENDING / SUCCESS) |
| wallet-service | `wallets` | UPDATE 3 (customer / merchant / admin) |
| wallet-service | `wallet_ledger` | INSERT **3** (PAYMENT DEBIT, PAYMENT CREDIT, PLATFORM_FEE CREDIT) |
| notification-service | `notification` | INSERT 2 (DEBIT cho sender, CREDIT cho merchant — không gửi cho admin) |
| notification-service | `notification_log` | INSERT 2 EMAIL |

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `SELF_TRANSFER` | Customer phone trùng merchant phone |
| `ADMIN_NOT_CONFIGURED` | Hệ thống chưa có user role=ADMIN |
| `INSUFFICIENT_BALANCE` | Balance < amount (lưu ý: tính trên FULL amount, không phải merchant amount) |
| `DAILY/MONTHLY_LIMIT_EXCEEDED` | Vượt hạn mức |
| `INVALID_PIN`, `PIN_LOCKED` | Sai PIN |
| `WALLET_LOCKED` | Ví customer/merchant/admin bị khoá |

## Cấu hình

- `platform.fee-rate` (`PLATFORM_FEE_RATE` env, default `0.10`).
- Thay đổi runtime cần restart transaction-service.
