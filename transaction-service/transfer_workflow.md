0. Quy trình thực hiện chức năng chuyển tiền
1. Người dùng nhấn chọn chuyển tiền
2. Fe hiển thị from nhập thông tin số điện thoại, số tiền muốn chuyển và mô tả nội dung chuyển tiền
3. Tìm kiếm thông tin người nhận theo số điện thoại
4. Trả về thông tin người nhận bao gồm: số điện thoại, tên, trạng thái
5. người dùng nhấn xác nhận chuyển tiền
6. hệ thống gọi api xác thực transaction_pin
7. người dùng nhập vào mã pin
8. hệ thống kiểm tra mã pin
9. nếu sai -> nhập lại
10. sai quá 5 lần vô hiệu hóa chức năng chuyển tiền
11. nếu đúng lấy thongo tin người gửi và ngươif nhận điều hướng api tới transaction0-service tạo giao dịch
12. transaction-service gọi tới api transfer trong walllet-service
13. nếu số dư đủ cho chuyển tiền và ngược lại nếu sôs dư không đủ.
14. chuyển tiền thành công gọi tới api giao dịch để lưu thông tin giao dịch bao gồm số điện thoại và tên người dùng tài khoản nguồn và đích, số tiền đã chuyển, trạng thái giao dịch, loại giao dịch và mô tả