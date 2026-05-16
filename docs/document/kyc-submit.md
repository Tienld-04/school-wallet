# Nộp hồ sơ KYC

**FE:** [font-end/src/pages/Profile.tsx](../font-end/src/pages/Profile.tsx) (tab "Xác minh KYC")
**BE chính:** user-service

## Tóm tắt

User vào Profile, tab KYC. Tuỳ trạng thái `users.kyc_status`:

- `UNVERIFIED` (mặc định sau đăng ký) → hiện form trống.
- `PENDING` → hiển thị "Hồ sơ đang chờ admin duyệt" + ngày nộp.
- `VERIFIED` → hiển thị badge xanh + thông tin KYC đã duyệt.
- `REJECTED` → hiển thị banner đỏ + lý do từ chối + form pre-fill để user sửa và nộp lại.

User UNVERIFIED hoặc REJECTED submit form → BE tạo/cập nhật `user_kyc` record, set status PENDING → đợi admin duyệt qua [admin-kyc-management.md](admin-kyc-management.md).

## Sequence

```
FE (Profile tab=kyc)             Gateway       user-service
 │                                   │                │
 │ Mount + tab=kyc + user.kycStatus != UNVERIFIED:    │
 │ GET /api/v1/users/kyc                              │
 │ ──────────────────────────────────►── KycService.getMyKyc → KycResponse
 │ ◄ {kycId, status, submittedAt, ...} ─              │
 │ Nếu status=REJECTED → pre-fill form                 │
 │                                                     │
 │ user điền form, submit                             │
 │ POST /api/v1/users/kyc                             │
 │   {fullName, dateOfBirth, idNumber, idIssueDate,   │
 │    idIssuePlace, studentCode}                      │
 │ ──────────────────────────────────►── submitKyc    │
 │                                       - check status điều kiện
 │                                       - check trùng idNumber/studentCode
 │                                       - upsert user_kyc PENDING
 │                                       - users.kyc_status = PENDING
 │ ◄ KycResponse(status=PENDING) ────                 │
 │ FE: setKycData, set user.kycStatus=PENDING (local) │
 │ → re-render hiển thị "Đang chờ duyệt"              │
```

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `GET /api/v1/users/kyc` | — | `userApi.getMyKyc()` |
| `POST /api/v1/users/kyc` | `KycRequest` (xem dưới) | `userApi.submitKyc(form)` |

## Schema FE form

```ts
interface KycRequest {
  fullName: string;
  dateOfBirth: string;     // YYYY-MM-DD (input type=date)
  idNumber: string;
  idIssueDate: string;
  idIssuePlace: string;
  studentCode: string;
  idFrontUrl?: string;     // optional, hiện FE không upload — để null
  idBackUrl?: string;
  studentCardUrl?: string;
}
```

> File upload (CCCD trước/sau, thẻ SV) chưa được implement trong FE hiện tại — 3 field URL được để null. BE entity vẫn có cột để dành.

## Validation FE

```ts
if (!kycForm.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
if (!kycForm.dateOfBirth) errors.dateOfBirth = 'Vui lòng nhập ngày sinh';
if (!kycForm.idNumber.trim()) errors.idNumber = 'Vui lòng nhập số CCCD';
if (!kycForm.idIssueDate) errors.idIssueDate = 'Vui lòng nhập ngày cấp';
if (!kycForm.idIssuePlace.trim()) errors.idIssuePlace = 'Vui lòng nhập nơi cấp';
if (!kycForm.studentCode.trim()) errors.studentCode = 'Vui lòng nhập mã sinh viên';
```

## Logic BE — `KycService.submitKyc(req)`

```java
UUID userId = UUID.fromString(UserContext.getUserId());
User user = userRepository.findById(userId).orElseThrow(USER_NOT_FOUND);

// Pha 1: check trạng thái hiện tại
if (user.kycStatus == VERIFIED) throw KYC_ALREADY_VERIFIED;
if (user.kycStatus == PENDING) throw KYC_PENDING;
// → cho phép UNVERIFIED hoặc REJECTED tiếp tục

// Pha 2: check trùng (cho phép trùng nếu là chính user đang sửa hồ sơ)
if (userKycRepository.existsByIdNumberAndUserIdNot(req.idNumber, userId))
    throw KYC_ID_NUMBER_EXISTS;
if (userKycRepository.existsByStudentCodeAndUserIdNot(req.studentCode, userId))
    throw KYC_STUDENT_CODE_EXISTS;

// Pha 3: upsert UserKyc — nếu đã có (REJECTED) thì update chính bản ghi
UserKyc kyc = userKycRepository.findByUserId(userId)
    .orElse(UserKyc.builder().userId(userId).build());

kyc.setFullName(...);  setDateOfBirth(...);  setIdNumber(...);
kyc.setIdIssueDate(...);  setIdIssuePlace(...);  setStudentCode(...);
kyc.setIdFrontUrl(...);  setIdBackUrl(...);  setStudentCardUrl(...);
kyc.setStatus(PENDING);
kyc.setSubmittedAt(now());
kyc.setVerifiedAt(null);
kyc.setRejectionReason(null);
userKycRepository.save(kyc);

// Pha 4: đồng bộ User
user.setKycStatus(PENDING);
userRepository.save(user);

return toResponse(kyc);
```

## Logic BE — `KycService.getMyKyc()`

```java
UUID userId = UUID.fromString(UserContext.getUserId());
UserKyc kyc = userKycRepository.findByUserId(userId).orElseThrow(KYC_NOT_FOUND);
return toResponse(kyc);
```

User chưa từng nộp KYC → 404 → FE catch silently (`catch {}`).

## State machine KYC

```
                ┌─────────────┐
   register ──►│ UNVERIFIED  │
                └──────┬──────┘
                       │ submitKyc
                       ▼
                ┌─────────────┐    admin reject     ┌──────────┐
                │   PENDING   │ ────────────────► │ REJECTED │
                └──────┬──────┘                    └────┬─────┘
                       │ admin approve                  │
                       ▼                                │
                ┌─────────────┐                         │
                │  VERIFIED   │ ◄───────────── user submitKyc lại
                └─────────────┘                         │
                       (final)                          │
                                                        │
                       ▲                                │
                       └────────── submitKyc ───────────┘
```

## Side-effects

| DB | Bảng | Thay đổi |
|---|---|---|
| user-service | `user_kyc` | INSERT (lần đầu) hoặc UPDATE (resubmit sau REJECTED) |
| user-service | `users.kyc_status` | UPDATE → PENDING |

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `KYC_ALREADY_VERIFIED` | Đã được duyệt rồi |
| `KYC_PENDING` | Đang có hồ sơ chờ duyệt |
| `KYC_ID_NUMBER_EXISTS` | Số CCCD đã được user khác sử dụng |
| `KYC_STUDENT_CODE_EXISTS` | Mã SV đã có user khác dùng |
| `KYC_NOT_FOUND` | Get my KYC khi chưa nộp lần nào |

## Tác động đến chức năng khác

KYC hiện không bị enforce ở các luồng khác (chuyển tiền, thanh toán đều cho phép `UNVERIFIED`). Theo schema comment, KYC là điều kiện cần để dùng tính năng tương lai như "vay vốn"; hiện chỉ là metadata.
