# Dashboard (trang chủ user)

**FE:** [font-end/src/pages/Dashboard.tsx](../font-end/src/pages/Dashboard.tsx)
**BE chính:** user-service + wallet-service + transaction-service (3 call song song)

## Tóm tắt

Khi user mở `/dashboard` (sau login), FE gọi đồng thời 3 API qua `Promise.all` để hiển thị:
- Card số dư + thông tin chủ tài khoản.
- 4 nút quick action (Nạp tiền, Chuyển tiền, Thanh toán, Lịch sử).
- Danh sách 5 giao dịch SUCCESS gần nhất.

Số dư có thể ẩn/hiện bằng nút mắt (`showBalance` state, default `false`).

## Sequence

```
FE (Dashboard.tsx)
 │
 │ Promise.all([
 │   userApi.getInfo(),
 │   walletApi.getMyBalance(),
 │   transactionApi.getRecent(),
 │ ])
 │
 ├──── GET /api/v1/users/info        ──► user-service /api/users/info
 ├──── GET /api/v1/wallets/my-balance ──► wallet-service /api/wallets/my-balance
 └──── GET /api/v1/transactions/recent ─► transaction-service /api/transactions/recent
```

## API gọi

| # | Path | Mã FE | BE Service đích | Trả về |
|---|---|---|---|---|
| 1 | `GET /api/v1/users/info` | `userApi.getInfo()` | user-service | `UserResponse{userId,fullName,phone,email,role,kycStatus,createdAt}` |
| 2 | `GET /api/v1/wallets/my-balance` | `walletApi.getMyBalance()` | wallet-service | `BalanceResponse{userId,walletId,balance}` |
| 3 | `GET /api/v1/transactions/recent` | `transactionApi.getRecent()` | transaction-service | `RecentTransactionResponse[]` (top 5 SUCCESS) |

Tất cả đều require JWT (gateway authenticated). User-Id được inject từ JWT claim `sub`.

## Logic BE chi tiết

### 1. `UserService.getUserCurent()`

```java
String userId = UserContext.getUserId();  // header X-User-Id
return userMapper.toUserResponse(userRepository.findById(UUID.fromString(userId))...);
```

### 2. `WalletService.getBalanceByUserId(userId)`

```java
Wallet wallet = walletRepository.findByUserId(UUID.fromString(userId))
    .orElseThrow(() -> new AppException(WALLET_NOT_FOUND));
return BalanceResponse.builder()
    .userId(wallet.getUserId())
    .walletId(wallet.getWalletId())
    .balance(wallet.getBalance())
    .build();
```

### 3. `TransactionService.getRecentTransactions(userId)`

```java
List<Transaction> txs = transactionRepository
    .findTop5ByUserIdAndStatus(userUUID, SUCCESS, PageRequest.of(0, 5));
return txs.stream().map(tx -> {
    boolean outgoing = userUUID.equals(tx.getFromUserId());
    String amount = (outgoing ? "-" : "+") + tx.getAmount().toBigInteger();
    return RecentTransactionResponse(tx.getTransactionId(), tx.getDescription(), amount, tx.getCreatedAt());
}).toList();
```

Sort theo `createdAt` desc trong custom query repository.

## Format hiển thị FE

- `formatAmount("+123000")` → `+123.000` (dấu chấm phân cách hàng nghìn theo locale Vi).
- `formatDate(iso)`:
  - Hôm nay → `"Hôm nay · HH:mm"`.
  - Hôm qua → `"Hôm qua · HH:mm"`.
  - Cũ hơn → `"DD/MM · HH:mm"`.

## State FE

- `loading` true cho đến khi cả 3 call resolve.
- Nếu bất kỳ call nào fail → `toast.error("Không thể tải dữ liệu")` (toàn bộ bị block do `Promise.all`).
- `showBalance` boolean để bật/tắt hiển thị số dư (UX bảo mật khi đứng cạnh người khác).

## Quick actions

Mỗi button navigate tới route tương ứng:
- "Nạp tiền" → `/top-up`
- "Chuyển tiền" → `/transfer`
- "Thanh toán" → `/payment`
- "Lịch sử" → `/transactions`

## Side-effects

Không có (pure read).
