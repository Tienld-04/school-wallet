# Trang Profile (Thông tin cá nhân)

**FE:** [font-end/src/pages/Profile.tsx](../font-end/src/pages/Profile.tsx)
**BE chính:** user-service

## Tóm tắt

Trang `/profile` có **3 tab** chia chức năng:

1. **Thông tin** — hiển thị info user + trạng thái KYC.
2. **Đổi mật khẩu** — xem [change-password.md](change-password.md).
3. **Xác minh KYC** — xem [kyc-submit.md](kyc-submit.md).

Tab `info` là default. Khi chọn tab `kyc`, FE lazy-load KYC data nếu user.kycStatus ≠ UNVERIFIED.

## Sequence

```
FE Profile.tsx
 │
 │ Mount: GET /api/v1/users/info
 │ ◄ UserResponse{userId, fullName, phone, email, role, kycStatus, createdAt}
 │
 │ User chọn tab:
 │
 │ tab=info → render từ user state, không call thêm API
 │
 │ tab=password → render form, submit gọi PUT /auth/change-password
 │
 │ tab=kyc:
 │   - Nếu user.kycStatus == UNVERIFIED → render form trống (không call get)
 │   - Else → GET /api/v1/users/kyc → KycResponse
 │     - status=REJECTED: pre-fill form
 │     - status=VERIFIED: hiện thông tin KYC + badge "Đã xác minh"
 │     - status=PENDING: hiện "Đang chờ duyệt"
```

## API gọi

| Path | Khi nào | Mã FE |
|---|---|---|
| `GET /api/v1/users/info` | Mount | `userApi.getInfo()` |
| `PUT /api/v1/auth/change-password` | Submit form đổi mật khẩu | `authApi.changePassword({...})` |
| `GET /api/v1/users/kyc` | Vào tab kyc lần đầu (nếu kycStatus ≠ UNVERIFIED) | `userApi.getMyKyc()` |
| `POST /api/v1/users/kyc` | Submit form KYC | `userApi.submitKyc(form)` |

## Tab "Thông tin"

Hiển thị các trường:
- Họ và tên
- Số điện thoại = Số tài khoản
- Email
- Ngày tạo (formatDate)
- Trạng thái KYC (badge màu — UNVERIFIED xám / PENDING vàng / VERIFIED xanh / REJECTED đỏ)

Avatar = chữ cái đầu tên trên gradient primary.

## Tab "Đổi mật khẩu"

Form 3 field:
- `currentPassword`
- `newPassword` (≥ 6 ký tự)
- `confirmPassword` (phải khớp)

Submit thành công → clear form + hiển thị banner xanh "Đã đổi mật khẩu thành công". Token KHÔNG bị invalidate (vẫn dùng được).

Chi tiết: [change-password.md](change-password.md).

## Tab "Xác minh KYC"

5 trạng thái render khác nhau:

| `user.kycStatus` | Render |
|---|---|
| `UNVERIFIED` | Form trống đầy đủ 6 field |
| `PENDING` | Icon vàng + "Hồ sơ đang chờ admin duyệt" + ngày nộp |
| `VERIFIED` | Banner xanh "Đã xác minh danh tính" + thông tin KYC từ `kycData` |
| `REJECTED` | Banner đỏ + lý do từ chối + form pre-fill cho phép sửa và nộp lại |

Form fields: fullName, dateOfBirth, idNumber, idIssueDate, idIssuePlace, studentCode.

Chi tiết: [kyc-submit.md](kyc-submit.md).

## Side-effects

Tuỳ tab. Tab info: không có. Tab password / kyc xem các doc tương ứng.

## Edge cases

- Nếu user đã VERIFIED nhưng `GET /users/kyc` trả 404 (rare, dữ liệu không nhất quán) → FE silent (`catch {}`).
- Nếu user vừa submit KYC thành công → FE update local state `user.kycStatus = PENDING` để UI render đúng ngay không cần reload.
