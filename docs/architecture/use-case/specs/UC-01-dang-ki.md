# UC-01: Đăng kí

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (chưa có tài khoản) |
| **Mô tả** | Người dùng tạo tài khoản mới bằng số điện thoại có xác thực OTP; hệ thống tự động tạo ví điện tử mặc định. |
| **Điều kiện trước** | Chưa có tài khoản; số điện thoại nhận được SMS. |
| **Dòng sự kiện chính** | 1. Người dùng nhập số điện thoại; hệ thống kiểm tra số điện thoại hợp lệ, chưa đăng ký và gửi mã OTP qua SMS.<br>2. Người dùng nhập mã OTP; hệ thống xác thực OTP và cấp mã xác thực tạm thời.<br>3. Người dùng nhập họ tên, email, mật khẩu, mã PIN giao dịch.<br>4. Hệ thống kiểm tra định dạng dữ liệu, mã xác thực còn hiệu lực và email chưa được sử dụng, sau đó tạo tài khoản và sinh ví điện tử số dư 0 VND.<br>5. Hệ thống thông báo đăng ký thành công, chuyển sang trang đăng nhập. |
| **Dòng sự kiện rẽ nhánh** | **1a.** Số điện thoại sai định dạng, đã được đăng ký hoặc đang trong thời gian chờ gửi lại OTP: hệ thống báo lỗi.<br>**2a.** Mã OTP sai, hết hạn hoặc vượt số lần thử cho phép: hệ thống yêu cầu nhập lại hoặc gửi OTP mới.<br>**4a.** Dữ liệu form sai định dạng, email đã tồn tại hoặc mã xác thực không hợp lệ / hết hạn: hệ thống báo lỗi, yêu cầu kiểm tra lại.<br>**4b.** Tạo ví thất bại: hệ thống rollback, không tạo tài khoản. |
| **Kết quả** | Tài khoản được tạo (trạng thái `ACTIVE`, KYC `UNVERIFIED`), ví điện tử số dư 0 VND. Người dùng có thể đăng nhập. |
