# UC-08: Xem lịch sử giao dịch

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng, Quản trị viên |
| **Mô tả** | Người dùng xem danh sách giao dịch và biến động số dư ví của chính mình, đồng thời có thể tra cứu chi tiết một giao dịch cụ thể theo mã giao dịch. |
| **Điều kiện trước** | Đã đăng nhập vào hệ thống. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang Lịch sử hoạt động; hệ thống hiển thị danh sách giao dịch (chuyển khoản, thanh toán, nạp tiền) phân trang, gồm: đối tác, số tiền, phí, trạng thái, mã giao dịch và thời gian.<br>2. *(Xem biến động số dư)* Người dùng chuyển sang tab "Biến động số dư"; hệ thống hiển thị các bút toán ghi nhận thay đổi số dư ví (số dư trước / sau, hướng tăng / giảm, lý do, ghi chú).<br>3. *(Tra cứu chi tiết giao dịch)* Từ lịch sử, người dùng sao chép mã giao dịch, mở trang Tra cứu giao dịch, dán mã và nhấn "Tra cứu"; hệ thống xác minh mã hợp lệ, truy vấn chi tiết giao dịch và hiển thị: thông tin chung, người gửi / nhận, phân tích số tiền (gốc – phí – thực nhận) và lịch sử trạng thái theo dòng thời gian.<br>4. Người dùng có thể chuyển trang để xem thêm dữ liệu cũ hơn. |
| **Dòng sự kiện rẽ nhánh** | **1a / 2a.** Người dùng chưa có giao dịch / biến động số dư: hệ thống hiển thị thông báo trống.<br>**3a.** Mã giao dịch không đúng định dạng UUID: hệ thống báo lỗi tại form, không gửi yêu cầu.<br>**3b.** Không tìm thấy giao dịch hoặc giao dịch không thuộc về người dùng: hệ thống hiển thị "Không tìm thấy giao dịch". |
| **Kết quả** | Người dùng nắm được toàn bộ hoạt động tài chính trên ví cá nhân và có thể truy xuất chi tiết từng giao dịch (gồm các bước thay đổi trạng thái) để đối soát hoặc khiếu nại khi cần. |
