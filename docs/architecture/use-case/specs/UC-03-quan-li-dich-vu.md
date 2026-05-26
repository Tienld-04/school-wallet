# UC-03: Quản lí dịch vụ

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên quản lý danh sách các đơn vị cung cấp dịch vụ (merchant) trên hệ thống: tìm kiếm, thêm, sửa, ngừng kích hoạt. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập với vai trò `ADMIN`. |
| **Dòng sự kiện chính** | 1. Quản trị viên truy cập trang Quản lý merchant; hệ thống hiển thị danh sách phân trang kèm bộ lọc theo loại và ô tìm kiếm theo tên.<br>2. Quản trị viên chọn một thao tác: tìm kiếm, thêm, sửa hoặc xóa dịch vụ.<br>3. *(Tìm kiếm)* Quản trị viên nhập từ khóa và/hoặc chọn loại dịch vụ; hệ thống trả về danh sách lọc theo tên (LIKE) và loại.<br>4. *(Thêm)* Quản trị viên nhập tên, chọn loại, nhập số điện thoại chủ dịch vụ; hệ thống kiểm tra tên chưa trùng, tìm chủ sở hữu theo số điện thoại và tạo dịch vụ với trạng thái hoạt động.<br>5. *(Sửa)* Quản trị viên chỉnh sửa thông tin dịch vụ; hệ thống kiểm tra tên không trùng với dịch vụ khác và cập nhật.<br>6. *(Xóa)* Quản trị viên xác nhận xóa; hệ thống ngừng kích hoạt dịch vụ (soft-delete, ẩn khỏi danh sách hiển thị).<br>7. Hệ thống thông báo kết quả và cập nhật lại danh sách. |
| **Dòng sự kiện rẽ nhánh** | **4a / 5a.** Tên dịch vụ đã tồn tại: hệ thống báo lỗi, không lưu.<br>**4b / 5b.** Số điện thoại chủ dịch vụ không tồn tại trong hệ thống: hệ thống báo lỗi.<br>**4c / 5c.** Loại dịch vụ không hợp lệ hoặc dữ liệu sai định dạng: hệ thống hiển thị lỗi tại form.<br>**5d / 6a.** Không tìm thấy dịch vụ cần thao tác: hệ thống báo lỗi.<br>**6b.** Quản trị viên hủy xác nhận xóa: hệ thống không thực hiện thay đổi. |
| **Kết quả** | Danh sách dịch vụ được cập nhật theo thao tác. Dịch vụ bị xóa chuyển sang trạng thái không hoạt động và không xuất hiện trong danh sách hiển thị, nhưng dữ liệu lịch sử vẫn được giữ lại. |
