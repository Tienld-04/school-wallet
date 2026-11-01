import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import merchantApi from '@/api/merchantApi';
import merchantStatsApi from '@/api/merchantStatsApi';
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
  MerchantBreakdown,
  MerchantEarningsOverview,
  MerchantEarningsTimeSeriesPoint,
  MerchantResponse,
  StatsGranularity,
} from '@/types';

export default function MerchantRevenueScreen() {
  const [range, setRange] = useState(defaultRange);
  const [overview, setOverview] = useState<MerchantEarningsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<MerchantEarningsTimeSeriesPoint[]>([]);
  const [byMerchant, setByMerchant] = useState<MerchantBreakdown[]>([]);
  const [myMerchants, setMyMerchants] = useState<MerchantResponse[]>([]);
  const [granularity, setGranularity] = useState<StatsGranularity>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [merchantsLoaded, setMerchantsLoaded] = useState(false);

  const merchantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    myMerchants.forEach((m) => map.set(m.merchantId, m.name));
    return map;
  }, [myMerchants]);

  const resolveMerchantName = useCallback(
    (id: string) => merchantNameMap.get(id) ?? `${id.slice(0, 8)}…`,
    [merchantNameMap],
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ts, bm] = await Promise.all([
        merchantStatsApi.getOverview(range.from, range.to),
        merchantStatsApi.getTimeSeries(granularity, range.from, range.to),
        merchantStatsApi.getByMerchant(range.from, range.to),
      ]);
      setOverview(ov);
      setTimeSeries(ts);
      setByMerchant(bm);
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tải số liệu doanh thu') });
    } finally {
      setLoading(false);
    }
  }, [range, granularity]);

  useEffect(() => {
    merchantApi.getMyMerchants()
      .then(setMyMerchants)
      .catch(() => undefined)
      .finally(() => setMerchantsLoaded(true));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const points = useMemo(() => timeSeries.map((p) => ({ period: p.period, value: p.netRevenue })), [timeSeries]);
  const totalNetRevenue = useMemo(() => byMerchant.reduce((s, m) => s + m.netRevenue, 0), [byMerchant]);
  const shares = useMemo(
    () => buildTopShares(byMerchant.map((m) => ({
      key: m.merchantId,
      name: resolveMerchantName(m.merchantId),
      value: m.netRevenue,
    }))),
    [byMerchant, resolveMerchantName],
  );

  const kpis: KpiItem[] = [
    {
      label: 'Tổng khách trả',
      value: overview ? `${formatVND(overview.grossRevenue)}đ` : '—',
      icon: 'cash-outline',
      bg: colors.primary[50],
      color: colors.primary[600],
    },
    {
      label: 'Thực nhận vào ví',
      value: overview ? `${formatVND(overview.netRevenue)}đ` : '—',
      subValue: overview && overview.transactionCount > 0 ? `TB: ${formatVND(overview.averageNetPerTx)}đ/GD` : undefined,
      icon: 'checkmark-done-outline',
      bg: colors.emerald[50],
      color: colors.emerald[600],
    },
    {
      label: 'Phí nền tảng',
      value: overview ? `${formatVND(overview.totalFee)}đ` : '—',
      icon: 'pulse-outline',
      bg: colors.amber[50],
      color: colors.amber[600],
    },
    {
      label: 'Số giao dịch',
      value: overview ? formatVND(overview.transactionCount) : '—',
      subValue: overview?.topMerchantId ? `Top: ${resolveMerchantName(overview.topMerchantId)}` : undefined,
      icon: 'grid-outline',
      bg: colors.secondary[50],
      color: colors.secondary[600],
    },
  ];

  if (merchantsLoaded && myMerchants.length === 0) {
    return (
      <ScreenScroll>
        <Card>
          <EmptyState
            icon="storefront-outline"
            title="Chưa có dịch vụ nào"
            subtitle="Bạn cần đăng ký merchant trước để xem doanh thu. Liên hệ admin để được tạo merchant."
          />
        </Card>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      <DateRangeFilter from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />

      <KpiGrid items={kpis} loading={loading} />

      <RevenueChartCard
        subtitle="Thực nhận vào ví theo thời gian (đã trừ phí nền tảng)"
        loading={loading}
        granularity={granularity}
        onGranularityChange={setGranularity}
        points={points}
        barColor={colors.secondary[500]}
        accentColor={colors.emerald[700]}
        getDetails={(i) => [
          { label: 'Khách trả', value: `${formatVND(timeSeries[i].grossRevenue)}đ` },
          { label: 'Thực nhận', value: `${formatVND(timeSeries[i].netRevenue)}đ`, strong: true },
          { label: 'Số GD', value: String(timeSeries[i].count) },
        ]}
      />

      {myMerchants.length > 1 && (
        <>
          <MerchantShareCard title="Top dịch vụ" items={shares} total={totalNetRevenue} />
          <MerchantBreakdownList
            title="Doanh thu theo dịch vụ"
            emptyText="Không có giao dịch trong khoảng này"
            total={totalNetRevenue}
            valueColor={colors.emerald[700]}
            rows={byMerchant.map((m) => ({
              key: m.merchantId,
              name: resolveMerchantName(m.merchantId),
              value: m.netRevenue,
              details: [`Số GD: ${formatVND(m.transactionCount)}`, `Khách trả: ${formatVND(m.grossRevenue)}đ`],
            }))}
          />
        </>
      )}
    </ScreenScroll>
  );
}
