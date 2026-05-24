# Đặc tả chi tiết Use Case — Hệ thống School Wallet

Tài liệu mô tả chi tiết từng Use Case của hệ thống School Wallet, được sử dụng kèm với [biểu đồ Use Case tổng quát](./use-case-diagram.puml).

## Danh sách Use Case

| Mã | Tên Use Case | Tác nhân chính |
|---|---|---|
| **A. Trước đăng nhập** | | |
| UC-01 | Đăng ký tài khoản | Người dùng |
| UC-02 | Đăng nhập | Người dùng |
| UC-03 | Quên mật khẩu | Người dùng |
| **B. Quản lý tài khoản cá nhân** | | |
| UC-04 | Đăng xuất | Người dùng |
| UC-05 | Xem trang chính (Dashboard) | Người dùng |
| UC-06 | Đổi mật khẩu | Người dùng |
| UC-07 | Đổi mã PIN giao dịch | Người dùng |
| UC-08 | Cập nhật KYC | Người dùng |
| UC-09 | Quản lý mã QR cá nhân | Người dùng |
| **C. Giao dịch tài chính** | | |
| UC-10 | Nạp tiền qua VNPay | Người dùng |
| UC-11 | Chuyển tiền qua số điện thoại | Người dùng |
| UC-12 | Chuyển tiền qua mã QR | Người dùng |
| UC-13 | Thanh toán dịch vụ | Người dùng |
| **D. Tra cứu & Thông báo** | | |
| UC-14 | Xem lịch sử giao dịch | Người dùng |
| UC-15 | Tra cứu giao dịch theo mã | Người dùng |
| UC-16 | Xem thông báo | Người dùng |
| **E. Chủ dịch vụ** | | |
| UC-17 | Xem danh sách dịch vụ sở hữu | Chủ dịch vụ |
| UC-18 | Xem doanh thu dịch vụ sở hữu | Chủ dịch vụ |
| **F. Quản trị viên** | | |
| UC-19 | Quản lý người dùng | Quản trị viên |
| UC-20 | Khóa / mở khóa tài khoản | Quản trị viên |
| UC-21 | Cấp lại mã PIN | Quản trị viên |
| UC-22 | Quản lý KYC | Quản trị viên |
| UC-23 | Quản lý dịch vụ | Quản trị viên |
| UC-24 | Xem thống kê giao dịch | Quản trị viên |
| UC-25 | Xem doanh thu nền tảng | Quản trị viên |

---

## A. Use Case trước đăng nhập

### UC-01: Đăng ký tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (chưa có tài khoản) |
| **Mô tả** | Người dùng đăng ký tài khoản mới bằng số điện thoại và mã OTP để có thể sử dụng hệ thống School Wallet. |
| **Điều kiện trước** | Người dùng chưa có tài khoản. Số điện thoại có khả năng nhận tin nhắn SMS. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang đăng ký.<br>2. Người dùng nhập số điện thoại và yêu cầu gửi mã OTP.<br>3. Hệ thống gửi mã OTP đến số điện thoại qua SMS.<br>4. Người dùng nhập mã OTP để xác thực.<br>5. Hệ thống xác minh mã OTP và cấp mã xác thực tạm thời.<br>6. Người dùng nhập họ tên, email, mật khẩu và mã PIN giao dịch.<br>7. Hệ thống kiểm tra số điện thoại / email chưa được đăng ký.<br>8. Hệ thống tạo tài khoản người dùng và sinh ví điện tử mặc định (số dư = 0).<br>9. Hệ thống thông báo đăng ký thành công và chuyển sang trang đăng nhập. |
| **Dòng sự kiện rẽ nhánh** | **2a.** Yêu cầu OTP quá sớm (trong thời gian chờ): hệ thống từ chối, hiển thị thông báo "Vui lòng đợi trước khi gửi lại".<br>**4a.** Mã OTP không đúng: hệ thống tăng số lần thử sai, yêu cầu nhập lại.<br>**4b.** Mã OTP đã hết hạn: hệ thống yêu cầu gửi lại OTP mới.<br>**4c.** Vượt quá số lần thử cho phép: hệ thống từ chối, yêu cầu gửi lại OTP mới.<br>**7a.** Số điện thoại hoặc email đã được đăng ký: hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại. |
| **Kết quả** | Tài khoản người dùng được tạo trong cơ sở dữ liệu với trạng thái `ACTIVE`, KYC `UNVERIFIED`. Ví điện tử được tạo tự động với số dư 0 VND. Người dùng có thể đăng nhập. |

---

### UC-02: Đăng nhập

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã có tài khoản) |
| **Mô tả** | Người dùng đăng nhập vào hệ thống để sử dụng các chức năng cần xác thực. |
| **Điều kiện trước** | Người dùng đã có tài khoản với trạng thái `ACTIVE`. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang đăng nhập.<br>2. Người dùng nhập số điện thoại và mật khẩu.<br>3. Hệ thống kiểm tra dữ liệu đầu vào (số điện thoại 10 chữ số, mật khẩu ≥ 6 ký tự).<br>4. Hệ thống tìm tài khoản theo số điện thoại.<br>5. Hệ thống kiểm tra trạng thái tài khoản (chưa bị khóa).<br>6. Hệ thống kiểm tra mật khẩu khớp.<br>7. Hệ thống đặt lại số lần đăng nhập sai = 0, cập nhật thời điểm đăng nhập gần nhất.<br>8. Hệ thống sinh mã xác thực (JWT) chứa thông tin người dùng.<br>9. Trình duyệt lưu mã xác thực và chuyển sang trang chính. |
| **Dòng sự kiện rẽ nhánh** | **4a.** Không tìm thấy tài khoản: hệ thống hiển thị "Số điện thoại hoặc mật khẩu không đúng".<br>**5a.** Tài khoản bị khóa: hệ thống hiển thị "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên".<br>**6a.** Mật khẩu sai: hệ thống tăng số lần đăng nhập sai. Nếu đạt 5 lần → tự động khóa tài khoản. Hiển thị "Số điện thoại hoặc mật khẩu không đúng". |
| **Kết quả** | Người dùng đăng nhập thành công, nhận được mã xác thực JWT có hiệu lực 3 giờ và được truy cập các chức năng yêu cầu xác thực. |

---

### UC-03: Quên mật khẩu

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng |
| **Mô tả** | Người dùng yêu cầu cấp lại mật khẩu mới khi quên mật khẩu cũ. Hệ thống sinh mật khẩu ngẫu nhiên và gửi qua email. |
| **Điều kiện trước** | Người dùng đã có tài khoản với email hợp lệ và còn truy cập được. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang "Quên mật khẩu".<br>2. Người dùng nhập địa chỉ email đã đăng ký.<br>3. Hệ thống tìm tài khoản theo email.<br>4. Hệ thống sinh mật khẩu mới ngẫu nhiên (6 ký tự).<br>5. Hệ thống gửi email chứa mật khẩu mới qua dịch vụ email.<br>6. Hệ thống cập nhật mật khẩu mới (đã băm) vào cơ sở dữ liệu.<br>7. Hệ thống thông báo "Mật khẩu mới đã được gửi đến email của bạn".<br>8. Người dùng kiểm tra email và đăng nhập với mật khẩu mới. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Email không tồn tại trong hệ thống: thông báo "Email chưa được đăng ký".<br>**5a.** Gửi email thất bại (dịch vụ ngoài lỗi): hệ thống KHÔNG cập nhật mật khẩu mới, mật khẩu cũ vẫn dùng được. Thông báo "Không thể gửi email, vui lòng thử lại". |
| **Kết quả** | Mật khẩu của người dùng được thay bằng mật khẩu ngẫu nhiên mới và gửi qua email. Người dùng có thể đăng nhập bằng mật khẩu mới, sau đó nên đổi sang mật khẩu cá nhân. |

---

## B. Quản lý tài khoản cá nhân

### UC-04: Đăng xuất

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng đăng xuất khỏi hệ thống, thu hồi mã xác thực hiện tại. |
| **Điều kiện trước** | Người dùng đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Người dùng bấm nút "Đăng xuất".<br>2. Trình duyệt gửi mã xác thực hiện tại đến hệ thống.<br>3. Hệ thống giải mã token, lấy mã định danh phiên.<br>4. Hệ thống thêm mã định danh phiên vào danh sách thu hồi.<br>5. Trình duyệt xóa mã xác thực khỏi bộ nhớ.<br>6. Hệ thống chuyển người dùng về trang đăng nhập. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Token đã hết hạn hoặc không hợp lệ: hệ thống trả về lỗi. Trình duyệt vẫn xóa token để đảm bảo người dùng được đăng xuất phía thiết bị.<br>**3b.** Token đã có trong danh sách thu hồi từ trước: hệ thống bỏ qua, vẫn trả thành công. |
| **Kết quả** | Mã xác thực được thu hồi cả phía server (blacklist) và client (xóa khỏi localStorage). Người dùng không thể dùng lại token cũ. |

---

### UC-05: Xem trang chính (Dashboard)

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng xem trang chính tổng quan gồm số dư ví, thông tin tài khoản và 5 giao dịch gần đây. |
| **Điều kiện trước** | Người dùng đã đăng nhập và có ví điện tử. |
| **Dòng sự kiện chính** | 1. Người dùng truy cập trang Dashboard.<br>2. Hệ thống lấy số dư hiện tại của ví.<br>3. Hệ thống lấy danh sách 5 giao dịch gần nhất của người dùng.<br>4. Hệ thống hiển thị: số dư khả dụng, số tài khoản (SĐT), tên chủ tài khoản, danh sách giao dịch, các nút truy cập nhanh (Nạp tiền / Chuyển tiền / Thanh toán / Lịch sử). |
| **Dòng sự kiện rẽ nhánh** | **3a.** Người dùng chưa có giao dịch nào: hiển thị "Chưa có giao dịch nào".<br>**1a.** Người dùng bấm biểu tượng ẩn/hiện số dư: hệ thống chuyển đổi hiển thị giữa số dư thực và dấu chấm. |
| **Kết quả** | Người dùng nắm được trạng thái tài khoản hiện tại và có thể truy cập nhanh các chức năng giao dịch chính. |

---

### UC-06: Đổi mật khẩu

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng đổi mật khẩu đăng nhập của tài khoản. |
| **Điều kiện trước** | Người dùng đã đăng nhập và biết mật khẩu hiện tại. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Quản lý tài khoản" → tab "Đổi mật khẩu".<br>2. Người dùng nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.<br>3. Hệ thống kiểm tra mật khẩu mới khớp với xác nhận và đạt độ dài tối thiểu.<br>4. Hệ thống kiểm tra mật khẩu hiện tại khớp với mật khẩu đã lưu.<br>5. Hệ thống băm mật khẩu mới và lưu vào cơ sở dữ liệu.<br>6. Hệ thống thông báo "Đổi mật khẩu thành công". |
| **Dòng sự kiện rẽ nhánh** | **3a.** Mật khẩu xác nhận không khớp: thông báo lỗi và yêu cầu nhập lại.<br>**4a.** Mật khẩu hiện tại sai: thông báo "Mật khẩu hiện tại không đúng". |
| **Kết quả** | Mật khẩu của tài khoản được cập nhật. Người dùng phải dùng mật khẩu mới cho lần đăng nhập tiếp theo. |

---

### UC-07: Đổi mã PIN giao dịch

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng đổi mã PIN 6 số dùng để xác nhận các giao dịch tài chính. |
| **Điều kiện trước** | Người dùng đã đăng nhập và biết mã PIN hiện tại. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Quản lý tài khoản" → tab "Đổi mã PIN".<br>2. Người dùng nhập mã PIN hiện tại, mã PIN mới và xác nhận mã PIN mới (cả 3 đều 6 chữ số).<br>3. Hệ thống kiểm tra mã PIN mới khớp với xác nhận.<br>4. Hệ thống kiểm tra mã PIN hiện tại khớp với mã PIN đã lưu.<br>5. Hệ thống băm mã PIN mới và lưu vào cơ sở dữ liệu.<br>6. Hệ thống đặt lại số lần thử PIN sai = 0, gỡ trạng thái khóa PIN nếu có.<br>7. Hệ thống thông báo "Đổi mã PIN thành công". |
| **Dòng sự kiện rẽ nhánh** | **3a.** Mã PIN xác nhận không khớp: thông báo lỗi.<br>**4a.** Mã PIN hiện tại sai: hệ thống tăng số lần thử PIN sai và thông báo "Mã PIN hiện tại không đúng (đã sai N lần)". |
| **Kết quả** | Mã PIN giao dịch được cập nhật. Các giao dịch tài chính sau đó phải xác nhận bằng mã PIN mới. |

---

### UC-08: Cập nhật KYC

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng nộp hồ sơ xác minh danh tính (KYC) gồm thông tin CCCD và ảnh chụp để được sử dụng đầy đủ chức năng hệ thống. |
| **Điều kiện trước** | Người dùng đã đăng nhập. Trạng thái KYC hiện tại là `UNVERIFIED` hoặc `REJECTED` (nếu bị từ chối có thể nộp lại). |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Quản lý tài khoản" → tab "Xác minh danh tính".<br>2. Người dùng nhập các thông tin: họ tên (theo CCCD), ngày sinh, số CCCD, ngày cấp, nơi cấp, quê quán, địa chỉ thường trú.<br>3. Người dùng tải lên ảnh mặt trước và mặt sau CCCD.<br>4. Hệ thống kiểm tra kích thước ảnh (mỗi ảnh ≤ 1.5MB) và mã hóa Base64.<br>5. Hệ thống kiểm tra hồ sơ KYC chưa được duyệt trước đó.<br>6. Hệ thống lưu hồ sơ với trạng thái `PENDING` và cập nhật `kyc_status` của người dùng = `PENDING`.<br>7. Hệ thống thông báo "Nộp hồ sơ KYC thành công, chờ duyệt". |
| **Dòng sự kiện rẽ nhánh** | **3a.** Ảnh vượt quá kích thước cho phép: thông báo và yêu cầu chọn ảnh khác.<br>**5a.** Hồ sơ đã ở trạng thái `PENDING` (đang chờ duyệt): thông báo "Hồ sơ đang được xét duyệt".<br>**5b.** Hồ sơ đã `VERIFIED`: thông báo "Tài khoản đã xác minh, không cần nộp lại". |
| **Kết quả** | Hồ sơ KYC được lưu với trạng thái `PENDING`. Trạng thái KYC của tài khoản chuyển từ `UNVERIFIED` → `PENDING`. Hồ sơ chờ quản trị viên duyệt. |

---

### UC-09: Quản lý mã QR cá nhân

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng xem hoặc tạo mã QR cá nhân để người khác quét và chuyển tiền cho mình. Hỗ trợ QR tĩnh (chỉ thông tin người nhận) và QR động (kèm số tiền + nội dung). |
| **Điều kiện trước** | Người dùng đã đăng nhập. |
| **Dòng sự kiện chính (QR tĩnh)** | 1. Người dùng vào trang Quản lý tài khoản → mục "Mã QR".<br>2. Hệ thống lấy thông tin người dùng (SĐT, họ tên).<br>3. Hệ thống sinh mã QR có chữ ký xác thực.<br>4. Hệ thống hiển thị mã QR để người dùng chia sẻ. |
| **Dòng sự kiện chính (QR động)** | 1. Người dùng nhập số tiền và ghi chú.<br>2. Hệ thống sinh QR động kèm số tiền, ghi chú, hạn sử dụng 5 phút.<br>3. Hệ thống hiển thị mã QR.<br>4. Người dùng chia sẻ QR cho người trả tiền. |
| **Dòng sự kiện rẽ nhánh** | **2a (QR động).** Số tiền không hợp lệ: thông báo và yêu cầu nhập lại.<br>**(QR động).** Sau 5 phút, QR hết hạn và không sử dụng được. |
| **Kết quả** | Mã QR được sinh ra và hiển thị. Người khác có thể quét để chuyển tiền cho người dùng. |

---

## C. Giao dịch tài chính

### UC-10: Nạp tiền qua VNPay

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập, đã xác thực KYC) |
| **Mô tả** | Người dùng nạp tiền từ tài khoản ngân hàng / thẻ vào ví điện tử thông qua cổng thanh toán VNPay. |
| **Điều kiện trước** | Người dùng đã đăng nhập và đã hoàn tất xác minh KYC (`kyc_status = VERIFIED`). |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Nạp tiền".<br>2. Người dùng nhập số tiền cần nạp (từ 10.000đ đến 100.000.000đ) và chọn ngân hàng.<br>3. Hệ thống kiểm tra trạng thái KYC.<br>4. Hệ thống hủy các giao dịch nạp tiền đang chờ xử lý cũ.<br>5. Hệ thống tạo giao dịch nạp tiền mới với trạng thái "Đang xử lý".<br>6. Hệ thống sinh đường dẫn thanh toán VNPay có chữ ký xác thực.<br>7. Trình duyệt chuyển sang trang VNPay để người dùng nhập thông tin thẻ.<br>8. Người dùng hoàn tất thanh toán trên VNPay.<br>9. VNPay gửi callback xác nhận thanh toán thành công đến hệ thống.<br>10. Hệ thống xác minh chữ ký VNPay và đối chiếu số tiền.<br>11. Hệ thống cộng tiền vào ví người dùng và ghi sổ cái.<br>12. Hệ thống cập nhật trạng thái giao dịch = "Thành công".<br>13. Người dùng quay về trang kết quả nạp tiền và thấy số dư mới. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Tài khoản chưa xác minh KYC: hệ thống từ chối, thông báo "Vui lòng hoàn thành KYC".<br>**8a.** Người dùng hủy giao dịch trên VNPay: VNPay gửi callback với mã hủy, hệ thống cập nhật trạng thái = "Đã hủy".<br>**8b.** Thanh toán thất bại trên VNPay: VNPay gửi callback lỗi, hệ thống cập nhật trạng thái = "Thất bại" và lưu lý do.<br>**11a.** Cộng tiền vào ví thất bại (lỗi hệ thống): hệ thống cập nhật trạng thái = "Thất bại". |
| **Kết quả** | Số dư ví của người dùng được tăng đúng số tiền đã nạp. Một bản ghi giao dịch loại `TOPUP` được tạo với trạng thái `SUCCESS`. Sổ cái ghi nhận một mục `CREDIT`. |

---

### UC-11: Chuyển tiền qua số điện thoại

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập, đã xác thực KYC) |
| **Mô tả** | Người dùng chuyển tiền cho một người dùng khác trong hệ thống bằng cách nhập số điện thoại người nhận. |
| **Điều kiện trước** | Người dùng đã đăng nhập, đã xác thực KYC, có đủ số dư và biết số điện thoại người nhận. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Chuyển tiền" → chọn "Nhập số tài khoản".<br>2. Người dùng nhập số điện thoại người nhận.<br>3. Hệ thống tìm và hiển thị thông tin người nhận.<br>4. Người dùng nhập số tiền, ghi chú và mã PIN giao dịch.<br>5. Hệ thống kiểm tra mã PIN.<br>6. Hệ thống kiểm tra điều kiện chuyển tiền: cả 2 tài khoản đang hoạt động, người gửi đã xác thực KYC, không tự chuyển cho mình.<br>7. Hệ thống tạo giao dịch với trạng thái "Đang xử lý".<br>8. Hệ thống yêu cầu ví chuyển tiền: khóa độc quyền 2 ví, kiểm tra số dư và hạn mức, trừ tiền người gửi, cộng tiền người nhận, ghi sổ cái cả 2 ví.<br>9. Hệ thống cập nhật trạng thái giao dịch = "Thành công".<br>10. Hệ thống gửi thông báo bất đồng bộ cho cả người gửi và người nhận. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Không tìm thấy người nhận: thông báo "Không tìm thấy tài khoản".<br>**5a.** Mã PIN sai: thông báo "Mã PIN không đúng".<br>**6a.** Tài khoản bị khóa hoặc chưa KYC: thông báo lý do tương ứng.<br>**6b.** Người gửi trùng người nhận: thông báo "Không thể chuyển tiền cho chính mình".<br>**8a.** Số dư không đủ / vượt hạn mức: hệ thống cập nhật trạng thái = "Thất bại", thông báo "Số dư không đủ" hoặc "Vượt hạn mức". |
| **Kết quả** | Số tiền được chuyển từ ví người gửi sang ví người nhận. Một bản ghi giao dịch loại `TRANSFER` trạng thái `SUCCESS` được tạo. Cả người gửi và người nhận nhận được thông báo. |

---

### UC-12: Chuyển tiền qua mã QR

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập, đã xác thực KYC) |
| **Mô tả** | Người dùng chuyển tiền bằng cách quét mã QR của người nhận (QR tĩnh hoặc QR động). |
| **Điều kiện trước** | Người dùng đã đăng nhập, đã xác thực KYC, có thiết bị có camera hoặc ảnh QR. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Chuyển tiền" → chọn "Quét mã QR".<br>2. Người dùng quét mã QR hoặc tải ảnh QR.<br>3. Hệ thống đọc nội dung QR và xác minh chữ ký.<br>4. Hệ thống lấy thông tin người nhận từ QR.<br>5a. (QR tĩnh) Người dùng nhập số tiền và ghi chú.<br>5b. (QR động) Hệ thống tự điền số tiền và ghi chú có sẵn trong QR.<br>6. Người dùng nhập mã PIN giao dịch.<br>7. (Tiếp tục giống UC-11 từ bước 5: kiểm tra PIN → tạo giao dịch → ví chuyển tiền → thông báo) |
| **Dòng sự kiện rẽ nhánh** | **3a.** Mã QR không hợp lệ (sai chữ ký): thông báo "Mã QR không hợp lệ".<br>**3b.** Mã QR động đã hết hạn: thông báo "Mã QR đã hết hạn".<br>**3c.** Mã QR không thuộc hệ thống School Wallet: thông báo "Mã QR không hỗ trợ".<br>**(Các nhánh khác)** giống UC-11. |
| **Kết quả** | Tương tự UC-11. |

---

### UC-13: Thanh toán dịch vụ

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập, đã xác thực KYC) |
| **Mô tả** | Người dùng thanh toán cho một dịch vụ trong trường (căng-tin, bãi xe, in ấn…). Hệ thống tự động chia tiền 3 bên: khách hàng → dịch vụ → phí nền tảng. |
| **Điều kiện trước** | Người dùng đã đăng nhập, đã xác thực KYC, có đủ số dư. Dịch vụ đang hoạt động. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Thanh toán dịch vụ".<br>2. Hệ thống hiển thị danh sách dịch vụ hoạt động (có lọc theo loại).<br>3. Người dùng chọn dịch vụ.<br>4. Hệ thống hiển thị form thanh toán (PARKING tự động tính phí theo giờ; loại khác cho nhập số tiền).<br>5. Người dùng xác nhận số tiền và nhập mã PIN giao dịch.<br>6. Hệ thống kiểm tra điều kiện thanh toán (PIN đúng, tài khoản không khóa, đã KYC, không tự thanh toán).<br>7. Hệ thống lấy thông tin tài khoản nền tảng (admin).<br>8. Hệ thống tính phí nền tảng (10%) và số tiền phân bổ cho 3 bên.<br>9. Hệ thống tạo giao dịch với trạng thái "Đang xử lý".<br>10. Hệ thống yêu cầu ví phân bổ tiền: khóa 3 ví, trừ tiền khách hàng (đủ số tiền), cộng tiền dịch vụ (số tiền − phí), cộng phí nền tảng vào ví quản trị, ghi sổ cái 3 ví.<br>11. Hệ thống cập nhật trạng thái = "Thành công".<br>12. Hệ thống gửi thông báo cho khách hàng và chủ dịch vụ. |
| **Dòng sự kiện rẽ nhánh** | **6a.** PIN sai / chưa KYC / tài khoản khóa: thông báo lý do tương ứng.<br>**10a.** Số dư không đủ: hệ thống cập nhật trạng thái = "Thất bại", thông báo "Số dư không đủ". |
| **Kết quả** | Số tiền được chia 3 bên đúng quy tắc. Một bản ghi giao dịch loại `PAYMENT` trạng thái `SUCCESS` với phí > 0 được tạo. Sổ cái ghi nhận 3 mục (1 DEBIT khách, 2 CREDIT cho dịch vụ và nền tảng). |

---

## D. Tra cứu & Thông báo

### UC-14: Xem lịch sử giao dịch

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng xem danh sách tất cả giao dịch của mình (cả gửi và nhận), sắp xếp theo thời gian, có phân trang. |
| **Điều kiện trước** | Người dùng đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Lịch sử giao dịch".<br>2. Hệ thống truy vấn các giao dịch mà người dùng là người gửi hoặc người nhận.<br>3. Hệ thống xác định chiều giao dịch (gửi đi / nhận về) cho từng bản ghi.<br>4. Hệ thống trả về 10 giao dịch đầu tiên (sắp xếp mới nhất → cũ nhất) kèm tổng số trang.<br>5. Hệ thống hiển thị danh sách với biểu tượng chiều ↓/↑, tên đối tác, số tiền có dấu, trạng thái. |
| **Dòng sự kiện rẽ nhánh** | **4a.** Chưa có giao dịch nào: hiển thị "Chưa có giao dịch nào".<br>**1a.** Người dùng bấm trang tiếp theo: hệ thống gọi lại với offset mới, hiển thị trang khác. |
| **Kết quả** | Người dùng nắm được toàn bộ lịch sử giao dịch của mình. |

---

### UC-15: Tra cứu giao dịch theo mã

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng tra cứu thông tin chi tiết của một giao dịch bằng mã giao dịch (UUID). |
| **Điều kiện trước** | Người dùng đã đăng nhập và có mã giao dịch cần tra cứu. |
| **Dòng sự kiện chính** | 1. Người dùng vào trang "Tra cứu giao dịch".<br>2. Người dùng nhập mã giao dịch (định dạng UUID).<br>3. Hệ thống kiểm tra định dạng UUID.<br>4. Hệ thống tìm giao dịch theo mã.<br>5. Hệ thống hiển thị chi tiết: loại, trạng thái, số tiền, phí, người gửi, người nhận, thời gian, mô tả, lịch sử trạng thái. |
| **Dòng sự kiện rẽ nhánh** | **3a.** Mã giao dịch không đúng định dạng UUID: thông báo "Mã giao dịch không hợp lệ".<br>**4a.** Không tìm thấy giao dịch: thông báo "Không tìm thấy giao dịch". |
| **Kết quả** | Người dùng xem được chi tiết giao dịch và lịch sử chuyển trạng thái của nó. |

---

### UC-16: Xem thông báo

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Người dùng (đã đăng nhập) |
| **Mô tả** | Người dùng xem danh sách thông báo trong ứng dụng (giao dịch, hệ thống). |
| **Điều kiện trước** | Người dùng đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Người dùng bấm vào biểu tượng chuông thông báo.<br>2. Hệ thống truy vấn danh sách thông báo của người dùng (sắp xếp mới nhất → cũ nhất).<br>3. Hệ thống hiển thị tiêu đề, nội dung, thời gian, trạng thái đã đọc / chưa đọc.<br>4. Khi người dùng bấm vào một thông báo, hệ thống đánh dấu là đã đọc.<br>5. Khi có thông báo mới (qua WebSocket), hệ thống hiển thị số đếm chưa đọc trên biểu tượng chuông. |
| **Dòng sự kiện rẽ nhánh** | **2a.** Chưa có thông báo: hiển thị "Chưa có thông báo nào".<br>**5a.** WebSocket mất kết nối: hệ thống reconnect tự động. |
| **Kết quả** | Người dùng nắm được các thông báo gần đây liên quan đến tài khoản và giao dịch. |

---

## E. Chủ dịch vụ

### UC-17: Xem danh sách dịch vụ sở hữu

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Chủ dịch vụ |
| **Mô tả** | Chủ dịch vụ xem danh sách các dịch vụ (merchant) mà mình được quản trị viên giao quản lý. |
| **Điều kiện trước** | Người dùng đã đăng nhập và được quản trị viên gán làm chủ của ít nhất 1 merchant. |
| **Dòng sự kiện chính** | 1. Chủ dịch vụ vào trang "Dịch vụ của tôi".<br>2. Hệ thống truy vấn các merchant có chủ là người dùng hiện tại.<br>3. Hệ thống hiển thị danh sách dịch vụ với tên, loại (CANTEEN / PARKING / …), trạng thái hoạt động, ngày tạo. |
| **Dòng sự kiện rẽ nhánh** | **2a.** Người dùng chưa được gán dịch vụ nào: hiển thị "Bạn chưa sở hữu dịch vụ nào. Liên hệ quản trị viên để được cấp quyền". |
| **Kết quả** | Chủ dịch vụ nắm được danh sách và trạng thái các dịch vụ mình đang quản lý. |

---

### UC-18: Xem doanh thu dịch vụ sở hữu

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Chủ dịch vụ |
| **Mô tả** | Chủ dịch vụ xem doanh thu của các dịch vụ mình quản lý theo khoảng thời gian, với biểu đồ và bảng chi tiết. |
| **Điều kiện trước** | Người dùng đã đăng nhập và sở hữu ít nhất 1 merchant. |
| **Dòng sự kiện chính** | 1. Chủ dịch vụ vào trang "Doanh thu của tôi".<br>2. Chủ dịch vụ chọn khoảng thời gian (Hôm nay / 7 ngày / 30 ngày / Tùy chọn) và mức chia (Ngày / Tuần / Tháng).<br>3. Hệ thống truy vấn các chỉ số tổng quan (tổng doanh thu, số giao dịch, trung bình mỗi giao dịch).<br>4. Hệ thống truy vấn doanh thu theo thời gian (chuỗi điểm).<br>5. Hệ thống truy vấn doanh thu theo từng dịch vụ (nếu sở hữu nhiều dịch vụ).<br>6. Hệ thống hiển thị: 4 KPI, biểu đồ cột theo thời gian, biểu đồ tròn top dịch vụ, bảng chi tiết. |
| **Dòng sự kiện rẽ nhánh** | **6a.** Không có giao dịch trong khoảng thời gian đã chọn: hiển thị "Không có dữ liệu". |
| **Kết quả** | Chủ dịch vụ nắm được tình hình kinh doanh các dịch vụ mình quản lý. |

---

## F. Quản trị viên

### UC-19: Quản lý người dùng

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem, tìm kiếm và quản lý danh sách tất cả người dùng trong hệ thống. |
| **Điều kiện trước** | Người dùng đăng nhập với vai trò `ADMIN`. |
| **Dòng sự kiện chính** | 1. Quản trị viên vào trang "Quản lý người dùng".<br>2. Hệ thống hiển thị danh sách người dùng có phân trang (10 người dùng/trang).<br>3. Quản trị viên có thể lọc theo trạng thái (Hoạt động / Bị khóa) hoặc tìm kiếm theo họ tên / số điện thoại.<br>4. Hệ thống hiển thị các thông tin: họ tên, số điện thoại, email, vai trò, trạng thái và các hành động (Khóa/Mở khóa, Cấp lại PIN). |
| **Dòng sự kiện rẽ nhánh** | **3a.** Không tìm thấy người dùng phù hợp: hiển thị "Không tìm thấy người dùng nào".<br>**(Mở rộng)** Khóa/mở khóa: xem UC-20. Cấp lại PIN: xem UC-21. |
| **Kết quả** | Quản trị viên có thể quan sát toàn bộ người dùng trong hệ thống và thực hiện các hành động quản trị. |

---

### UC-20: Khóa / mở khóa tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên khóa hoặc mở khóa tài khoản của một người dùng. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. Tài khoản đích tồn tại và không phải tài khoản quản trị viên khác. |
| **Dòng sự kiện chính** | 1. Quản trị viên bấm nút "Khóa" hoặc "Mở khóa" trên một người dùng trong danh sách.<br>2. Hệ thống tìm người dùng theo mã.<br>3. Hệ thống đảo trạng thái: `ACTIVE` ↔ `LOCKED`.<br>4. Nếu mở khóa: hệ thống đặt lại số lần đăng nhập sai = 0.<br>5. Hệ thống lưu thay đổi.<br>6. Hệ thống thông báo "Cập nhật trạng thái thành công" và làm mới danh sách. |
| **Dòng sự kiện rẽ nhánh** | **2a.** Không tìm thấy người dùng: thông báo "Không tìm thấy người dùng". |
| **Kết quả** | Trạng thái tài khoản được chuyển đổi. Người dùng bị khóa không thể đăng nhập cho đến khi được mở khóa. |

---

### UC-21: Cấp lại mã PIN

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên cấp lại mã PIN giao dịch cho một người dùng trong trường hợp người đó quên hoặc bị khóa PIN do thử sai nhiều lần. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. Người dùng đích tồn tại. |
| **Dòng sự kiện chính** | 1. Quản trị viên bấm nút "Cập nhật OTP" trên một người dùng.<br>2. Quản trị viên nhập mã PIN mới (6 chữ số) và xác nhận.<br>3. Hệ thống kiểm tra mã PIN mới khớp với xác nhận và có 6 chữ số.<br>4. Hệ thống tìm người dùng theo số điện thoại.<br>5. Hệ thống băm mã PIN mới và lưu.<br>6. Hệ thống đặt lại số lần thử PIN sai = 0, gỡ trạng thái khóa PIN.<br>7. Hệ thống thông báo "Cập nhật PIN thành công".<br>8. Quản trị viên thông báo mã PIN mới cho người dùng qua kênh khác (gọi điện, gặp trực tiếp). |
| **Dòng sự kiện rẽ nhánh** | **3a.** Mã PIN không hợp lệ (không phải 6 chữ số): thông báo "Mã PIN phải gồm 6 chữ số".<br>**3b.** Xác nhận không khớp: thông báo "Mã PIN xác nhận không khớp".<br>**4a.** Không tìm thấy người dùng: thông báo "Không tìm thấy người dùng". |
| **Kết quả** | Mã PIN của người dùng được thay bằng mã PIN mới. Người dùng có thể dùng PIN mới ngay lập tức. |

---

### UC-22: Quản lý KYC

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên duyệt hoặc từ chối các hồ sơ KYC do người dùng nộp. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. Có ít nhất 1 hồ sơ KYC ở trạng thái `PENDING`. |
| **Dòng sự kiện chính** | 1. Quản trị viên vào trang "Quản lý KYC".<br>2. Hệ thống hiển thị danh sách hồ sơ KYC theo bộ lọc (mặc định: Chờ duyệt).<br>3. Quản trị viên bấm "Xem chi tiết" một hồ sơ để xem thông tin và ảnh CCCD.<br>4. Quản trị viên đối chiếu thông tin và quyết định.<br>**Trường hợp duyệt:**<br>5a. Quản trị viên bấm "Duyệt KYC".<br>6a. Hệ thống cập nhật trạng thái hồ sơ = `VERIFIED`, ghi nhận người duyệt và thời điểm.<br>7a. Hệ thống cập nhật `kyc_status` của người dùng = `VERIFIED`.<br>**Trường hợp từ chối:**<br>5b. Quản trị viên bấm "Từ chối" và nhập lý do.<br>6b. Hệ thống cập nhật trạng thái hồ sơ = `REJECTED`, lưu lý do.<br>7b. Hệ thống cập nhật `kyc_status` của người dùng = `REJECTED`.<br>8. Hệ thống thông báo kết quả và làm mới danh sách. |
| **Dòng sự kiện rẽ nhánh** | **2a.** Quản trị viên đổi bộ lọc (Tất cả / Đã duyệt / Từ chối): hệ thống truy vấn lại với điều kiện mới.<br>**5b-1.** Quản trị viên không nhập lý do từ chối: nút "Xác nhận từ chối" bị vô hiệu.<br>**6.** Hồ sơ không tồn tại: hệ thống thông báo "Không tìm thấy hồ sơ". |
| **Kết quả** | Trạng thái hồ sơ KYC được cập nhật. Người dùng được/không được sử dụng các chức năng yêu cầu KYC (chuyển tiền, thanh toán, nạp tiền). |

---

### UC-23: Quản lý dịch vụ

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên thêm, sửa, xóa các dịch vụ (merchant) trong hệ thống và gán chủ quản lý. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Quản trị viên vào trang "Quản lý dịch vụ".<br>2. Hệ thống hiển thị danh sách dịch vụ có phân trang.<br>3. Quản trị viên có thể tìm kiếm theo tên hoặc lọc theo loại dịch vụ.<br>**Thêm dịch vụ mới:**<br>4a. Quản trị viên bấm "Thêm dịch vụ", nhập tên, loại, số điện thoại chủ.<br>5a. Hệ thống kiểm tra tên dịch vụ chưa trùng.<br>6a. Hệ thống tìm chủ dịch vụ theo số điện thoại.<br>7a. Hệ thống lưu dịch vụ mới ở trạng thái Hoạt động.<br>**Sửa dịch vụ:**<br>4b. Quản trị viên bấm "Sửa" và chỉnh thông tin.<br>5b. Hệ thống cập nhật dịch vụ.<br>**Xóa dịch vụ:**<br>4c. Quản trị viên bấm "Xóa" và xác nhận.<br>5c. Hệ thống xóa dịch vụ khỏi cơ sở dữ liệu.<br>8. Hệ thống thông báo kết quả và làm mới danh sách. |
| **Dòng sự kiện rẽ nhánh** | **5a-1.** Tên dịch vụ đã tồn tại: thông báo "Tên dịch vụ đã tồn tại".<br>**6a-1.** Số điện thoại chủ chưa được đăng ký: thông báo "Không tìm thấy chủ dịch vụ với SĐT này". |
| **Kết quả** | Danh sách dịch vụ được cập nhật. Người dùng và chủ dịch vụ thấy được sự thay đổi khi truy cập danh sách dịch vụ. |

---

### UC-24: Xem thống kê giao dịch

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem các chỉ số thống kê tổng quan về giao dịch trên toàn hệ thống (KPI, biểu đồ theo thời gian, phân loại). |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Quản trị viên vào trang "Thống kê".<br>2. Hệ thống mặc định lấy số liệu 30 ngày gần nhất với mức chia theo ngày.<br>3. Hệ thống truy vấn các chỉ số KPI: tổng số giao dịch, tổng giá trị, phí thu được, tỉ lệ thành công.<br>4. Hệ thống truy vấn phân loại theo loại giao dịch (TOPUP / TRANSFER / PAYMENT).<br>5. Hệ thống truy vấn phân loại theo trạng thái (SUCCESS / PENDING / FAILED / CANCELLED).<br>6. Hệ thống truy vấn chuỗi dữ liệu giao dịch theo thời gian.<br>7. Hệ thống hiển thị: 4 KPI, biểu đồ đường theo thời gian, 2 biểu đồ tròn (theo loại + theo trạng thái). |
| **Dòng sự kiện rẽ nhánh** | **2a.** Quản trị viên đổi khoảng thời gian (Hôm nay / 7 ngày / Tùy chọn): hệ thống truy vấn lại với khoảng mới.<br>**2b.** Quản trị viên đổi mức chia (Ngày / Tuần / Tháng): hệ thống truy vấn lại biểu đồ thời gian. |
| **Kết quả** | Quản trị viên nắm được tình hình giao dịch tổng thể của hệ thống trong khoảng thời gian đã chọn. |

---

### UC-25: Xem doanh thu nền tảng

| Thành phần | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mô tả** | Quản trị viên xem doanh thu phí nền tảng (10% phí từ giao dịch thanh toán dịch vụ) trên toàn hệ thống. |
| **Điều kiện trước** | Quản trị viên đã đăng nhập. |
| **Dòng sự kiện chính** | 1. Quản trị viên vào trang "Doanh thu".<br>2. Hệ thống lấy danh sách dịch vụ để ánh xạ mã → tên.<br>3. Quản trị viên chọn khoảng thời gian và mức chia.<br>4. Hệ thống truy vấn các chỉ số: tổng doanh thu, số giao dịch có phí, trung bình phí mỗi giao dịch, dịch vụ có doanh thu cao nhất.<br>5. Hệ thống truy vấn doanh thu theo thời gian.<br>6. Hệ thống truy vấn doanh thu theo từng dịch vụ.<br>7. Hệ thống hiển thị: 4 KPI doanh thu, biểu đồ cột doanh thu theo thời gian, biểu đồ tròn top 5 dịch vụ, bảng chi tiết doanh thu theo dịch vụ. |
| **Dòng sự kiện rẽ nhánh** | **(Đổi filter)** Tương tự UC-24.<br>**4a.** Không có giao dịch có phí trong khoảng đã chọn: hiển thị các KPI = 0, biểu đồ rỗng. |
| **Kết quả** | Quản trị viên nắm được tình hình doanh thu phí nền tảng để đánh giá hiệu quả kinh doanh và đưa ra quyết định điều chỉnh chính sách phí. |

---

## Tổng kết

Tài liệu trên đặc tả chi tiết **25 use case** chính của hệ thống School Wallet, được phân nhóm theo:
- **A. Trước đăng nhập** (3 UC): các chức năng public không yêu cầu xác thực
- **B. Quản lý tài khoản cá nhân** (6 UC): các chức năng cài đặt và bảo mật tài khoản
- **C. Giao dịch tài chính** (4 UC): các chức năng cốt lõi liên quan đến tiền
- **D. Tra cứu & Thông báo** (3 UC): xem lịch sử và nhận thông báo
- **E. Chủ dịch vụ** (2 UC): các chức năng đặc thù dành cho người sở hữu merchant
- **F. Quản trị viên** (7 UC): các chức năng quản trị hệ thống

Mỗi use case mô tả đầy đủ 6 thành phần chuẩn theo UML: Tác nhân, Mô tả, Điều kiện trước, Dòng sự kiện chính, Dòng sự kiện rẽ nhánh và Kết quả.
