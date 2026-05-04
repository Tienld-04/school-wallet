# Nạp tiền (Topup VNPay)

**FE:** [font-end/src/pages/TopUp.tsx](../font-end/src/pages/TopUp.tsx) + [font-end/src/pages/TopUpResult.tsx](../font-end/src/pages/TopUpResult.tsx)
**BE chính:** transaction-service (initiate + IPN handler) + wallet-service (cộng số dư) + VNPay sandbox

## Tóm tắt

Nạp tiền vào ví thông qua **VNPay sandbox** — flow 2 phía:

1. **Phía user (browser):** FE gọi initiate → BE trả `paymentUrl` chứa hash → FE redirect cứng → user thanh toán trên VNPay → VNPay redirect về `/top-up/result` với query string → FE poll status mỗi 2s.
2. **Phía VNPay (server-to-server):** sau khi user thanh toán, VNPay gọi IPN endpoint `GET /transactions/topup/ipn` (gateway permit-all) → BE verify hash → cộng tiền vào ví.

**Lưu ý quan trọng:** số dư chỉ được cộng khi IPN được VNPay gọi **thành công**. Việc redirect về browser KHÔNG cộng tiền (chỉ là UI). Polling từ FE chỉ xem status có chuyển từ PENDING sang SUCCESS hay chưa.

## Sequence

```
┌─ FE phase (browser) ───────────────────────────────────────────────────────────────────┐
│                                                                                          │
│ User /top-up nhập amount + bankCode → submit                                            │
│                                                                                          │
│ POST /transactions/topup/initiate {requestId, amount, bankCode?, language?}             │
│ ──────────────────────► transaction-service.TopupService.initiateTopup                  │
│                          - Save Transaction PENDING (fromUserId = VNPAY_USER_ID hardcode)│
│                          - Build VNPay paymentUrl với HMAC-SHA512                        │
│ ◄ {paymentUrl, requestId} ─────────────                                                  │
│                                                                                          │
│ window.location.href = paymentUrl  → user nhập thẻ trên VNPay sandbox                  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                            VNPay redirect (browser)        VNPay IPN (server-to-server)
                                          │                          │
┌─ FE TopUpResult ─────────────────┐      │      ┌─ BE IPN handler ──┴────────────────────┐
│                                   │      │      │                                          │
│ /top-up/result?vnp_TxnRef=...&    │◄─────┤      │ GET /transactions/topup/ipn?...&         │
│   vnp_ResponseCode=00&...         │      │      │   vnp_SecureHash=...                      │
│                                   │      │      │ ──► topupService.handleIpn(params)       │
│ Polling mỗi 2s:                   │      │      │   1. verifySignature                     │
│  GET /transactions/topup/status? │      │      │   2. find tx by vnp_TxnRef               │
│      requestId={requestId}        │      │      │   3. amount match?                       │
│                                   │      │      │   4. nếu paid (00 + 00):                 │
│  Polling tới khi status final     │      │      │       POST /internal/wallets/topup       │
│  hoặc 15 lần (~30s)               │      │      │       set status=SUCCESS                 │
│                                   │      │      │   5. nếu cancel (24): status=CANCELLED   │
│  Render UI theo status            │      │      │   6. nếu fail khác: status=FAILED        │
│   SUCCESS / FAILED / CANCELLED    │      │      │ ◄── VnPayIpnCode response                │
│                                   │      │      │                                          │
└───────────────────────────────────┘      │      └──────────────────────────────────────────┘
```

## API gọi

| # | Path | Khi nào | Mã FE / VNPay |
|---|---|---|---|
| 1 | `POST /api/v1/transactions/topup/initiate` | User submit form nạp | `transactionApi.initiateTopup({requestId, amount, bankCode?, language})` |
| 2 | `GET https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...` | Browser redirect (không qua gateway) | — |
| 3 | `GET /api/v1/transactions/topup/ipn?vnp_*=...` | VNPay gọi server-to-server | (gateway permit-all → forward) |
| 4 | `GET /api/v1/transactions/topup/status?requestId=` | FE poll mỗi 2s ở `/top-up/result` | `transactionApi.getTopupStatus(requestId)` |

## Validation FE

- Amount ≥ 10,000 và ≤ 100,000,000.
- `requestId` được sinh 1 lần khi mount trang (`useRef(newRequestId())`) — tránh double-submit cùng requestId.

## Bank options FE

```js
const BANK_OPTIONS = [
  { code: '', label: 'VNPay Options' },           // không gắn bankCode → VNPay show toàn bộ
  { code: 'NCB', label: 'Ngân hàng NCB' },        // dùng cho test sandbox
  { code: 'VNBANK', label: 'Thẻ ATM nội địa' },
  { code: 'INTCARD', label: 'Thẻ Visa/Master/JCB' },
];
```

Sandbox NCB test card: `9704 1985 2619 1432 198`, name `NGUYEN VAN A`, exp `07/15`, OTP `123456`.

## Logic BE — `TopupService.initiateTopup(req, userId, userPhone, ipAddr)`

1. **Idempotency check:**
   ```java
   Optional<Transaction> existing = transactionRepository.findByRequestId(requestId);
   if (existing.isPresent()) {
       if (!existing.toUserId.equals(userId)) throw ACCESS_DENIED;
       if (status != PENDING) throw DUPLICATE_TRANSACTION;
       // Status PENDING → tái sinh paymentUrl với cùng amount
       return InitiateTopupResponse(buildPaymentUrl(...));
   }
   ```
2. **Cancel stale PENDING topup** của cùng user (tránh nhiều PENDING tồn kho):
   ```java
   List<Transaction> stale = repo.findByToUserIdAndTransactionTypeAndStatus(userId, TOPUP, PENDING);
   for (tx : stale) {
       tx.setStatus(CANCELLED); save();
       statusHistoryService.record(..., CANCELLED, "Người dùng khởi tạo giao dịch nạp tiền mới");
   }
   ```
3. **Fetch fullName** của user (`GET <user-service>/internal/users/{phone}`) — dùng để snapshot vào tx.
4. **Tạo Transaction PENDING:**
   ```java
   tx.setRequestId(requestId);
   tx.setFromUserId(VNPAY_USER_ID);  // hardcode UUID "0000000e-e000-e000-e000-e00000000000"
   tx.setFromPhone("VNPay Gateway");
   tx.setFromFullName("VNPay");
   tx.setToUserId(userId);
   tx.setToPhone(userPhone);
   tx.setToFullName(toFullName);
   tx.setAmount(amount);
   tx.setFee(BigDecimal.ZERO);
   tx.setTransactionType(TOPUP);
   tx.setStatus(PENDING);
   tx.setDescription("Nạp tiền vào ví qua VNPay");
   transactionRepository.saveAndFlush(tx);
   statusHistoryService.record(tx.id, null, PENDING, "Khởi tạo yêu cầu nạp tiền VNPay");
   ```
5. **Build payment URL** — `VnPayService.buildPaymentUrl(requestId, amount, orderInfo, ipAddr, bankCode, language)`:
   - Sandbox URL từ `VNPAY_PAY_URL` (default `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`).
   - Params chính:
     ```
     vnp_Version=2.1.0
     vnp_Command=pay
     vnp_TmnCode=<VNPAY_TMN_CODE>
     vnp_Amount=<amount * 100>     // VNPay yêu cầu nhân 100
     vnp_CurrCode=VND
     vnp_TxnRef=<requestId>
     vnp_OrderInfo="Nạp tiền vào ví <userPhone>"
     vnp_OrderType=other
     vnp_Locale=vn
     vnp_ReturnUrl=<VNPAY_RETURN_URL>  // default http://localhost:3000/top-up/result
     vnp_IpAddr=<resolveClientIp>
     vnp_CreateDate=<now Asia/HoChiMinh>
     vnp_ExpireDate=<now + 10 phút>
     vnp_BankCode=<optional>
     ```
   - Sort key tăng dần, URL-encode value, build `hashData = key1=v1&key2=v2&...`.
   - `vnp_SecureHash = HMAC_SHA512(VNPAY_HASH_SECRET, hashData)`.
   - URL final = `payUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash`.

`resolveClientIp(req)`: ưu tiên `X-Forwarded-For` (từ proxy/gateway), fallback `req.getRemoteAddr()`. IPv6 → mặc định `127.0.0.1` (VNPay yêu cầu IPv4).

## Logic BE — IPN handler `TopupService.handleIpn(params)`

```java
@Transactional
public VnPayIpnResponse handleIpn(Map<String, String> params) {
    // 1. Verify HMAC-SHA512
    if (!vnPayService.verifySignature(params))
        return INVALID_SIGNATURE.toResponse();

    // 2. Tìm tx theo vnp_TxnRef = requestId
    String txnRef = params.get("vnp_TxnRef");
    Transaction tx = repo.findByRequestId(txnRef).orElse(null);
    if (tx == null) return ORDER_NOT_FOUND.toResponse();

    // 3. So sánh amount
    BigDecimal vnpAmount = new BigDecimal(params.get("vnp_Amount")).divide(BigDecimal.valueOf(100));
    if (vnpAmount.compareTo(tx.amount) != 0) return INVALID_AMOUNT.toResponse();

    // 4. Đã xử lý rồi → idempotent
    if (tx.status != PENDING) return ALREADY_CONFIRMED.toResponse();

    // 5. Phân biệt paid / cancel / fail
    String responseCode = params.get("vnp_ResponseCode");
    String txnStatus = params.get("vnp_TransactionStatus");
    boolean paid = "00".equals(responseCode) && "00".equals(txnStatus);

    if (paid) {
        try {
            creditWallet(tx);  // POST /internal/wallets/topup
            tx.status = SUCCESS;
            statusHistoryService.record(..., SUCCESS, "VNPay xác nhận thanh toán thành công");
        } catch (Exception e) {
            tx.status = FAILED;
            return CREDIT_WALLET_FAILED.toResponse();
        }
    } else {
        boolean cancelled = "24".equals(responseCode);  // user huỷ
        tx.status = cancelled ? CANCELLED : FAILED;
        statusHistoryService.record(..., status, mapVnpayCodeToReason(responseCode, txnStatus));
    }
    return SUCCESS.toResponse();
}
```

`creditWallet(tx)` → `POST <wallet-service>/internal/wallets/topup`:
```json
{ "toUserId": "...", "amount": 100000, "transactionId": "<tx.id>", "note": "Nap tien VNPay - <requestId>" }
```

`WalletTopupService.topup`:
1. Validate `amount > 0`.
2. Lock ví `findByUserIdForUpdate`.
3. Idempotency: nếu đã có ledger với cùng `transactionId` → return ok.
4. `wallet.balance += amount`, ghi ledger `direction=CREDIT, reason=TOP_UP`.

## Map mã VNPay → reason

`mapVnpayCodeToReason(responseCode, txnStatus)`:

| Mã | Diễn giải |
|---|---|
| 24 | Người dùng hủy giao dịch |
| 09 | Thẻ chưa đăng ký Internet Banking |
| 11 | Hết hạn chờ thanh toán |
| 10 | Xác thực thẻ không thành công quá 3 lần |
| 12 | Thẻ bị khóa |
| 13 | OTP không chính xác |
| 51 | Tài khoản không đủ số dư |
| 65 | Vượt hạn mức trong ngày |
| 75 | Ngân hàng đang bảo trì |
| 79 | Sai mật khẩu thanh toán quá số lần |
| khác | "VNPay từ chối: code=X status=Y" |

## Logic BE — `getStatus(requestId, userId)` (FE polling)

```java
Transaction tx = repo.findByRequestId(requestId).orElseThrow(TRANSACTION_NOT_FOUND);
if (!tx.toUserId.toString().equals(userId)) throw ACCESS_DENIED;
String message = switch (tx.status) {
    case SUCCESS  -> "Nạp tiền thành công";
    case FAILED   -> "Nạp tiền thất bại";
    case PENDING  -> "Đang chờ xác nhận từ VNPay";
    case CANCELLED-> "Bạn đã hủy giao dịch nạp tiền";
};
return TopupStatusResponse(requestId, transactionId, status, amount, description, message, createdAt);
```

## Polling FE

```ts
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;  // ~30s tổng

const fetchStatus = async () => {
  const data = await transactionApi.getTopupStatus(requestId);
  setStatus(data);
  if (data.status === 'SUCCESS' || data.status === 'FAILED' || data.status === 'CANCELLED') return;
  attempts++;
  if (attempts >= POLL_MAX_ATTEMPTS) { setPolling(false); return; }
  setTimeout(fetchStatus, POLL_INTERVAL_MS);
};
```

Sau 15 lần vẫn PENDING → ngừng poll, hiển thị "Hệ thống chưa nhận được xác nhận. Vui lòng kiểm tra Lịch sử giao dịch sau ít phút."

FE cũng ưu tiên `vnp_ResponseCode` từ query string để render UI sớm (không đợi poll thành công đầu tiên).

## Side-effects DB

| DB | Bảng | Pha | Thay đổi |
|---|---|---|---|
| transaction-service | `transactions` | initiate | INSERT 1 (PENDING) |
| transaction-service | `transaction_status_history` | initiate | INSERT 1 (`null→PENDING`) |
| transaction-service | `transactions` | IPN | UPDATE status (PENDING → SUCCESS/FAILED/CANCELLED) |
| transaction-service | `transaction_status_history` | IPN | INSERT 1 |
| wallet-service | `wallets` | IPN paid | UPDATE balance |
| wallet-service | `wallet_ledger` | IPN paid | INSERT 1 (CREDIT, TOP_UP) |

**Lưu ý:** topup KHÔNG publish `TransactionNotificationEvent` (xem `TopupService.handleIpn` — có `// TODO: Using ActiveMQ push notification...`). Nên user nạp tiền không nhận email/inbox.

## Cấu hình env

| Var | Mô tả |
|---|---|
| `VNPAY_TMN_CODE` | Mã merchant VNPay |
| `VNPAY_HASH_SECRET` | Secret để HMAC-SHA512 |
| `VNPAY_PAY_URL` | Default `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | Default `http://localhost:3000/top-up/result` |
| `VNPAY_VERSION` | `2.1.0` |

## Stale topup cleanup

`TopupCleanupScheduler` đang **comment-out** toàn bộ. Mỗi lần initiate sẽ tự cancel mọi PENDING cũ của user; ngoài cơ chế này, các tx PENDING không bị clean up tự động.
