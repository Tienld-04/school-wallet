# Đăng xuất

**FE:** [font-end/src/contexts/AuthContext.tsx](../font-end/src/contexts/AuthContext.tsx) (`logout()`)
trigger từ [font-end/src/layouts/MainLayout.tsx](../font-end/src/layouts/MainLayout.tsx) (nút "Đăng xuất" trong sidebar).
**BE chính:** user-service (blacklist `jti`)

## Tóm tắt

User bấm "Đăng xuất" → FE gọi `POST /auth/logout` gửi kèm token hiện tại → BE parse JWT → lưu `(jti, expiryTime)` vào bảng `invalidated_tokens` → FE xoá `localStorage` → redirect `/login`.

## Sequence

```
FE                 Gateway          user-service
 │ click "Đăng xuất"
 │
 │ POST /auth/logout (body {token})
 │ Authorization: Bearer <token>
 │──────────────────►│ verify JWT (vẫn còn hợp lệ)
 │                   │ AuthGlobalFilter check jti chưa blacklist
 │                   │──────────────────►│ AuthService.logout
 │                   │                   │  parseClaims → jti, exp
 │                   │                   │  insert invalidated_tokens(jti, exp)
 │ ◄ 200 OK ─────────┤◄──────────────────│
 │
 │ removeToken()    → localStorage clear
 │ setTokenState(null)
 │ navigate('/login')
```

> Token vẫn còn hợp lệ về mặt JWT (chưa expire), nhưng kể từ thời điểm này, mọi request mang token đó sẽ bị `AuthGlobalFilter` reject 401 vì user-service trả 401 cho `/internal/users/validate?jti=...`.

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `POST /api/v1/auth/logout` | `{token}` | `authApi.logout(currentToken)` |

`AuthContext.logout` swallow exception (try/catch ignore) — nếu API fail vẫn xoá local token.

## Logic BE — `AuthService.logout(LogoutRequest)`

```java
Claims claims = jwtService.parseClaims(request.getToken());
String jti = claims.getId();
LocalDateTime expiry = claims.getExpiration().toInstant()
        .atZone(ZoneId.systemDefault()).toLocalDateTime();

if (!invalidatedTokenRepository.existsById(jti)) {
    invalidatedTokenRepository.save(new InvalidatedToken(jti, expiry));
}
```

- Nếu token sai/không parse được → throw `UNAUTHENTICATED`.
- Idempotent: cùng jti → skip insert.

## Side-effects

- Bảng `invalidated_tokens` (user-service DB) thêm 1 record `(jti, expiry_time)`.
- localStorage xoá key `school_wallet_token`.

## Cleanup token đã expire

Hiện chưa có cron tự động xoá `invalidated_tokens` quá `expiry_time`. Bảng sẽ tăng trưởng tuyến tính theo số lần logout. Có thể bổ sung sau bằng `@Scheduled` quét và xoá row có `expiry_time < now`.

## Tự động logout khi 401

`axiosClient.interceptors.response` xử lý mọi response 401:
```ts
if (error.response?.status === 401) {
  removeToken();
  window.location.href = '/login';
}
```
Áp dụng khi:
- Token expire (sau 3h).
- Token đã bị blacklist (logout từ tab khác).
- Backend mất khả năng xác minh JWT.
