# School Wallet

Hệ thống ví điện tử nội bộ cho trường học: nạp tiền, chuyển tiền giữa người dùng, thanh toán cho
merchant (căng tin, nhà sách…), tra cứu lịch sử giao dịch và thống kê doanh thu.

Kiến trúc **Microservices + Service Registry + API Gateway + React SPA**.

## Công nghệ

| Lớp            | Công nghệ                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Backend        | Spring Boot 3.5.10, Java 21, Spring Data JPA, Spring Cloud Gateway (WebFlux), Spring Cloud 2025.0.1 |
| Dữ liệu        | PostgreSQL (mỗi service một database), Redis (cache + OTP)                                          |
| Giao tiếp      | REST, gRPC (transaction → wallet), ActiveMQ (pub/sub), STOMP                                        |
| Hạ tầng        | Eureka (service discovery), Docker Compose                                                          |
| Tích hợp ngoài | VNPay (nạp tiền), SendGrid (email), SpeedSMS (OTP)                                                  |
| Frontend       | React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7                                        |

## Các service

| Service                | Port               | Vai trò                                                |
| ---------------------- | ------------------ | ------------------------------------------------------ |
| `eureka-server`        | 8761               | Service registry — các service tự đăng ký và tìm nhau  |
| `api-gateway`          | 8080               | Cửa ngõ duy nhất: xác thực JWT, định tuyến, CORS       |
| `user-service`         | 8081               | Người dùng, đăng nhập, mã PIN, KYC, mã QR, merchant    |
| `wallet-service`       | 8082 (+ gRPC 9090) | Số dư, hạn mức, sổ cái ghi kép (double-entry)          |
| `transaction-service`  | 8084               | Điều phối giao dịch, lịch sử, thống kê, tích hợp VNPay |
| `notification-service` | 8085               | OTP, email, SMS, hộp thư, thông báo thời gian thực     |
| `font-end`             | 3000               | Giao diện người dùng và quản trị                       |

## Cấu trúc thư mục

```
school-wallet/
├── eureka-server/           # Service registry (com.ldt.eureka)
├── api-gateway/             # API Gateway (com.ldt.gateway)
├── user-service/            # Người dùng & xác thực (com.ldt.user)
├── wallet-service/          # Ví & sổ cái (com.ldt.wallet)
├── transaction-service/     # Giao dịch & thống kê (com.ldt.transaction)
├── notification-service/    # Thông báo (com.ldt.notification)
├── font-end/                # React SPA
│
├── docker-compose.yml       # Toàn bộ hệ thống
├── docker/init-db/          # Script tạo database
├── schema.sql               # DDL tổng hợp
├── docs/                    # Tài liệu thiết kế (ERD, use-case, sơ đồ tuần tự)

```

Mỗi service backend theo cùng một bố cục:

```
<service>/src/main/java/com/ldt/<service>/
├── config/          # Cấu hình, bộ lọc bảo mật, i18n
├── context/         # Thông tin người dùng theo request
├── controller/      # REST endpoint
├── dto/             # Đối tượng request / response
├── exception/       # Mã lỗi và xử lý lỗi tập trung
├── model/           # Entity và enum
├── repository/      # Tầng truy cập dữ liệu
└── service/         # Nghiệp vụ
```

Giao diện: http://localhost:3000 · Gateway: http://localhost:8080 · Eureka: http://localhost:8761
