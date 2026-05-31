# CLAUDE.md — School Wallet

Ví điện tử nội bộ. Kiến trúc **Microservices + API Gateway + React SPA**.

- **Stack BE:** Spring Boot 3.5.10, Java 21, Spring Data JPA, Spring Security (Resource Server JWT HS512), Spring Cloud Gateway (Reactive WebFlux), Maven (mvnw wrapper).
- **Hạ tầng:** PostgreSQL (mỗi service 1 DB, KHÔNG có FK xuyên service), Redis (cache + OTP), ActiveMQ (topic pub/sub), WebSocket/STOMP (SockJS), VNPay sandbox (topup), SendGrid (email), SpeedSMS (SMS OTP).
- **Stack FE:** React 19 + TypeScript, Vite 6, Tailwind CSS 3, React Router 7, Axios, react-toastify, recharts, html5-qrcode, qrcode.react.
- Base package mọi service BE: `com.ldt.<service>`.

## Các service & port

| Service | Port | Vai trò |
|---|---|---|
| `api-gateway` | 8080 | JWT auth, routing, inject header `X-User-*`, CORS, forward WebSocket |
| `user-service` | 8081 | User, auth, PIN, KYC, QR, merchant CRUD, internal lookup |
| `wallet-service` | 8082 | Ví, hạn mức, transfer 2-bên, transfer 3-bên (split fee), topup CREDIT |
| `transaction-service` | 8084 | Orchestration transfer/payment/topup, history, dashboard, VNPay |
| `notification-service` | 8085 | OTP, email, SMS, inbox, ActiveMQ consumer, WebSocket push |
| `font-end` | 3000 (dev) | React SPA, đăng nhập phone + password, role USER/ADMIN |

## Cấu trúc dự án

```
school-wallet/
├── CLAUDE.md                 # tài liệu này
├── schema.sql                # DDL tổng hợp toàn bộ DB (4 service)
├── .env                      # env DÙNG CHUNG — trùm .env của từng service
├── docs/                     # tài liệu thiết kế (xem mục Docs bên dưới)
├── .tools/                   # plantuml.jar + script báo cáo
│
├── api-gateway/              # com.ldt.gateway
│   └── src/main/java/com/ldt/gateway/
│       ├── config/           # GatewayConfig (routing), SecurityConfig
│       ├── filter/           # AuthGlobalFilter (validate jti + inject header)
│       ├── exception/        # GlobalExceptionHandler, AppException, ErrorCode
│       └── utils/            # JwtUtil (HMAC-SHA512)
│
├── user-service/            # com.ldt.user
│   └── src/main/java/com/ldt/user/
│       ├── config/          # Security, BCrypt, RestTemplate, Jpa(auditing), Cache, EnvLoader
│       ├── context/         # UserContext (ThreadLocal từ header gateway)
│       ├── controller/      # Auth, User, Merchant, Admin, Internal
│       ├── dto/             # auth, kyc, merchant, request, response, wallet
│       ├── enums/           # UserRole, UserStatus, KycStatus, MerchantType, QrCodeType
│       ├── exception/  mapper/  model/  repository/
│       └── service/         # + service/verify (verify OTP token HMAC)
│
├── wallet-service/          # com.ldt.wallet
│   └── src/main/java/com/ldt/wallet/
│       ├── config/  context/  controller/  exception/
│       ├── dto/             # request, response
│       ├── model/           # Wallet, WalletLedger (double-entry)
│       ├── repository/
│       └── service/         # WalletService (transfer/transfer-with-fee), WalletTopupService
│
├── transaction-service/     # com.ldt.transaction
│   └── src/main/java/com/ldt/transaction/
│       ├── config/  context/  controller/  enums/  exception/  mapper/
│       ├── dto/             # payment, request, response, topup, transfer, user
│       ├── event/  producer/ # TransactionNotificationEvent → ActiveMQ
│       ├── model/           # Transaction, TransactionStatusHistory
│       ├── repository/  scheduler/  # TopupCleanupScheduler (DISABLED)
│       └── service/         # TransactionService(V1 read-only), TransactionService2(engine)
│           └── topup/       # TopupService, VnPayService (HMAC-SHA512)
│
├── notification-service/    # com.ldt.notification
│   └── src/main/java/com/ldt/notification/
│       ├── config/          # WebSocketConfig (STOMP /ws), ActiveMQ, Redis
│       ├── consumer/        # TransactionEventConsumer (topic transaction-notification)
│       ├── context/  controller/  dto/  event/  exception/  model/  repository/
│       └── service/         # Otp, Email(SendGrid), SpeedSms, Notification, WebSocketNoti
│
└── font-end/                # React 19 + TS + Vite
    ├── package.json  vite.config.ts  tailwind.config.js  vercel.json
    └── src/
        ├── api/             # axiosClient + authApi/userApi/walletApi/transactionApi/...
        ├── assets/styles/
        ├── components/      # common/ (Button,Input,Loading,Pagination,KycGuard), qr/
        ├── contexts/        # AuthContext (token + full user + refreshUser)
        ├── hooks/           # useAuth
        ├── layouts/         # MainLayout (sidebar user/admin), AuthLayout
        ├── pages/           # user pages + Auth/ + admin/
        ├── routes/          # AppRoutes (PrivateRoute, AdminRoute, GuestRoute)
        ├── types/           # index.ts — toàn bộ interface request/response
        └── utils/           # storage, validators, errorMessage
```

## Build & Run

Mỗi service BE chạy độc lập (cần Postgres, Redis, ActiveMQ đang chạy):

```powershell
# Backend (trong thư mục từng service)
.\mvnw spring-boot:run          # chạy dev
.\mvnw clean package            # build jar

# Frontend (trong font-end/)
npm install
npm run dev                     # Vite dev server (port 3000)
npm run build                   # tsc && vite build
```

## Quy ước & lưu ý quan trọng

- **Env dùng chung:** `EnvLoader` đọc `.env` từ working directory của process → file `.env` ở **gốc repo trùm** `.env` của từng service. Đổi DB password / VNPay creds phải sửa `d:/BE/school-wallet/.env`.
- **Bảo mật nội bộ:** service downstream KHÔNG tự verify JWT. Gateway verify JWT → gọi `/internal/users/validate?jti` (blacklist) → strip rồi inject `X-User-Id/Role/Phone`. Mọi `/internal/**` bảo vệ bằng header `X-Internal-Secret`.
- **JWT:** HS512, claims `sub=userId`, `role`, `phone`, `jti`, exp 3h. Logout = lưu `jti` vào `invalidated_tokens`.
- **`ddl-auto=update` KHÔNG cập nhật CHECK constraint** khi thêm enum value → phải `ALTER TABLE` thủ công (vd `LedgerReason.PLATFORM_FEE`). `schema.sql` hiện thiếu `PLATFORM_FEE` trong CHECK của `wallet_ledger.reason`.
- **Platform fee:** `platform.fee-rate=0.10`, chỉ áp dụng `/merchant/payment`. Customer trả full amount → merchant nhận `amount-fee`, admin (first ADMIN) nhận `fee`. Customer là admin → fee waive về 0.
- **Idempotency:** transfer/topup dùng unique `requestId` (FE generate). Wallet lock 2/3 ví theo UUID ascending tránh deadlock.
- **KYC defense-in-depth:** FE `KycGuard` + BE check `KYC_NOT_VERIFIED` cho sender. Đổi `kycStatus` phải `@CacheEvict(value="users", allEntries=true)`.
- **Thêm endpoint admin:** khai báo ở gateway `SecurityConfig` AND check role trong controller.
- **TransactionService2** là engine production (V1 read-only). `TopupCleanupScheduler` đang DISABLED.

