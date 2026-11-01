# School Wallet

Hệ thống ví điện tử nội bộ cho trường học: nạp tiền, chuyển tiền giữa người dùng, thanh toán cho
merchant (căng tin, nhà sách…), tra cứu lịch sử giao dịch và thống kê doanh thu.

Kiến trúc **Microservices + Service Registry + API Gateway**, với hai client: **Web (React SPA)** và **Mobile (Expo)**.

## Công nghệ

| Lớp            | Công nghệ                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Backend        | Spring Boot 3.5.10, Java 21, Spring Data JPA, Spring Cloud Gateway (WebFlux), Spring Cloud 2025.0.1 |
| Dữ liệu        | PostgreSQL (mỗi service một database), Redis (cache + OTP)                                          |
| Giao tiếp      | REST, gRPC (transaction → wallet), ActiveMQ (pub/sub), STOMP                                        |
| Hạ tầng        | Eureka (service discovery), Docker Compose                                                          |
| Tích hợp ngoài | VNPay (nạp tiền), SendGrid (email), SpeedSMS (OTP)                                                  |
| Web app        | React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7                                        |
| Mobile app     | Expo SDK 58, React Native 0.88, TypeScript, Expo Router                                             |
| CI/CD          | GitHub Actions, GitHub Container Registry (GHCR)                                                    |

## Các thành phần

| Thành phần             | Port               | Vai trò                                                |
| ---------------------- | ------------------ | ------------------------------------------------------ |
| `eureka-server`        | 8761               | Service registry — các service tự đăng ký và tìm nhau  |
| `api-gateway`          | 8080               | Cửa ngõ duy nhất: xác thực JWT, định tuyến, CORS       |
| `user-service`         | 8081               | Người dùng, đăng nhập, mã PIN, KYC, mã QR, merchant    |
| `wallet-service`       | 8082 (+ gRPC 9090) | Số dư, hạn mức, sổ cái ghi kép (double-entry)          |
| `transaction-service`  | 8084               | Điều phối giao dịch, lịch sử, thống kê, tích hợp VNPay |
| `notification-service` | 8085               | OTP, email, SMS, hộp thư, thông báo thời gian thực     |
| `web-app`              | 3000               | Giao diện web cho người dùng và quản trị               |
| `mobile-app`           | 8090 (Metro, dev)  | Ứng dụng di động cho người dùng                        |

## Cấu trúc thư mục

```
school-wallet/
├── eureka-server/           # Service registry (com.ldt.eureka)
├── api-gateway/             # API Gateway (com.ldt.gateway)
├── user-service/            # Người dùng & xác thực (com.ldt.user)
├── wallet-service/          # Ví & sổ cái (com.ldt.wallet)
├── transaction-service/     # Giao dịch & thống kê (com.ldt.transaction)
├── notification-service/    # Thông báo (com.ldt.notification)
├── web-app/                 # React SPA
├── mobile-app/              # Ứng dụng di động (Expo)
│
├── .github/workflows/       # CI/CD (ci.yml, cd.yml)
├── docker-compose.yml       # Toàn bộ hệ thống
├── schema.sql               # DDL tổng hợp
├── docs/                    # Tài liệu thiết kế (ERD, use-case, sơ đồ tuần tự)
```

Giao diện web: http://localhost:3000 · Gateway: http://localhost:8080 · Eureka: http://localhost:8761
