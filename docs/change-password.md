# Đổi mật khẩu (đã đăng nhập)

**FE:** [font-end/src/pages/Profile.tsx](../font-end/src/pages/Profile.tsx) (tab "Đổi mật khẩu")
**BE chính:** user-service

## Tóm tắt

User đã đăng nhập, vào trang Profile, tab Password → nhập `currentPassword + newPassword + confirmPassword` → BE verify mật khẩu cũ → update password mới (BCrypt).

## Sequence

```
FE (Profile.tsx)        Gateway          user-service
 │                          │                   │
 │ PUT /auth/change-password
 │ Authorization: Bearer <token>
 │ {currentPassword,newPassword,confirmPassword}
 │─────────────────────────►│ JWT verify        │
 │                          │ X-User-Id inject  │
 │                          │──────────────────►│ AuthService.changePassword
 │                          │                   │  - newPassword == confirmPassword?
 │                          │                   │  - findById (UserContext.userId)
 │                          │                   │  - BCrypt match currentPassword
 │                          │                   │  - user.password = BCrypt(newPassword)
 │                          │                   │  - save
 │ ◄ 200 {message:"Đổi mật khẩu thành công"}    │
 │ FE: hiện success banner, clear form          │
```

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `PUT /api/v1/auth/change-password` | `{currentPassword, newPassword, confirmPassword}` | `authApi.changePassword(...)` |

## Validation FE

- `currentPassword` không trống.
- `newPassword` ≥ 6 ký tự.
- `confirmPassword == newPassword`.

Validation BE độc lập (defense in depth).

## Logic BE — `AuthService.changePassword(ChangePasswordRequest)`

```java
if (!request.getNewPassword().equals(request.getConfirmPassword()))
    throw new AppException(PASSWORD_MISMATCH);

User user = userRepository.findById(UUID.fromString(UserContext.getUserId()))
    .orElseThrow(() -> new AppException(USER_NOT_FOUND));

if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
    throw new AppException(INCORRECT_PASSWORD);

user.setPassword(passwordEncoder.encode(request.getNewPassword()));
userRepository.save(user);
```

## Side-effects

- Bảng `users.password` được cập nhật.
- Token hiện tại **vẫn còn hiệu lực** (không tự logout). Nếu muốn buộc logout sau đổi mật khẩu, cần thêm logic blacklist hoặc rotate jti.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `PASSWORD_MISMATCH` | newPassword ≠ confirmPassword |
| `INCORRECT_PASSWORD` | Mật khẩu hiện tại sai |
| 401 | Token expire / blacklist |
