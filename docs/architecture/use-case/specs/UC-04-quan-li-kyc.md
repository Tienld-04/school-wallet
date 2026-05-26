# UC-04: Quản lí xác minh danh tính

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem và xử lý các hồ sơ xác minh danh tính (KYC) do người dùng nộp lên: xem chi tiết, duyệt hoặc từ chối. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập với vai trò `ADMIN`. Tồn tại ít nhất một hồ sơ KYC trong hệ thống. |
| **Dòng sự kiện chính** | 1. Quản trị viên truy cập trang Quản lý KYC; hệ thống hiển thị danh sách phân trang với bộ lọc trạng thái (Chờ duyệt / Đã xác minh / Bị từ chối / Tất cả), mặc định lọc "Chờ duyệt".<br>2. Quản trị viên chọn một hồ sơ và nhấn "Xem chi tiết".<br>3. *(Xem chi tiết)* Hệ thống mở cửa sổ hiển thị đầy đủ thông tin: họ tên, ngày sinh, số CCCD, ngày cấp, nơi cấp, quê quán, địa chỉ thường trú, ảnh CCCD mặt trước/sau, trạng thái, ngày nộp / ngày duyệt / lý do từ chối (nếu có).<br>4. *(Duyệt)* Nếu hồ sơ đang chờ duyệt, quản trị viên nhấn "Duyệt KYC"; hệ thống cập nhật trạng thái hồ sơ thành `VERIFIED`, ghi nhận người duyệt và thời điểm duyệt, đồng thời cập nhật KYC của người dùng thành đã xác minh.<br>5. *(Từ chối)* Nếu hồ sơ đang chờ duyệt, quản trị viên nhấn "Từ chối", nhập lý do và xác nhận; hệ thống cập nhật hồ sơ thành `REJECTED` kèm lý do, đồng thời cập nhật KYC của người dùng thành từ chối.<br>6. Hệ thống thông báo kết quả và làm mới danh sách. |
| **Dòng sự kiện rẽ nhánh** | **4a / 5a.** Hồ sơ đã được duyệt hoặc từ chối trước đó: hệ thống không hiển thị các nút thao tác, quản trị viên chỉ có thể xem chi tiết.<br>**5b.** Quản trị viên không nhập lý do từ chối: hệ thống vô hiệu hóa nút xác nhận, không gửi yêu cầu.<br>**4b / 5c.** Không tìm thấy hồ sơ KYC (đã bị xóa): hệ thống báo lỗi và làm mới danh sách. |
| **Kết quả** | Hồ sơ KYC chuyển sang trạng thái `VERIFIED` hoặc `REJECTED` với thông tin người duyệt, thời điểm duyệt và lý do từ chối (nếu có). Trạng thái KYC của người dùng tương ứng được cập nhật, cho phép hoặc chặn các giao dịch yêu cầu xác minh danh tính. |
