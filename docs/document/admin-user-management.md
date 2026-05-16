# Admin — Quản lý người dùng

**FE:** [font-end/src/pages/admin/UserManagement.tsx](../font-end/src/pages/admin/UserManagement.tsx)
**BE chính:** user-service `AdminController` / `AdminService`

## Tóm tắt

Trang `/admin/users` cho admin:
- Xem danh sách user phân trang 10/trang.
- Lọc theo trạng thái `ACTIVE` / `LOCKED`.
- Tìm theo tên hoặc số điện thoại (LIKE).
- Toggle khoá/mở khoá tài khoản từng user.

## Sequence

```
FE                                Gateway          user-service
 │                                    │                  │
 │ Mount + filter/search/page change  │                  │
 │ GET /api/v1/admin/users            │                  │
 │   ?page=&size=10&status=&search=   │                  │
 │ ──────────────────────────────────►── verify ADMIN    │
 │                                       AdminService.getUsers
 │                                         JpaSpecification:
 │                                           status=:status
 │                                           AND (LOWER(fullName) LIKE :s OR phone LIKE :s)
 │                                       sort createdAt DESC
 │ ◄ Page<UsersResponse> ─────                          │
 │                                                       │
 │ User click "Khoá" hoặc "Mở khoá":                    │
 │ PUT /api/v1/admin/users/{userId}/toggle-status        │
 │ ──────────────────────────────────►── toggleUserStatus
 │                                       (ACTIVE↔LOCKED)
 │ ◄ {message} ─────────────                            │
 │ FE: refetch list                                     │
```

## API gọi

| Path | Body / Params | Mã FE | Auth |
|---|---|---|---|
| `GET /api/v1/admin/users` | `?page&size&status?&search?` | `adminApi.getUsers(page, size, status, search)` | ADMIN |
| `PUT /api/v1/admin/users/{userId}/toggle-status` | — | `adminApi.toggleUserStatus(userId)` | ADMIN |

Endpoint phụ có sẵn (FE chưa dùng):
- `GET /api/v1/admin/user-statuses` — list enum status.
- `PUT /api/v1/admin/reset-pin` body `{phone, newPin}` — admin reset PIN giao dịch.

## Logic BE — `AdminService.getUsers(page, size, status, search)`

```java
Specification<User> spec = (root, query, cb) -> {
    List<Predicate> ps = new ArrayList<>();
    if (status != null && !blank) {
        try {
            UserStatus s = UserStatus.valueOf(status.toUpperCase());
            ps.add(cb.equal(root.get("status"), s));
        } catch (IllegalArgumentException ignored) {}
    }
    if (search != null && !blank) {
        String pattern = "%" + search.toLowerCase() + "%";
        ps.add(cb.or(
            cb.like(cb.lower(root.get("fullName")), pattern),
            cb.like(root.get("phone"), pattern)
        ));
    }
    return cb.and(ps.toArray(new Predicate[0]));
};
PageRequest pr = PageRequest.of(page, size, Sort.by(DESC, "createdAt"));
return userRepository.findAll(spec, pr).map(userMapper::toUsersResponse);
```

`UsersResponse` schema:
```json
{ "userId":"...", "fullName":"...", "phone":"...", "email":"...", "role":"USER|ADMIN", "status":"ACTIVE|LOCKED" }
```

## Logic BE — `AdminService.toggleUserStatus(userId)`

```java
User user = userRepository.findById(userId).orElseThrow(USER_NOT_FOUND);
if (user.status == ACTIVE) {
    user.setStatus(LOCKED);
} else {
    user.setStatus(ACTIVE);
    user.setFailedLoginCount(0);  // mở khoá kèm reset login attempts
}
userRepository.save(user);
```

> Toggle này không reset `pinFailedAttempts` hoặc `pinLockedUntil`. Nếu user bị khoá PIN, admin phải dùng `reset-pin` riêng.

## FE — Filter UX

```ts
<select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
  <option value="">Tất cả trạng thái</option>
  <option value="ACTIVE">Hoạt động</option>
  <option value="LOCKED">Bị khóa</option>
</select>
```

Search là form submit, không debounce — `onSubmit` set `search` state, `useCallback` re-fire fetch.

## FE — Toggle action

```ts
const handleToggleStatus = async (userId: string) => {
  setToggling(userId);
  try {
    await adminApi.toggleUserStatus(userId);
    toast.success('Cập nhật trạng thái thành công');
    fetchUsers();  // refetch list
  } catch {
    toast.error('Cập nhật trạng thái thất bại');
  } finally {
    setToggling(null);
  }
};
```

UI hiển thị spinner cho row đang toggle.

## Side-effects

- Bảng `users.status` UPDATE.
- Nếu mở khoá: `failed_login_count = 0`.

## Tác động lan toả

- User LOCKED không login được (`AuthService.login` check status).
- User LOCKED không là recipient hợp lệ:
  - `getRecipientByPhone` throw `RECIPIENT_LOCKED`.
  - Trong transaction-service, sender/receiver LOCKED → reject ở pha 3 của engine.
- Token JWT đang sống vẫn pass `AuthGlobalFilter` (filter chỉ check blacklist `jti` chứ không check `users.status`). User LOCKED giữ session đến khi logout / token expire / admin force restart.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `USER_NOT_FOUND` | UUID sai |
| 403 | Caller không phải ADMIN |
