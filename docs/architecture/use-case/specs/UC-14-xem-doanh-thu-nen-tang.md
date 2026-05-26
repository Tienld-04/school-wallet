# UC-14: Xem doanh thu nền tảng

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem doanh thu phí nền tảng thu được từ các giao dịch thanh toán dịch vụ: chỉ số tổng quan, biểu đồ theo thời gian và phân tích doanh thu theo từng dịch vụ. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập với vai trò `ADMIN`. |
| **Dòng sự kiện chính** | 1. Quản trị viên truy cập trang Doanh thu; hệ thống mặc định lấy dữ liệu trong 30 ngày gần nhất.<br>2. *(Xem KPI tổng quan)* Hệ thống hiển thị các chỉ số doanh thu: tổng phí nền tảng đã thu, số lượng giao dịch phát sinh phí, doanh thu trung bình và mức tăng trưởng so với kỳ trước.<br>3. *(Xem biểu đồ doanh thu theo thời gian)* Hệ thống hiển thị biểu đồ thanh thể hiện doanh thu nền tảng theo thời gian; quản trị viên có thể chọn mức gộp theo ngày, tuần hoặc tháng.<br>4. *(Xem doanh thu theo dịch vụ)* Hệ thống hiển thị biểu đồ tròn và danh sách thống kê doanh thu theo từng dịch vụ (merchant), sắp xếp giảm dần theo doanh thu, kèm tỉ lệ phần trăm đóng góp.<br>5. *(Chọn khoảng thời gian)* Quản trị viên chọn nhanh khoảng thời gian (Hôm nay, 7 ngày, 30 ngày) hoặc tự nhập khoảng tùy chỉnh; hệ thống tự động cập nhật lại toàn bộ KPI và biểu đồ theo khoảng đã chọn. |
| **Dòng sự kiện rẽ nhánh** | **1a.** Người dùng không có vai trò `ADMIN`: hệ thống từ chối truy cập.<br>**3a / 4a.** Không có giao dịch phát sinh phí trong khoảng thời gian đã chọn: hệ thống hiển thị biểu đồ rỗng và thông báo trống.<br>**5a.** Quản trị viên chọn khoảng thời gian không hợp lệ (từ ngày sau ngày đến): hệ thống vẫn gửi yêu cầu nhưng trả về kết quả trống. |
| **Kết quả** | Quản trị viên nắm được tình hình doanh thu của nền tảng, biết được dịch vụ nào đóng góp doanh thu lớn nhất và xu hướng doanh thu theo thời gian, từ đó hỗ trợ ra quyết định kinh doanh và đối soát tài chính. |
