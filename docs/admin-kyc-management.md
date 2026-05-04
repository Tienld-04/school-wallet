# Admin — Duyệt KYC

**FE:** [font-end/src/pages/admin/KycManagement.tsx](../font-end/src/pages/admin/KycManagement.tsx)
**BE chính:** user-service `AdminController` / `AdminService`

## Tóm tắt

Trang `/admin/kyc` cho admin xem danh sách KYC đã nộp, lọc theo status (PENDING / VERIFIED / REJECTED / Tất cả), default `PENDING`.

Click vào row → modal chi tiết → admin nhấn:
- **Duyệt** → `PUT /admin/kyc/{kycId}/approve` → set status VERIFIED, đồng bộ `users.kyc_status=VERIFIED`.
- **Từ chối** → nhập lý do → `PUT /admin/kyc/{kycId}/reject` body `{rejectionReason}` → set REJECTED, đồng bộ `users.kyc_status=REJECTED`.

User bị reject có thể vào Profile sửa hồ sơ và submit lại (xem [kyc-submit.md](kyc-submit.md)).

## Sequence

```
FE (KycManagement)         Gateway          user-service
 │                              │                  │
 │ GET /admin/kyc?page=&size=&status=PENDING       │
 │ ────────────────────────────►── verify ADMIN    │
 │                                 getKycList(page, size, status)
 │                                   PageRequest sort submittedAt DESC
 │                                   filter status nếu có
 │ ◄ Page<KycAdminListResponse> ─                  │
 │                                                  │
 │ User click row → modal                          │
 │                                                  │
 │ ┌─ Duyệt:                                       │
 │ │ PUT /admin/kyc/{kycId}/approve                │
 │ │ ──────────────────────────►── approveKyc      │
 │ │                              kyc.status=VERIFIED, verifiedBy=adminId, verifiedAt=now, rejectionReason=null
 │ │                              user.kyc_status=VERIFIED
 │ │ ◄ {message} ─                                 │
 │ └─                                              │
 │                                                  │
 │ ┌─ Từ chối:                                     │
 │ │ Nhập rejectReason                              │
 │ │ PUT /admin/kyc/{kycId}/reject {rejectionReason}│
 │ │ ──────────────────────────►── rejectKyc       │
 │ │                              kyc.status=REJECTED, rejectionReason=..., verifiedBy=adminId, verifiedAt=now
 │ │                              user.kyc_status=REJECTED
 │ │ ◄ {message} ─                                 │
 │ └─                                              │
 │                                                  │
 │ Sau action → close modal + refetch list        │
```

## API gọi

| Path | Body | Mã FE |
|---|---|---|
| `GET /api/v1/admin/kyc?page=&size=&status?=` | — | `adminApi.getKycList(page, size, status)` |
| `PUT /api/v1/admin/kyc/{kycId}/approve` | — | `adminApi.approveKyc(kycId)` |
| `PUT /api/v1/admin/kyc/{kycId}/reject` | `{rejectionReason}` | `adminApi.rejectKyc(kycId, rejectionReason)` |

## Logic BE — `AdminService.getKycList(page, size, status)`

```java
PageRequest pr = PageRequest.of(page, size, Sort.by(DESC, "submittedAt"));
Page<UserKyc> result;
if (status != null && !blank) {
    try {
        KycStatus s = KycStatus.valueOf(status.toUpperCase());
        result = userKycRepository.findAllByStatus(s, pr);
    } catch (IllegalArgumentException ignored) {
        result = userKycRepository.findAll(pr);
    }
} else {
    result = userKycRepository.findAll(pr);
}
return result.map(this::toKycAdminResponse);
```

Response item `KycAdminListResponse`:
```json
{
  "kycId": "...", "userId": "...",
  "fullName": "...", "dateOfBirth": "2002-05-12",
  "idNumber": "079XXXXXXXX", "idIssueDate": "2020-01-15",
  "idIssuePlace": "...", "studentCode": "SV12345",
  "idFrontUrl": null, "idBackUrl": null, "studentCardUrl": null,
  "status": "PENDING|VERIFIED|REJECTED",
  "submittedAt": "...",
  "verifiedBy": null | "<adminUuid>",
  "verifiedAt": null | "...",
  "rejectionReason": null | "..."
}
```

## Logic BE — `approveKyc(kycId)`

```java
@Transactional
UserKyc kyc = userKycRepository.findById(kycId).orElseThrow(KYC_NOT_FOUND);

kyc.setStatus(VERIFIED);
kyc.setVerifiedBy(UUID.fromString(UserContext.getUserId()));
kyc.setVerifiedAt(LocalDateTime.now());
kyc.setRejectionReason(null);
userKycRepository.save(kyc);

userRepository.findById(kyc.getUserId()).ifPresent(user -> {
    user.setKycStatus(VERIFIED);
    userRepository.save(user);
});
```

## Logic BE — `rejectKyc(kycId, rejectionReason)`

```java
@Transactional
UserKyc kyc = userKycRepository.findById(kycId).orElseThrow(KYC_NOT_FOUND);

kyc.setStatus(REJECTED);
kyc.setRejectionReason(rejectionReason);
kyc.setVerifiedBy(UUID.fromString(UserContext.getUserId()));
kyc.setVerifiedAt(LocalDateTime.now());
userKycRepository.save(kyc);

userRepository.findById(kyc.getUserId()).ifPresent(user -> {
    user.setKycStatus(REJECTED);
    userRepository.save(user);
});
```

> Cả approve và reject đều ghi `verifiedBy` + `verifiedAt` (kể cả reject — nghĩa là field "thời điểm xét duyệt" chứ không hẳn là "thời điểm verified").

## FE — Filter tabs

```ts
const filters = [
  { value: 'PENDING',  label: 'Chờ duyệt' },
  { value: 'VERIFIED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: '',         label: 'Tất cả' },
];
```

Default `filterStatus='PENDING'` — admin vào trang là thấy ngay queue cần xử lý.

## FE — Reject UX

- Click "Từ chối" lần 1 → hiện textarea + nút "Gửi lý do".
- Bắt buộc nhập `rejectReason.trim()` không trống → mới gọi API.
- Sau success → close modal, clear reason, refetch list.

## Side-effects

- Bảng `user_kyc` UPDATE status + verified fields.
- Bảng `users.kyc_status` UPDATE đồng bộ.
- KHÔNG có notification gửi tới user khi KYC được duyệt/từ chối — user phải tự vào Profile xem.

## Tác động lan toả

- Hiện chưa có chức năng nào yêu cầu KYC=VERIFIED. Sau này nếu thêm "vay vốn" hoặc tăng hạn mức theo KYC, các check sẽ đọc `users.kyc_status`.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `KYC_NOT_FOUND` | kycId sai |
| 403 | Caller không phải ADMIN |
