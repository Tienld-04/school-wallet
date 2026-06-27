---
paths:
  - "user-service/**"
---
# User Service — quy tắc

- **KYC defense-in-depth:** FE có `KycGuard`, BE check `KYC_NOT_VERIFIED` cho sender (ở transaction-service). Mọi chỗ đổi `kycStatus` (`AdminService.approveKyc/rejectKyc`, `KycService.submitKyc`) PHẢI `@CacheEvict(value="users", allEntries=true)` — không evict → cache cũ trả sai trạng thái.
- **Cache lookup:** `InternalUserService.getUserByPhone` `@Cacheable(value="users", ...)` trả full DTO (gồm `kycStatus`).
- **Đăng ký:** tạo `User` (BCrypt password + PIN) rồi gọi `POST /internal/wallets` tạo ví. Non-transactional → wallet-service down có thể tạo user mồ côi (chưa có ví) — ý thức khi vận hành.
- **first-admin:** `GET /internal/users/first-admin` (ADMIN sớm nhất theo `createdAt`) dùng làm ví thu platform fee.
- Enum người dùng (UserRole, UserStatus, KycStatus, MerchantType) ở `model/`; chỉ `QrCodeType` ở `enums/`.
