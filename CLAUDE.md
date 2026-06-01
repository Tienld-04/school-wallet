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

> Lưu ý chung: hầu hết **enum** (UserRole, WalletType, TransactionStatus, NotificationType…) nằm trong `model/` cùng entity, **không** ở thư mục `enums/`. Mỗi service đều tự có `ApiSecurityFilter` (đọc header `X-User-*` → `UserContext`) và package `exception/` (AppException, ErrorCode, ErrorResponse, GlobalExceptionHandler).

```
school-wallet/
├── CLAUDE.md                 # tài liệu này
├── schema.sql                # DDL tổng hợp toàn bộ DB (4 service có DB)
├── .env                      # env DÙNG CHUNG — trùm .env của từng service
├── docs/                     # tài liệu thiết kế (xem mục Docs bên dưới)
├── .tools/                   # plantuml.jar + script báo cáo
│
├── api-gateway/             # com.ldt.gateway — không có DB
│   └── src/main/java/com/ldt/gateway/
│       ├── ApiGatewayApplication.java
│       ├── config/          # GatewayConfig (routing), SecurityConfig (JWT resource server), CorsConfig
│       ├── filter/          # AuthGlobalFilter (validate jti + strip & inject X-User-*)
│       ├── exception/       # AppException, ErrorCode, ErrorResponse, GlobalExceptionHandler
│       └── utils/           # JwtUtil (HMAC-SHA512), EnvLoader
│
├── user-service/            # com.ldt.user — DB user_service
│   └── src/main/java/com/ldt/user/
│       ├── config/          # ApiSecurityFilter, InternalSecretFilter, BCryptConfig, CacheConfig, JpaConfig(auditing), RestTemplateConfig, EnvLoader
│       ├── context/         # UserContext (ThreadLocal từ header gateway)
│       ├── controller/      # Auth, User, Merchant, Admin, InternalUser
│       ├── dto/             # auth/, kyc/, merchant/, request/, response/, wallet/
│       ├── enums/           # QrCodeType (CHỈ enum này ở đây)
│       ├── mapper/          # UserMapper
│       ├── model/           # entity: User, UserKyc, Merchant, InvalidatedToken
│       │                    # enum:   UserRole, UserStatus, KycStatus, MerchantType
│       ├── repository/      # User, UserKyc, Merchant, InvalidatedToken
│       └── service/         # Auth, User, Admin, Jwt, Kyc, Merchant, InternalUser
│           └── verify/      # VerifyOTPTokenService (verify OTP token HMAC)
│
├── wallet-service/          # com.ldt.wallet — DB wallet_service
│   └── src/main/java/com/ldt/wallet/
│       ├── config/          # ApiSecurityFilter, InternalSecretFilter, JpaConfig, RestTemplateConfig, EnvLoader
│       ├── context/         # UserContext
│       ├── controller/      # WalletController (/api/wallets), InternalWalletController (/internal/wallets)
│       ├── dto/             # request/ (Create, Topup, Transfer, TransferWithFee), response/ (Balance, LedgerEntry, Wallet, Page)
│       ├── model/           # entity: Wallet, WalletLedger (double-entry)
│       │                    # enum:   LedgerDirection, LedgerReason, WalletStatus, WalletType
│       ├── repository/      # Wallet, WalletLedger
│       └── service/         # WalletService (transfer / transfer-with-fee), WalletTopupService
│
├── transaction-service/     # com.ldt.transaction — DB transaction_service
│   └── src/main/java/com/ldt/transaction/
│       ├── config/          # ApiSecurityFilter, JpaConfig, RestTemplateConfig, EnvLoader
│       ├── context/         # UserContext
│       ├── controller/      # TransactionController (transfer, payment, history, detail, dashboard, topup)
│       ├── dto/             # (gốc: TransactionResponse, TransferRequest) + payment/ request/ response/ topup/ transfer/ user/
│       ├── enums/           # VnPayIpnCode, VnPayTransactionCode
│       ├── event/           # TransactionNotificationEvent
│       ├── producer/        # TransactionEventProducer → ActiveMQ topic transaction-notification
│       ├── mapper/          # TransactionMapper
│       ├── model/           # entity: Transaction, TransactionStatusHistory
│       │                    # enum:   TransactionStatus, TransactionType
│       ├── repository/      # Transaction, TransactionStatusHistory
│       ├── scheduler/       # TopupCleanupScheduler (DISABLED)
│       └── service/         # TransactionService (V1 read-only), TransactionService2 (engine),
│           │                # TransactionStatsService, RevenueStatsService, TransactionStatusHistoryService
│           └── topup/       # TopupService, VnPayService (HMAC-SHA512)
│
├── notification-service/    # com.ldt.notification — DB notification_service
│   └── src/main/java/com/ldt/notification/
│       ├── config/          # ApiSecurityFilter, JmsConfig (ActiveMQ), RedisConfig, WebSocketConfig (STOMP /ws), BCryptConfig, RestTemplateConfig, EnvLoader
│       ├── consumer/        # TransactionEventConsumer (listen topic transaction-notification)
│       ├── context/         # UserContext
│       ├── controller/      # NotificationController (inbox), OtpController, InternalNotificationController (send-email)
│       ├── dto/             # NotificationResponse, OtpSend/Verify(+Response), SendEmailRequest
│       ├── event/           # TransactionNotificationEvent
│       ├── model/           # entity: Notification, NotificationLog
│       │                    # enum:   NotificationChannel, NotificationDirection, NotificationSource, NotificationStatus, NotificationType
│       ├── repository/      # Notification, NotificationLog
│       └── service/         # Otp, Email (SendGrid), SpeedSms, Notification, NotificationTransaction, NotificationLog, WebSocketNoti
│
└── font-end/                # React 19 + TS + Vite (dev port 3000)
    ├── package.json  vite.config.ts  tailwind.config.js  tsconfig.json  vercel.json  index.html
    └── src/
        ├── main.tsx  App.tsx  index.css  vite-env.d.ts
        ├── api/             # axiosClient + authApi, userApi, walletApi, transactionApi,
        │                    #   merchantApi, merchantStatsApi, adminApi, adminStatsApi, otpApi
        ├── components/
        │   ├── common/      # Button/, Input/, Loading/, Pagination/, KycGuard.tsx
        │   └── qr/          # MyQrCard, QrScanner, QrTransferScreen
        ├── contexts/        # AuthContext (token + full user + refreshUser)
        ├── hooks/           # useAuth
        ├── layouts/         # MainLayout (sidebar user/admin), AuthLayout
        ├── pages/           # USER: Dashboard, Transfer, Payment, TopUp, TopUpResult,
        │   │                #       TransactionHistory, TransactionLookup, MyMerchants,
        │   │                #       MerchantRevenueDashboard, Profile
        │   ├── Auth/        # Login, Register, ForgotPassword
        │   └── admin/       # StatsDashboard, RevenueDashboard, UserManagement, MerchantManagement, KycManagement
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

## Quy tắc làm việc (BẮT BUỘC)

- **Xin phê duyệt trước khi code:** Trước khi viết/sửa code mới hoặc chạy subagent để thực thi, PHẢI trình bày kế hoạch (định làm gì, file nào, cách tiếp cận) và **hỏi ý kiến + chờ tôi đồng ý** rồi mới bắt đầu. KHÔNG tự ý code hay spawn agent khi chưa được duyệt.
- Tác vụ chỉ đọc/khảo sát (đọc file, search, giải thích) thì không cần hỏi.

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

