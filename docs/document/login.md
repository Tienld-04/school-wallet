# Đăng nhập

**FE:** [font-end/src/pages/Auth/Login.tsx](../font-end/src/pages/Auth/Login.tsx)
+ [font-end/src/contexts/AuthContext.tsx](../font-end/src/contexts/AuthContext.tsx)
**BE chính:** user-service (issue JWT)

## Tóm tắt

User submit `phone + password` → BE trả `{token}` (JWT HS512, expire **3 giờ**) → FE lưu vào `localStorage` rồi gọi tiếp `GET /users/info` để lấy `role` (xác định USER hay ADMIN) → redirect `/dashboard`.

## Sequence

```
FE (Login.tsx)        Gateway          user-service
 │                       │                   │
 │ POST /auth/login      │                   │
 │──────────────────────►│ permit-all        │
 │                       │──────────────────►│ AuthService.login
 │                       │                   │  - findByPhone
 │                       │                   │  - check status==ACTIVE (LOCKED → throw)
 │                       │                   │  - BCrypt match password
 │                       │                   │    sai → failedLoginCount+1, ≥5 → status=LOCKED
 │                       │                   │  - reset failedLoginCount, lastLoginAt=now
 │                       │                   │  - JwtService.generateToken
 │ ◄ {token} ────────────┤◄──────────────────│
 │                                           │
 │ saveToken(token) → localStorage           │
 │ setTokenState → trigger AuthContext effect│
 │                                           │
 │ GET /users/info       │                   │
 │──────────────────────►│ verify JWT        │
 │                       │ inject X-User-*   │
 │                       │──────────────────►│ getUserCurent → UserResponse
 │ ◄ {userId,role,...} ──┤◄──────────────────│
 │                                           │
 │ setRole(user.role)                        │
 │ navigate('/dashboard')                    │
```

## API gọi

| # | Path | Body / Mã FE | Service đích |
|---|---|---|---|
| 1 | `POST /api/v1/auth/login` | `{phone, password}` qua `authApi.login` (được wrap trong `AuthContext.login`) | user-service |
| 2 | `GET /api/v1/users/info` | `userApi.getInfo()` — gọi tự động bởi `AuthContext.fetchRole` khi token thay đổi | user-service |

## Validation FE

- `validatePhone(form.phone)` — 10 số.
- `validatePassword(form.password)` — ≥ 6 ký tự.

## Logic BE — `AuthService.login`

1. `userRepository.findByPhone(phone)`. Không có → `INVALID_CREDENTIALS`.
2. `user.status == LOCKED` → `ACCOUNT_LOCKED`.
3. `passwordEncoder.matches(rawPassword, user.password)`:
   - **Sai:** `failedLoginCount += 1`. Nếu ≥ 5 → `status = LOCKED`. Save. Throw `INVALID_CREDENTIALS`.
   - **Đúng:** `failedLoginCount = 0`, `lastLoginAt = now`. Save.
4. `JwtService.generateToken(user)`:
   - Algorithm: **HS512**, secret = `JWT_SECRET_KEY`.
   - Claims: `sub = userId`, `role`, `phone`, `jti = UUID`, `iat = now`, `exp = now + 3h`.
5. Return `LoginResponse(token)`.

## JWT payload mẫu

```json
{
  "sub": "9b3a5e0c-1234-5678-90ab-cdef01234567",
  "role": "USER",
  "phone": "0901234567",
  "jti": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "iat": 1717000000,
  "exp": 1717010800
}
```

## AuthContext / FE state

- Sau khi `login` thành công, `AuthContext` set state:
  - `token` (string)
  - `isAuthenticated = true`
  - `role` được fetch async qua `userApi.getInfo()` (vì JWT có chứa role nhưng FE không tự decode — đỡ phụ thuộc thư viện jwt-decode).
- `<MainLayout>` đọc `role` để hiển thị/ẩn menu Admin.

## Side-effects

- DB user-service: `users.failed_login_count`, `users.last_login_at` được update.
- localStorage: `school_wallet_token` chứa JWT.
- Header `Authorization: Bearer <token>` được tự động thêm vào mọi request sau đó (trừ login/register/forgot/otp/topup-ipn vì gateway permit-all).

## Bảo mật phía gateway sau khi login

Mỗi request có JWT đi tới gateway:
1. `SecurityConfig` (Spring WebFlux Resource Server) verify JWT bằng HMAC-SHA512 secret.
2. `AuthGlobalFilter` (order = -1) gọi `GET <user-service>/internal/users/validate?jti=<jti>` (kèm `X-Internal-Secret`):
   - 200 → ok.
   - 401 → token đã logout → throw `UNAUTHENTICATED` → response 401.
3. Strip headers `X-User-*` mà client cố gửi, inject lại từ JWT claims (`sub` → `X-User-Id`, `role`, `phone`).
4. Forward sang service đích.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `INVALID_CREDENTIALS` | Phone không tồn tại hoặc sai password |
| `ACCOUNT_LOCKED` | Đã sai password ≥ 5 lần — admin phải mở khoá tay |
| 401 ở `/users/info` ngay sau login | JWT bị thay đổi hoặc đã logout (rare ngay sau login) |
