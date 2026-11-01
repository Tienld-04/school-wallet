import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import BarChart from '../charts/BarChart';
import { colors } from '../../constants/theme';
import { formatShortDate, isoToDisplayDate } from '../../utils/format';
import type { StatsGranularity } from '../../types';

const GRANULARITIES: { key: StatsGranularity; label: string }[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

export interface ChartPoint {
  period: string;
  value: number;
}

export interface ChartDetail {
  label: string;
  value: string;
  strong?: boolean;
}

interface RevenueChartCardProps {
  subtitle: string;
  loading: boolean;
  granularity: StatsGranularity;
  onGranularityChange: (granularity: StatsGranularity) => void;
  points: ChartPoint[];
  getDetails: (index: number) => ChartDetail[];
  barColor: string;
  accentColor: string;
}

const RevenueChartCard: React.FC<RevenueChartCardProps> = ({
  subtitle, loading, granularity, onGranularityChange, points, getDetails, barColor, accentColor,
}) => {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [points]);

  const barData = useMemo(
    () => points.map((p) => ({ key: p.period, label: formatShortDate(p.period), value: p.value })),
    [points],
  );

  const selectedPoint = selected !== null ? points[selected] : null;

  return (
    <Card style={styles.card}>
      <View>
        <Text style={styles.title}>Biểu đồ doanh thu</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.segment}>
        {GRANULARITIES.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => onGranularityChange(g.key)}
            style={[styles.segmentItem, granularity === g.key && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, granularity === g.key && styles.segmentTextActive]}>{g.label}</Text>
          </Pressable>
        ))}
      </View>

      {selectedPoint && selected !== null ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipPeriod}>{isoToDisplayDate(selectedPoint.period) || selectedPoint.period}</Text>
          {getDetails(selected).map((d) => (
            <Text key={d.label} style={[styles.tooltipText, d.strong && { color: accentColor, fontWeight: '600' }]}>
              {d.label}: {d.value}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Chạm vào cột để xem chi tiết</Text>
      )}

      {loading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : points.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>Không có dữ liệu trong khoảng thời gian này</Text>
        </View>
      ) : (
        <BarChart data={barData} color={barColor} selectedIndex={selected} onSelect={setSelected} />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
  },
  subtitle: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: 10,
    backgroundColor: colors.slate[100],
  },
  segmentItem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentItemActive: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate[500],
  },
  segmentTextActive: {
    color: colors.primary[700],
  },
  tooltip: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.slate[50],
    gap: 2,
  },
  tooltipPeriod: {
    fontSize: 12,
    color: colors.slate[500],
    marginBottom: 2,
  },
  tooltipText: {
    fontSize: 12,
    color: colors.slate[600],
  },
  hint: {
    fontSize: 12,
    color: colors.slate[400],
  },
  placeholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.slate[400],
    textAlign: 'center',
  },
});

export default RevenueChartCard;
