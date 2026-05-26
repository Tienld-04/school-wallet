# UC-07: Đăng xuất

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng, Quản trị viên |
| **Mô tả** | Người dùng kết thúc phiên làm việc và thu hồi mã xác thực hiện tại để bảo đảm an toàn cho tài khoản. |
| **Điều kiện trước** | Đã đăng nhập vào hệ thống. |
| **Dòng sự kiện chính** | 1. Người dùng nhấn nút "Đăng xuất" trên giao diện.<br>2. Trình duyệt gửi mã xác thực hiện tại đến hệ thống.<br>3. Hệ thống giải mã token, lấy mã định danh phiên (`jti`) và thời điểm hết hạn, sau đó lưu vào danh sách thu hồi để vô hiệu hóa.<br>4. Trình duyệt xóa mã xác thực khỏi bộ nhớ cục bộ và chuyển người dùng về trang đăng nhập. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Token đã hết hạn hoặc không hợp lệ: hệ thống trả về lỗi nhưng trình duyệt vẫn xóa token cục bộ để đảm bảo người dùng được đăng xuất khỏi thiết bị.<br>**3b.** Token đã có trong danh sách thu hồi từ trước: hệ thống bỏ qua, không thêm trùng và vẫn trả thành công. |
| **Kết quả** | Mã xác thực bị vô hiệu hóa cả phía hệ thống (danh sách thu hồi) và phía thiết bị (xóa khỏi bộ nhớ trình duyệt). Người dùng không thể tiếp tục sử dụng token cũ và phải đăng nhập lại để truy cập các chức năng. |
