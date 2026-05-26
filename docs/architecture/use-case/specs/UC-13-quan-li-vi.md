# UC-13: Quản lí ví

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng, Quản trị viên |
| **Mô tả** | Người dùng xem trang tổng quan ví điện tử của mình bao gồm số tài khoản, chủ tài khoản, số dư khả dụng, danh sách giao dịch gần đây và các lối tắt thao tác phổ biến. |
| **Điều kiện trước** | Đã đăng nhập vào hệ thống; tài khoản có ví điện tử (được tạo tự động khi đăng ký). |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang chính (Dashboard); hệ thống hiển thị thẻ thông tin ví gồm số tài khoản, chủ tài khoản và số dư ở trạng thái ẩn (hiển thị dạng dấu chấm).<br>2. Hệ thống đồng thời hiển thị các lối tắt thao tác nhanh (Nạp tiền, Chuyển tiền, Thanh toán, Lịch sử) và danh sách các giao dịch gần đây của ví.<br>3. *(Xem số dư hiện tại)* Người dùng nhấn vào biểu tượng hiện / ẩn để xem chính xác số dư khả dụng của ví; nhấn lại để ẩn đi nhằm bảo mật khi xem ở nơi công cộng. |
| **Dòng sự kiện rẽ nhánh** | **1a.** Không tải được thông tin ví hoặc giao dịch gần đây (lỗi mạng / lỗi hệ thống): hệ thống hiển thị thông báo lỗi.<br>**2a.** Người dùng chưa có giao dịch nào: hệ thống hiển thị thông báo "Chưa có giao dịch nào". |
| **Kết quả** | Người dùng nắm được thông tin tài khoản và số dư ví hiện tại, đồng thời truy cập nhanh đến các chức năng giao dịch chính của hệ thống. |
