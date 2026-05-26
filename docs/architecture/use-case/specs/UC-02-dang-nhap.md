# UC-02: Đăng nhập

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng, Quản trị viên |
| **Mô tả** | Người dùng / quản trị viên đăng nhập vào hệ thống bằng số điện thoại và mật khẩu để sử dụng các chức năng yêu cầu xác thực. |
| **Điều kiện trước** | Đã có tài khoản trên hệ thống và trạng thái tài khoản đang hoạt động. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang đăng nhập.<br>2. Người dùng nhập số điện thoại và mật khẩu.<br>3. Hệ thống kiểm tra thông tin đăng nhập (số điện thoại 10 chữ số, mật khẩu ≥ 6 ký tự; tài khoản tồn tại, chưa bị khóa; mật khẩu khớp).<br>4. Hệ thống đặt lại số lần đăng nhập sai về 0, cập nhật thời điểm đăng nhập gần nhất và cấp mã xác thực (JWT).<br>5. Trình duyệt lưu mã xác thực và chuyển sang trang chính tương ứng với vai trò. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Sai định dạng số điện thoại hoặc mật khẩu: hệ thống hiển thị lỗi tại form, không gửi yêu cầu.<br>**3b.** Số điện thoại không tồn tại hoặc mật khẩu sai: hệ thống thông báo "Số điện thoại hoặc mật khẩu không đúng" và tăng số lần sai.<br>**3c.** Sai mật khẩu đủ 5 lần: hệ thống tự động khóa tài khoản.<br>**3d.** Tài khoản đã bị khóa: hệ thống thông báo và yêu cầu liên hệ quản trị viên. |
| **Kết quả** | Người dùng đăng nhập thành công, nhận mã xác thực JWT và truy cập được các chức năng tương ứng với vai trò (Người dùng / Quản trị viên). |
