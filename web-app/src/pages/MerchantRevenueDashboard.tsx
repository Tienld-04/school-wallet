import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import merchantStatsApi from '../api/merchantStatsApi';
import merchantApi from '../api/merchantApi';
import { getErrorMessage } from '../utils/errorMessage';
import type {
  MerchantBreakdown,
  MerchantEarningsOverview,
  MerchantEarningsTimeSeriesPoint,
  MerchantResponse,
  StatsGranularity,
} from '../types';

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

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PIE_COLORS = ['#4F46E5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#94a3b8'];

const MerchantRevenueDashboard: React.FC = () => {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [from, setFrom] = useState<string>(daysAgo(29));
  const [to, setTo] = useState<string>(today());

  const [overview, setOverview] = useState<MerchantEarningsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<MerchantEarningsTimeSeriesPoint[]>([]);
  const [byMerchant, setByMerchant] = useState<MerchantBreakdown[]>([]);
  const [myMerchants, setMyMerchants] = useState<MerchantResponse[]>([]);
  const [granularity, setGranularity] = useState<StatsGranularity>('day');
  const [loading, setLoading] = useState(true);
  const [merchantsLoaded, setMerchantsLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Map merchantId → name (chỉ từ merchants user sở hữu)
  const merchantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    myMerchants.forEach((m) => map.set(m.merchantId, m.name));
    return map;
  }, [myMerchants]);

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
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ts, bm] = await Promise.all([
        merchantStatsApi.getOverview(from, to),
        merchantStatsApi.getTimeSeries(granularity, from, to),
        merchantStatsApi.getByMerchant(from, to),
      ]);
      setOverview(ov);
      setTimeSeries(ts);
      setByMerchant(bm);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải số liệu doanh thu'));
    } finally {
      setLoading(false);
    }
  }, [from, to, granularity]);

  // Fetch merchants của user — chỉ cần 1 lần
  useEffect(() => {
    const fetchMine = async () => {
      try {
        const data = await merchantApi.getMyMerchants();
        setMyMerchants(data);
      } catch {
        // Bỏ qua: empty state sẽ handle
      } finally {
        setMerchantsLoaded(true);
      }
    };
    fetchMine();
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resolveMerchantName = (id: string) => merchantNameMap.get(id) ?? id.slice(0, 8) + '…';

  const handleExport = async () => {
    if (from > to) {
      // from/to dạng yyyy-MM-dd → so sánh chuỗi = so sánh thời gian.
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    setExporting(true);
    try {
      // overview & byMerchant trong state đã đồng bộ với from/to (fetchAll chạy khi range đổi).
      // Chỉ fetch riêng time series ở mức 'day' để luôn có chi tiết từng ngày,
      // vì biểu đồ có thể đang ở mức 'week'/'month'.
      const daily = await merchantStatsApi.getTimeSeries('day', from, to);
      // Dynamic import: exceljs (nặng) chỉ tải khi user thực sự xuất file.
      const { exportMerchantRevenue } = await import('../utils/exportMerchantRevenue');
      await exportMerchantRevenue({ from, to, overview, daily, byMerchant, resolveMerchantName });
      toast.success('Đã xuất file Excel');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể xuất file Excel'));
    } finally {
      setExporting(false);
    }
  };

  const pieData = useMemo(() => {
    if (byMerchant.length === 0) return [];
    const top5 = byMerchant.slice(0, 5);
    const others = byMerchant.slice(5);
    const data = top5.map((m, i) => ({
      key: m.merchantId,
      name: resolveMerchantName(m.merchantId),
      value: m.netRevenue,
      color: PIE_COLORS[i],
    }));
    if (others.length > 0) {
      const otherSum = others.reduce((s, m) => s + m.netRevenue, 0);
      data.push({
        key: '__others__',
        name: `Khác (${others.length})`,
        value: otherSum,
        color: PIE_COLORS[5],
      });
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byMerchant, merchantNameMap]);

  const totalNetRevenue = useMemo(
    () => byMerchant.reduce((s, m) => s + m.netRevenue, 0),
    [byMerchant],
  );

  // Empty state: đã load merchants nhưng không có
  if (merchantsLoaded && myMerchants.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Doanh thu</h1>
        <p className="text-sm text-slate-500 mb-8">Doanh thu từ các dịch vụ bạn cung cấp</p>
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1">Chưa có dịch vụ nào</p>
          <p className="text-sm text-slate-500">Bạn cần đăng ký merchant trước để xem doanh thu. Liên hệ admin để được tạo merchant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Doanh thu</h1>
          <p className="text-sm text-slate-500">Doanh thu từ các dịch vụ bạn cung cấp</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={loading || exporting}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            title="Xuất doanh thu ra file Excel"
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {exporting ? 'Đang xuất…' : 'Xuất Excel'}
          </button>
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
      </div>

      {/* Filter range */}
      <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
        {(['today', '7d', '30d', 'custom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              preset === p
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {p === 'today' ? 'Hôm nay' : p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : 'Tùy chọn'}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-400" />
            <span className="text-slate-400 text-sm">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-400" />
          </div>
        )}
      </div>

      {/* KPI cards: Gross / Net / Fee / Số GD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard
          label="Tổng khách trả"
          value={overview ? `${formatVND(overview.grossRevenue)}đ` : '—'}
          color="primary"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <KpiCard
          label="Thực nhận vào ví"
          value={overview ? `${formatVND(overview.netRevenue)}đ` : '—'}
          subValue={overview && overview.transactionCount > 0 ? `TB: ${formatVND(overview.averageNetPerTx)}đ/GD` : undefined}
          color="emerald"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <KpiCard
          label="Phí nền tảng"
          value={overview ? `${formatVND(overview.totalFee)}đ` : '—'}
          color="amber"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <KpiCard
          label="Số giao dịch"
          value={overview ? overview.transactionCount.toLocaleString('vi-VN') : '—'}
          subValue={overview && overview.topMerchantId ? `Top: ${resolveMerchantName(overview.topMerchantId)}` : undefined}
          color="secondary"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          }
        />
      </div>

      {/* Bar chart — doanh thu net theo thời gian */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Biểu đồ doanh thu</h3>
            <p className="text-xs text-slate-500 mt-0.5">Thực nhận vào ví theo thời gian (đã trừ phí nền tảng)</p>
          </div>
          <div className="flex items-center gap-1.5">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  granularity === g
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
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
              <BarChart data={timeSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#cbd5e1" />
                <YAxis tickFormatter={formatVNDCompact} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#cbd5e1" />
                <Tooltip content={<MerchantBarTooltip />} />
                <Bar dataKey="netRevenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie + Table breakdown (nếu user có nhiều merchant) */}
      {myMerchants.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Top dịch vụ</h3>
            <div className="h-64">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Không có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                      {pieData.map((entry) => (<Cell key={entry.key} fill={entry.color} />))}
                    </Pie>
                    <Tooltip content={<PieSliceTooltip total={totalNetRevenue} />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Doanh thu theo dịch vụ</h3>
            {byMerchant.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Không có giao dịch trong khoảng này</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-2 py-2.5">#</th>
                      <th className="px-2 py-2.5">Dịch vụ</th>
                      <th className="px-2 py-2.5 text-right">Số GD</th>
                      <th className="px-2 py-2.5 text-right">Khách trả</th>
                      <th className="px-2 py-2.5 text-right">Thực nhận</th>
                      <th className="px-2 py-2.5 text-right">Tỉ lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {byMerchant.map((m, i) => {
                      const pct = totalNetRevenue > 0 ? (m.netRevenue / totalNetRevenue) * 100 : 0;
                      return (
                        <tr key={m.merchantId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-2 py-3 text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-2 py-3 font-medium text-slate-800">{resolveMerchantName(m.merchantId)}</td>
                          <td className="px-2 py-3 text-slate-600 text-right">{m.transactionCount.toLocaleString('vi-VN')}</td>
                          <td className="px-2 py-3 text-slate-600 text-right">{formatVND(m.grossRevenue)}đ</td>
                          <td className="px-2 py-3 font-semibold text-emerald-700 text-right">{formatVND(m.netRevenue)}đ</td>
                          <td className="px-2 py-3 text-slate-500 text-right">{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
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
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>{icon}</div>
      </div>
      {loading ? (
        <div className="h-7 w-2/3 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
          {subValue && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subValue}</p>}
        </>
      )}
    </div>
  );
};

interface BarTooltipPayload {
  payload: MerchantEarningsTimeSeriesPoint;
}

const MerchantBarTooltip: React.FC<{ active?: boolean; payload?: BarTooltipPayload[] }> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
      <p className="text-slate-500 mb-1">{p.period}</p>
      <p className="text-slate-600">Khách trả: <span className="font-semibold">{formatVND(p.grossRevenue)}đ</span></p>
      <p className="text-emerald-700 font-semibold">Thực nhận: {formatVND(p.netRevenue)}đ</p>
      <p className="text-slate-500">Số GD: {p.count}</p>
    </div>
  );
};

interface PieDatum {
  key: string;
  name: string;
  value: number;
  color: string;
}

interface PieSlicePayload {
  name: string;
  value: number;
  payload: PieDatum;
}

const PieSliceTooltip: React.FC<{ active?: boolean; payload?: PieSlicePayload[]; total: number }> = ({ active, payload, total }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const pct = total > 0 ? (p.value / total) * 100 : 0;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
      <p className="font-semibold mb-0.5" style={{ color: p.color }}>{p.name}</p>
      <p className="text-slate-600">{formatVND(p.value)}đ <span className="text-slate-400 ml-1">({pct.toFixed(1)}%)</span></p>
    </div>
  );
};

export default MerchantRevenueDashboard;
