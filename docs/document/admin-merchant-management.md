# Admin — Quản lý Merchant

**FE:** [font-end/src/pages/admin/MerchantManagement.tsx](../font-end/src/pages/admin/MerchantManagement.tsx)
**BE chính:** user-service `MerchantController` / `MerchantService`

## Tóm tắt

CRUD merchant cho admin. Mỗi merchant gắn với 1 user (`user_id`) — chính user đó là người nhận tiền khi ai thanh toán cho merchant.

Trang `/admin/merchants` cho phép:
- List + filter type + search by name (phân trang 10/trang).
- Tạo merchant mới.
- Edit merchant (đổi tên, type, hoặc owner phone).
- Xoá merchant (soft delete `active=false`).

## Sequence

```
FE                                Gateway          user-service
 │                                    │                  │
 │ Mount → GET /merchants/types       │                  │
 │       → GET /merchants/list/my-admin?page=&size=&type=&search=
 │ ──────────────────────────────────►── verify ADMIN
 │                                       MerchantService.getMerchants(spec, page)
 │ ◄ Page<MerchantResponse> ──────                       │
 │                                                       │
 │ "Tạo mới" → modal form                                │
 │ POST /merchants/create {name, type, userPhone}       │
 │ ──────────────────────────────────►── createMerchant │
 │                                       (find user by phone, save merchant active=true)
 │                                                       │
 │ "Sửa" → modal pre-filled                              │
 │ PUT /merchants/{merchantId} {name, type, userPhone}  │
 │ ──────────────────────────────────►── updateMerchant │
 │                                                       │
 │ "Xoá" → confirm() → DELETE /merchants/{merchantId}   │
 │ ──────────────────────────────────►── deleteMerchant (soft delete)
 │                                                       │
 │ Sau mỗi action → refetch list                        │
```

## API gọi

| Path | Body | Mã FE | Auth |
|---|---|---|---|
| `GET /api/v1/merchants/types` | — | `merchantApi.getTypes()` | permit-all |
| `GET /api/v1/merchants/list/my-admin?page=&size=&type=&search=` | — | `adminApi.getMerchants(page, size, type, search)` | ADMIN |
| `POST /api/v1/merchants/create` | `{name, type, userPhone}` | `adminApi.createMerchant(data)` | ADMIN |
| `PUT /api/v1/merchants/{merchantId}` | `{name, type, userPhone}` | `adminApi.updateMerchant(id, data)` | ADMIN |
| `DELETE /api/v1/merchants/{merchantId}` | — | `adminApi.deleteMerchant(id)` | ADMIN |

> Có endpoint chi tiết `GET /api/v1/merchants/detail/{id}` dùng trong tương lai (FE hiện chưa dùng).

## Validation FE

```ts
if (!form.name.trim()) errors.name = 'Tên không được trống';
if (!form.type) errors.type = 'Vui lòng chọn loại';
if (!form.userPhone.trim()) errors.userPhone = 'Số điện thoại không được trống';
else if (!/^\d{10}$/.test(form.userPhone)) errors.userPhone = 'Số điện thoại phải có đúng 10 chữ số';
```

## Logic BE

### `MerchantService.getMerchants(page, size, type, search)`

```java
Specification<Merchant> spec = (root, query, cb) -> {
    List<Predicate> ps = new ArrayList<>();
    ps.add(cb.isTrue(root.get("active")));  // chỉ list merchant active
    if (type != null) {
        try {
            MerchantType t = MerchantType.valueOf(type.toUpperCase());
            ps.add(cb.equal(root.get("type"), t));
        } catch (IllegalArgumentException ignored) {}
    }
    if (search != null) {
        ps.add(cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
    }
    return cb.and(...);
};
return repo.findAll(spec, PageRequest.of(page, size, DESC "createdAt")).map(this::toResponse);
```

### `createMerchant(req)`

```java
if (merchantRepository.existsByName(req.name)) throw MERCHANT_NAME_ALREADY_EXISTS;
MerchantType type = parseMerchantType(req.type);  // throw INVALID_MERCHANT_TYPE
User user = userRepository.findByPhone(req.userPhone).orElseThrow(USER_NOT_FOUND);
Merchant m = Merchant.builder()
    .name(req.name).type(type).user(user).active(true).build();
merchantRepository.save(m);
return toResponse(m);
```

### `updateMerchant(merchantId, req)`

```java
Merchant m = repo.findById(merchantId).orElseThrow(MERCHANT_NOT_FOUND);
if (repo.existsByNameAndMerchantIdNot(req.name, merchantId)) throw MERCHANT_NAME_ALREADY_EXISTS;
MerchantType type = parseMerchantType(req.type);
User user = userRepository.findByPhone(req.userPhone).orElseThrow(USER_NOT_FOUND);
m.setName(req.name); m.setType(type); m.setUser(user);
repo.save(m);
return toResponse(m);
```

### `deleteMerchant(merchantId)` — soft delete

```java
Merchant m = repo.findById(merchantId).orElseThrow(MERCHANT_NOT_FOUND);
m.setActive(false);
repo.save(m);
```

> Note: `getMerchants` (admin list) chỉ trả `active=true` → merchant đã xoá biến mất khỏi UI nhưng vẫn còn DB. Có thể bổ sung filter "Đã xoá" sau.

## Public endpoints (cho user thường)

- `GET /api/v1/merchants/list?type=` (permit-all) — `getActiveMerchants` trả `MerchantListResponse[]` (chỉ active=true). Dùng ở trang [merchant-payment.md](merchant-payment.md).
- `GET /api/v1/merchants/types` (permit-all) — list enum type.
- `GET /api/v1/merchants/my-user` (authenticated) — merchant mà user hiện tại đang quản (nếu có).

## MerchantType enum

```
CANTEEN   - Căn tin
PARKING   - Bãi gửi xe
PRINTING  - In ấn
LIBRARY   - Thư viện
BOOKSTORE - Cửa hàng sách
CLUB      - Câu lạc bộ
EVENT     - Sự kiện trường
OTHER     - Loại khác
```

## Side-effects

- Bảng `merchants` INSERT / UPDATE / soft delete.
- Không có thông báo / WebSocket cho merchant CRUD.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `MERCHANT_NAME_ALREADY_EXISTS` | Tên trùng (case-sensitive theo unique constraint thực tế của entity) |
| `MERCHANT_NOT_FOUND` | merchantId sai |
| `INVALID_MERCHANT_TYPE` | type không thuộc enum |
| `USER_NOT_FOUND` | userPhone không tồn tại |
