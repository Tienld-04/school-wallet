# UC-06: Quản lí người dùng

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem danh sách người dùng trên hệ thống, tìm kiếm, khóa / mở khóa tài khoản và cấp lại mã OTP giao dịch khi cần. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập với vai trò `ADMIN`. |
| **Dòng sự kiện chính** | 1. Quản trị viên truy cập trang Quản lý người dùng; hệ thống hiển thị danh sách người dùng phân trang kèm bộ lọc trạng thái (Hoạt động / Bị khóa / Tất cả) và ô tìm kiếm theo tên hoặc số điện thoại.<br>2. *(Tìm kiếm)* Quản trị viên nhập từ khóa và/hoặc chọn trạng thái; hệ thống trả về danh sách lọc theo họ tên hoặc số điện thoại (LIKE) và trạng thái.<br>3. *(Khóa / mở khóa)* Quản trị viên nhấn nút Khóa hoặc Mở khóa của một người dùng; hệ thống đảo trạng thái tài khoản (`ACTIVE` ↔ `LOCKED`), nếu mở khóa thì đồng thời đặt lại số lần đăng nhập sai về 0.<br>4. *(Cập nhật mã OTP)* Quản trị viên chọn một người dùng, nhập mã OTP mới 6 chữ số và xác nhận lại; hệ thống cập nhật mã OTP mới (đã băm), đặt lại số lần thử PIN sai và bỏ trạng thái khóa giao dịch (nếu có).<br>5. Hệ thống thông báo kết quả và làm mới danh sách. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Người dùng được chọn là tài khoản quản trị viên: hệ thống không hiển thị nút khóa / mở khóa.<br>**3b.** Không tìm thấy người dùng (đã bị xóa): hệ thống báo lỗi và làm mới danh sách.<br>**4a.** Mã OTP mới không đủ 6 chữ số hoặc xác nhận không khớp: hệ thống không cho gửi yêu cầu.<br>**4b.** Không tìm thấy người dùng theo số điện thoại: hệ thống báo lỗi. |
| **Kết quả** | Danh sách người dùng được cập nhật theo thao tác. Người dùng bị khóa không thể đăng nhập cho đến khi được mở khóa. Người dùng được cấp lại mã OTP có thể thực hiện giao dịch trở lại với mã mới do quản trị viên cung cấp. |
