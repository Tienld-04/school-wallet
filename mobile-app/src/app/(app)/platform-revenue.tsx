import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import adminStatsApi from '@/api/adminStatsApi';
import merchantApi from '@/api/merchantApi';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import ScreenScroll from '@/components/layout/ScreenScroll';
import DateRangeFilter, { defaultRange } from '@/components/revenue/DateRangeFilter';
import KpiGrid from '@/components/revenue/KpiGrid';
import type { KpiItem } from '@/components/revenue/KpiGrid';
import MerchantBreakdownList from '@/components/revenue/MerchantBreakdownList';
import MerchantShareCard, { buildTopShares } from '@/components/revenue/MerchantShareCard';
import RevenueChartCard from '@/components/revenue/RevenueChartCard';
import { colors } from '@/constants/theme';
import { formatVND } from '@/utils/format';
import { getErrorMessage } from '@/utils/errorMessage';
import type {
  MerchantResponse,
  MerchantRevenue,
  RevenueOverview,
  RevenueTimeSeriesPoint,
  StatsGranularity,
} from '@/types';

export default function PlatformRevenueScreen() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [range, setRange] = useState(defaultRange);
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<RevenueTimeSeriesPoint[]>([]);
  const [byMerchant, setByMerchant] = useState<MerchantRevenue[]>([]);
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [granularity, setGranularity] = useState<StatsGranularity>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const merchantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    merchants.forEach((m) => map.set(m.merchantId, m.name));
    return map;
  }, [merchants]);

  const resolveMerchantName = useCallback(
    (id: string) => merchantNameMap.get(id) ?? `${id.slice(0, 8)}…`,
    [merchantNameMap],
  );

  const fetchAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [ov, ts, bm] = await Promise.all([
        adminStatsApi.getRevenueOverview(range.from, range.to),
        adminStatsApi.getRevenueTimeSeries(granularity, range.from, range.to),
        adminStatsApi.getRevenueByMerchant(range.from, range.to),
      ]);
      setOverview(ov);
      setTimeSeries(ts);
      setByMerchant(bm);
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tải số liệu doanh thu') });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, range, granularity]);

  useEffect(() => {
    if (!isAdmin) return;
    merchantApi.getAdminMerchants(0, 1000)
      .then((data) => setMerchants(data.content))
      .catch(() => undefined);
  }, [isAdmin]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const points = useMemo(() => timeSeries.map((p) => ({ period: p.period, value: p.revenue })), [timeSeries]);
  const totalRevenue = useMemo(() => byMerchant.reduce((s, m) => s + m.totalRevenue, 0), [byMerchant]);
  const shares = useMemo(
    () => buildTopShares(byMerchant.map((m) => ({
      key: m.merchantId,
      name: resolveMerchantName(m.merchantId),
      value: m.totalRevenue,
    }))),
    [byMerchant, resolveMerchantName],
  );

  if (!isAdmin) {
    return (
      <ScreenScroll>
        <Card>
          <EmptyState icon="lock-closed-outline" title="Chỉ dành cho quản trị viên" />
        </Card>
      </ScreenScroll>
    );
  }

  const kpis: KpiItem[] = [
    {
      label: 'Tổng doanh thu',
      value: overview ? `${formatVND(overview.totalRevenue)}đ` : '—',
      icon: 'cash-outline',
      bg: colors.primary[50],
      color: colors.primary[600],
    },
    {
      label: 'Số giao dịch',
      value: overview ? formatVND(overview.transactionCount) : '—',
      icon: 'grid-outline',
      bg: colors.secondary[50],
      color: colors.secondary[600],
    },
    {
      label: 'Trung bình / giao dịch',
      value: overview ? `${formatVND(overview.averageRevenuePerTx)}đ` : '—',
      icon: 'trending-up-outline',
      bg: colors.amber[50],
      color: colors.amber[600],
    },
    {
      label: 'Top merchant',
      value: overview?.topMerchantId ? resolveMerchantName(overview.topMerchantId) : '—',
      subValue: overview?.topMerchantRevenue ? `${formatVND(overview.topMerchantRevenue)}đ` : undefined,
      icon: 'star-outline',
      bg: colors.emerald[50],
      color: colors.emerald[600],
    },
  ];

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      <DateRangeFilter from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />

      <KpiGrid items={kpis} loading={loading} />

      <RevenueChartCard
        subtitle="Phí nền tảng thu được theo thời gian"
        loading={loading}
        granularity={granularity}
        onGranularityChange={setGranularity}
        points={points}
        barColor={colors.primary[600]}
        accentColor={colors.primary[700]}
        getDetails={(i) => [
          { label: 'Doanh thu', value: `${formatVND(timeSeries[i].revenue)}đ`, strong: true },
          { label: 'Số GD', value: String(timeSeries[i].count) },
        ]}
      />

      <MerchantShareCard title="Top 5 merchant" items={shares} total={totalRevenue} />

      <MerchantBreakdownList
        title="Doanh thu theo merchant"
        emptyText="Không có giao dịch merchant trong khoảng này"
        total={totalRevenue}
        valueColor={colors.slate[800]}
        rows={byMerchant.map((m) => ({
          key: m.merchantId,
          name: resolveMerchantName(m.merchantId),
          value: m.totalRevenue,
          details: [`Số GD: ${formatVND(m.transactionCount)}`],
        }))}
      />
    </ScreenScroll>
  );
}
