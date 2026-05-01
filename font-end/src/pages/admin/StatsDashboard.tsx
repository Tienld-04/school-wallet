import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import adminStatsApi from '../../api/adminStatsApi';
import { getErrorMessage } from '../../utils/errorMessage';
import type { StatsOverview, TimeSeriesPoint, StatsGranularity } from '../../types';

type RangePreset = 'today' | '7d' | '30d' | 'custom';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

const formatVNDCompact = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán dịch vụ',
  TOPUP: 'Nạp tiền',
};

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  SUCCESS: { bg: 'bg-secondary-50', text: 'text-secondary-700', label: 'Thành công' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Đang xử lý' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Thất bại' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Đã hủy' },
};

const StatsDashboard: React.FC = () => {
  // Range filter state
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [from, setFrom] = useState<string>(daysAgo(29));
  const [to, setTo] = useState<string>(today());

  // Stats data state
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [granularity, setGranularity] = useState<StatsGranularity>('day');
  const [loading, setLoading] = useState(true);

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    if (p === 'today') {
      const t = today();
      setFrom(t);
      setTo(t);
    } else if (p === '7d') {
      setFrom(daysAgo(6));
      setTo(today());
    } else if (p === '30d') {
      setFrom(daysAgo(29));
      setTo(today());
    }
    // custom → giữ nguyên from/to hiện tại, user tự chỉnh
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ts] = await Promise.all([
        adminStatsApi.getOverview(from, to),
        adminStatsApi.getTimeSeries(granularity, from, to),
      ]);
      setOverview(ov);
      setTimeSeries(ts);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải số liệu thống kê'));
    } finally {
      setLoading(false);
    }
  }, [from, to, granularity]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const presetBtn = (p: RangePreset, label: string) => (
    <button
      onClick={() => applyPreset(p)}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
        preset === p
          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  const granBtn = (g: StatsGranularity, label: string) => (
    <button
      onClick={() => setGranularity(g)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        granularity === g
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Thống kê</h1>
          <p className="text-sm text-slate-500">Tổng quan giao dịch trên hệ thống</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 disabled:opacity-50"
          title="Tải lại"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </div>

      {/* Filter range */}
      <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
        {presetBtn('today', 'Hôm nay')}
        {presetBtn('7d', '7 ngày')}
        {presetBtn('30d', '30 ngày')}
        {presetBtn('custom', 'Tùy chọn')}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-400"
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-400"
            />
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard
          label="Tổng giao dịch"
          value={overview ? overview.totalTransactions.toLocaleString('vi-VN') : '—'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          }
          color="primary"
          loading={loading}
        />
        <KpiCard
          label="Tổng giá trị"
          value={overview ? `${formatVND(overview.totalVolume)}đ` : '—'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          color="secondary"
          loading={loading}
        />
        <KpiCard
          label="Phí thu được"
          value={overview ? `${formatVND(overview.totalFee)}đ` : '—'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          color="emerald"
          loading={loading}
        />
        <KpiCard
          label="Tỉ lệ thành công"
          value={
            overview
              ? `${(overview.successRate * 100).toFixed(1)}%`
              : '—'
          }
          subValue={
            overview
              ? `${overview.successCount} / ${overview.totalTransactions}`
              : undefined
          }
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          color="amber"
          loading={loading}
        />
      </div>

      {/* Time-series chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Biểu đồ giao dịch</h3>
            <p className="text-xs text-slate-500 mt-0.5">Volume các giao dịch thành công theo thời gian</p>
          </div>
          <div className="flex items-center gap-1.5">
            {granBtn('day', 'Ngày')}
            {granBtn('week', 'Tuần')}
            {granBtn('month', 'Tháng')}
          </div>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : timeSeries.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tickFormatter={formatVNDCompact}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4F46E5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By type */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Phân loại theo loại</h3>
          {overview ? (
            <ul className="space-y-2.5">
              {Object.entries(overview.byType).map(([type, count]) => (
                <li key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{typeLabel[type] || type}</span>
                  <span className="font-semibold text-slate-800">{count.toLocaleString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>

        {/* By status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Phân loại theo trạng thái</h3>
          {overview ? (
            <ul className="space-y-2.5">
              {Object.entries(overview.byStatus).map(([status, count]) => {
                const s = statusStyle[status];
                return (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${s?.bg || 'bg-slate-100'} ${s?.text || 'text-slate-600'}`}>
                      {s?.label || status}
                    </span>
                    <span className="font-semibold text-slate-800">{count.toLocaleString('vi-VN')}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>
      </div>
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'amber' | 'emerald';
  loading: boolean;
}

const colorMap = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600' },
  secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, subValue, icon, color, loading }) => {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-2/3 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
          {subValue && <p className="text-[11px] text-slate-400 mt-0.5">{subValue}</p>}
        </>
      )}
    </div>
  );
};

interface TooltipPayload {
  payload: TimeSeriesPoint;
}

const ChartTooltip: React.FC<{ active?: boolean; payload?: TooltipPayload[] }> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
      <p className="text-slate-500 mb-1">{p.period}</p>
      <p className="font-semibold text-primary-700">
        Volume: {formatVND(p.volume)}đ
      </p>
      <p className="text-slate-600">Số GD: {p.count}</p>
    </div>
  );
};

export default StatsDashboard;
