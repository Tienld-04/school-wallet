# QR Flow (Tạo + Quét)

**FE:**
- [font-end/src/components/qr/MyQrCard.tsx](../font-end/src/components/qr/MyQrCard.tsx) — render QR cá nhân (Static / Dynamic).
- [font-end/src/components/qr/QrScanner.tsx](../font-end/src/components/qr/QrScanner.tsx) — quét bằng camera.
- [font-end/src/components/qr/QrTransferScreen.tsx](../font-end/src/components/qr/QrTransferScreen.tsx) — overlay full-screen có 3 tab (Quét / Tải ảnh / QR của tôi).
- Trigger: nút "Quét mã QR" ở [Transfer.tsx](../font-end/src/pages/Transfer.tsx).

**BE chính:** user-service (sinh + verify QR, ký HMAC-SHA512)

## Tóm tắt

Có 2 loại QR:

| Loại | Có amount? | Có expiredAt? | Use-case |
|---|---|---|---|
| **Static** (`SCHOOL_WALLET_STATIC`) | Không | Không | QR cố định in trên thẻ / dán bàn — người gửi tự nhập amount |
| **Dynamic** (`SCHOOL_WALLET_DYNAMIC`) | Có | 5 phút từ lúc tạo | Người nhận yêu cầu số tiền cụ thể, QR có hạn |

Cả hai đều ký HMAC-SHA512 với `QR_SECRET_KEY` để chống giả mạo. FE encode JSON thẳng thành QR (qrcode.react) và BE verify khi quét.

## Format QR content

### Static

```json
{
  "type": "SCHOOL_WALLET_STATIC",
  "phone": "0901234567",
  "name": "Nguyễn Văn A",
  "sig": "<hex HMAC-SHA512>"
}
```

`sig = HMAC_SHA512(QR_SECRET_KEY, "phone|name")`.

### Dynamic

```json
{
  "type": "SCHOOL_WALLET_DYNAMIC",
  "phone": "0901234567",
  "name": "Nguyễn Văn A",
  "amount": "150000",
  "description": "Trà sữa",
  "expiredAt": 1717000300000,
  "sig": "<hex HMAC-SHA512>"
}
```

`sig = HMAC_SHA512(QR_SECRET_KEY, "phone|name|amount|description|expiredAt")`.

`expiredAt = System.currentTimeMillis() + 5*60*1000` (5 phút).

## Sequence — Tạo QR

```
FE (MyQrCard)              Gateway       user-service
 │                            │                │
 │ tab "static" mount đầu                      │
 │ GET /api/v1/users/my-qr                     │
 │ ──────────────────────────►──── generateMyQr (sign HMAC-SHA512)
 │ ◄ {qrContent: "{json...}"} ──               │
 │ render QRCodeSVG value=qrContent            │
 │                                              │
 │ user nhập amount + description, "Tạo mã"   │
 │ POST /api/v1/users/qr/dynamic                │
 │   {amount, description?}                     │
 │ ──────────────────────────►──── generateDynamicQr
 │ ◄ {qrContent: "{json...}"} ──               │
 │ render QR + countdown 5p                    │
```

## Sequence — Quét QR rồi chuyển tiền

```
FE (QrScanner / Tải ảnh)    Gateway       user-service        transaction-service
 │                              │                                       │
 │ Camera đọc được string QR (JSON) hoặc html5-qrcode.scanFile(file)  │
 │ POST /api/v1/users/qr/verify {qrContent}                            │
 │ ────────────────────────────►── verifyQr                            │
 │                                  - parse JSON                        │
 │                                  - check type whitelist             │
 │                                  - verify HMAC sig                  │
 │                                  - nếu Dynamic: check expiredAt     │
 │ ◄ QrVerifyResponse{phone,name [,amount,description]} ──             │
 │                                                                       │
 │ FE: pre-fill form Transfer (Static) hoặc nhảy thẳng PIN (Dynamic)   │
 │                                                                       │
 │ → tiếp tục flow Chuyển tiền (xem transfer.md)                       │
```

## API gọi

| Path | Mục đích | Auth |
|---|---|---|
| `GET /api/v1/users/my-qr` | Lấy Static QR của user hiện tại | JWT |
| `POST /api/v1/users/qr/dynamic` | Sinh Dynamic QR (body `{amount, description?}`) | JWT |
| `POST /api/v1/users/qr/verify` | Verify QR scanned (body `{qrContent}`) | JWT |

## Logic BE

### `UserService.generateMyQr()`

```java
String userId = UserContext.getUserId();
User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(USER_NOT_FOUND);
String phone = user.getPhone();
String name = user.getFullName();
String sig = hmacSha512(phone + "|" + name, qrSecretKey);
ObjectNode node = objectMapper.createObjectNode();
node.put("type", "SCHOOL_WALLET_STATIC");
node.put("phone", phone);
node.put("name", name);
node.put("sig", sig);
return new QrTransferResponse(objectMapper.writeValueAsString(node));
```

### `UserService.generateDynamicQr(amount, description)`

```java
long expiredAt = System.currentTimeMillis() + 5 * 60 * 1000;
String data = phone + "|" + name + "|" + amountStr + "|" + desc + "|" + expiredAt;
String sig = hmacSha512(data, qrSecretKey);
// build JSON với type=SCHOOL_WALLET_DYNAMIC
```

### `UserService.verifyQr(req)`

```java
JsonNode node = objectMapper.readTree(req.qrContent);
String type = node.path("type").asText();
if (!"SCHOOL_WALLET_STATIC".equals(type) && !"SCHOOL_WALLET_DYNAMIC".equals(type))
    throw QR_INVALID_SYSTEM;

String phone = node.path("phone").asText();
String name  = node.path("name").asText();
String sig   = node.path("sig").asText();

if (DYNAMIC) {
    long expiredAt = node.path("expiredAt").asLong();
    if (System.currentTimeMillis() > expiredAt) throw QR_EXPIRED;
    String expectedSig = hmacSha512(phone+"|"+name+"|"+amount+"|"+desc+"|"+expiredAt, qrSecretKey);
    if (!expectedSig.equals(sig)) throw QR_INVALID;
    return QrVerifyResponse(phone, name, amount, description);
} else {
    String expectedSig = hmacSha512(phone+"|"+name, qrSecretKey);
    if (!expectedSig.equals(sig)) throw QR_INVALID;
    return QrVerifyResponse(phone, name);  // amount/desc null
}
```

## FE — html5-qrcode

`QrScanner` dùng camera (`Html5Qrcode.start({facingMode:'environment'})`). Khi scan thấy text QR → callback `onScan(text)` → `userApi.verifyQr(text)`.

`QrTransferScreen` cũng cho phép upload ảnh QR:
```ts
const html5QrCode = new Html5Qrcode(FILE_CONTAINER_ID);
const text = await html5QrCode.scanFile(file, false);
await handleVerify(text);
```
File ≤ 5MB, chỉ accept image/*.

## FE — Pre-fill Transfer sau verify

Trong `Transfer.tsx`:
```ts
const handleQrVerified = (data: QrVerifyResponse) => {
  setPhone(data.phone);
  setRecipient({ fullName: data.name, phone: data.phone });
  if (data.amount != null) {
    // Dynamic — đã có amount → nhảy thẳng PIN
    setAmount(String(data.amount));
    setDescription(data.description ?? '');
    if (balance < data.amount) toast.error('Số dư không đủ');
    setStep('pin');
  } else {
    // Static — user nhập amount
    setStep('details');
  }
};
```

## Cấu hình env

- `QR_SECRET_KEY` (user-service) — HMAC secret. Đổi key sẽ làm mọi QR cũ invalid.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `QR_INVALID_SYSTEM` | QR không phải hệ thống School Wallet (type không khớp) |
| `QR_INVALID` | sig sai → bị sửa hoặc QR_SECRET_KEY thay đổi |
| `QR_EXPIRED` | Dynamic QR quá 5 phút |
| `QR_FORMAT_ERROR` | Không phải JSON hợp lệ |
| `QR_SIGN_ERROR` | Lỗi HMAC khi sinh (rare) |

## Ghi chú bảo mật

- HMAC-SHA512 chống giả mạo nhưng không chống replay (Static QR có thể quét lại nhiều lần — đó cũng là intent vì static).
- Dynamic QR có `expiredAt` nhưng không có nonce → trong vòng 5 phút có thể quét 2 lần. Idempotency cuối cùng được bảo vệ ở transaction-service bằng `requestId`.
- QR_SECRET_KEY phải khớp giữa các instance user-service nếu chạy nhiều replica.
