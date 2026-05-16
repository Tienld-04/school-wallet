# Admin — Dashboard Thống kê

**FE:** [font-end/src/pages/admin/StatsDashboard.tsx](../font-end/src/pages/admin/StatsDashboard.tsx)
**BE chính:** transaction-service (`TransactionStatsService`)

## Tóm tắt

Trang `/admin/stats` (chỉ admin) hiển thị:
- KPI tổng (số giao dịch, volume, fee, success rate).
- Biểu đồ time-series (số giao dịch + volume theo ngày/tuần/tháng).
- Breakdown theo type (TRANSFER/PAYMENT/TOPUP) và status (PENDING/SUCCESS/FAILED/CANCELLED).

Filter range: `today`, `7d`, `30d` (default), `custom`. Granularity time-series: `day` (default) / `week` / `month`.

## Sequence

```
FE (StatsDashboard.tsx)             Gateway              transaction-service
 │                                       │                       │
 │ Mount → fetchAll                                              │
 │ Promise.all([                                                 │
 │   GET /transactions/dashboard/overview?from=&to=,             │
 │   GET /transactions/dashboard/timeseries?granularity=&from=&to=
 │ ])                                                            │
 │ ──────────────────────────────────────►── verify role=ADMIN  │
 │                                            (gateway gate)     │
 │                                            stats service:      │
 │                                            - 3 native query (KPI gộp + 2 group-by)
 │                                            - 1 native query time-series
 │ ◄ {StatsOverview, TimeSeriesPoint[]} ──                       │
 │                                                                │
 │ Render LineChart (recharts) + KPI cards + breakdown tables   │
```

## API gọi

| Path | Mã FE | Auth |
|---|---|---|
| `GET /api/v1/transactions/dashboard/overview?from=&to=` | `adminStatsApi.getOverview(from, to)` | ADMIN (gateway gate) |
| `GET /api/v1/transactions/dashboard/timeseries?granularity=&from=&to=` | `adminStatsApi.getTimeSeries(granularity, from, to)` | ADMIN |

Date format: `yyyy-MM-dd` (ISO LocalDate).

## Logic BE — Overview

`TransactionController.getDashboardOverview(from, to)`:
- Default: `from = today - 29 ngày`, `to = today`.
- `fromDt = fromDate.atStartOfDay()`, `toDt = toDate.atTime(LocalTime.MAX)`.

`TransactionStatsService.getOverview(fromDt, toDt)`:
1. **3 query song song:**
   - `aggregateOverviewKpis` — 1 native query `SELECT count(*), count(*) FILTER (WHERE status='SUCCESS'), count FILTER (WHERE status='FAILED'), COALESCE(SUM(amount),0), COALESCE(SUM(fee),0) FROM transactions WHERE created_at BETWEEN ? AND ?`. Trả `[total, success, failed, volume, fee]`.
   - `countGroupByType` — `SELECT transaction_type, COUNT(*) GROUP BY type`.
   - `countGroupByStatus` — `SELECT status, COUNT(*) GROUP BY status`.
2. Tính `successRate = successCount / total` (0 nếu total=0).
3. Map result thành `byType` và `byStatus` bằng EnumMap để fill 0 cho key thiếu.
4. Build `StatsOverviewResponse`.

**Lưu ý:** `aggregateByStatus` và `aggregateByType` dùng `EnumMap` ép nhận `(TransactionType / TransactionStatus, Long)` — nếu native query trả tên enum dạng String thì cast sẽ fail. Cách hoạt động hiện tại dựa trên việc Hibernate tự convert column varchar về enum khi map qua `@Enumerated(EnumType.STRING)`, kèm cấu hình query repository.

Response:
```json
{
  "totalTransactions": 1234,
  "totalVolume": 1500000000,
  "totalFee": 15000000,
  "successCount": 1180,
  "failedCount": 30,
  "successRate": 0.956,
  "byType": { "TRANSFER": 800, "PAYMENT": 400, "TOPUP": 34 },
  "byStatus": { "PENDING": 5, "SUCCESS": 1180, "FAILED": 30, "CANCELLED": 19 }
}
```

## Logic BE — TimeSeries

`TransactionStatsService.getTimeSeries(fromDt, toDt, granularity)`:
1. Validate `granularity ∈ {day, week, month}`. Sai → `INVALID_REQUEST`.
2. `repo.aggregateTimeSeries(g, fromDt, toDt)` — native query group bởi `DATE_TRUNC(:granularity, created_at)`.
3. Map mỗi row `[Timestamp, count, volume]` → `TimeSeriesPoint{period: yyyy-MM-dd, count, volume}`.

Response:
```json
[
  {"period": "2026-04-01", "count": 30, "volume": 5000000},
  {"period": "2026-04-02", "count": 25, "volume": 4200000},
  ...
]
```

## FE filter / range presets

```ts
type RangePreset = 'today' | '7d' | '30d' | 'custom';
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => /* ... */;

applyPreset(p):
  today  → from=to=today
  7d     → from=daysAgo(6), to=today
  30d    → from=daysAgo(29), to=today
  custom → user nhập tay 2 input date
```

`useEffect` watch `[from, to, granularity]` → trigger `fetchAll`.

## FE — render

- 4 KPI cards: Tổng GD, Volume, Phí, Tỉ lệ thành công (%).
- 1 LineChart (recharts) — `XAxis dataKey="period"`, 2 line `count` + `volume` (formatted compact `K/M/B`).
- Bảng breakdown by type và by status với màu pastel theo enum.

## Side-effects

Không có (pure read).

## Bảo mật

- Cả 2 endpoint được gateway gate `hasAuthority('ADMIN')` (xem `SecurityConfig`):
  ```
  .pathMatchers("/api/v1/transactions/dashboard/**").hasAuthority("ADMIN")
  ```
- Controller cũng có second check `if (!"ADMIN".equals(UserContext.getRole())) throw ACCESS_DENIED;` (defense in depth).

## Hiệu năng

- Range default 30 ngày, 4 native query → response ms.
- Range > 30 ngày, granularity=day → có thể nhiều TimeSeriesPoint nhưng vẫn nhanh nhờ index `idx_created_at`.
- Nếu data lớn (>1M tx/tháng), nên cân nhắc pre-aggregate sang bảng riêng + materialized view.
