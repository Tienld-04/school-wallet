# Eureka Server — Service Registry

Danh bạ dịch vụ. Cả 5 service tự đăng ký lúc khởi động và tải danh bạ về cache (30 giây/lần).
Khi cần gọi nhau, chúng tra **cache của chính mình** rồi gọi **trực tiếp** — request không đi qua
service này.

Thực tế chỉ 3 service dùng tới danh bạ: **gateway** (route `lb://` tới 4 service),
**transaction-service** (gọi user qua REST, wallet qua gRPC `discovery:///`) và **user-service**
(gọi wallet, notification). wallet-service và notification-service chỉ đăng ký, không gọi ai.

Port **8761** · Dashboard http://localhost:8761 · Không DB, không đọc `.env`

```powershell
docker compose up -d eureka-server

# Chạy local: phải đứng ở GỐC repo để EnvLoader đọc được .env (cần EUREKA_USER / EUREKA_PASSWORD)
java -jar eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar
```

API registry `/eureka/**` yêu cầu Basic auth (`EurekaAuthFilter`); dashboard `/` để mở.

## Cách 1 — Dashboard

http://localhost:8761 → bảng _Instances currently registered with Eureka_.
Demo: tắt một service → chờ ~90 giây → nó rơi khỏi danh sách.

## Cách 2 — REST API

Mặc định Eureka trả XML, phải xin JSON:

```powershell
$r = Invoke-RestMethod http://localhost:8761/eureka/apps -Headers @{Accept='application/json'}
$apps = @($r.applications.application)
"Tổng: $($apps.Count) service"
$apps | ForEach-Object { "{0,-24} {1} instance [{2}]" -f $_.name, @($_.instance).Count, @($_.instance)[0].status }
```

Endpoint: `/eureka/apps` (toàn bộ), `/eureka/apps/{APP-NAME}` (một service, **tên viết hoa**),
`/eureka/apps/delta` (chỉ phần thay đổi — client dùng mỗi 30 giây).

**Kiểm `gRPC_port`** — cổng 9090 mà `discovery:///wallet-service` dùng nằm trong metadata, không
phải trong cấu hình:

```powershell
@($r.applications.application | Where-Object name -eq 'WALLET-SERVICE').instance.metadata
```

Thiếu `gRPC_port : 9090` thì client quay về cổng 8082 — đâm vào Tomcat, lỗi rất khó hiểu.

## Cách 3 — Góc nhìn client

`http://localhost:8080/actuator/health` → `discoveryComposite.discoveryClient.details.services`
là những gì **gateway thấy trong cache của nó**, fetch 30 giây/lần nên có thể lệch với dashboard.
Khi route `lb://` báo "no instances" mà dashboard vẫn đủ thì xem ở đây.
