import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import DonutChart from '../charts/DonutChart';
import { colors } from '../../constants/theme';

const PIE_COLORS = ['#4F46E5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#94a3b8'];

export interface ShareInput {
  key: string;
  name: string;
  value: number;
}

export interface ShareItem extends ShareInput {
  color: string;
}

export const buildTopShares = (items: ShareInput[]): ShareItem[] => {
  const top5: ShareItem[] = items.slice(0, 5).map((item, i) => ({ ...item, color: PIE_COLORS[i] }));
  const others = items.slice(5);
  if (others.length > 0) {
    top5.push({
      key: '__others__',
      name: `Khác (${others.length})`,
      value: others.reduce((sum, item) => sum + item.value, 0),
      color: PIE_COLORS[5],
    });
  }
  return top5;
};

interface MerchantShareCardProps {
  title: string;
  items: ShareItem[];
  total: number;
}

const MerchantShareCard: React.FC<MerchantShareCardProps> = ({ title, items, total }) => (
  <Card style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    {items.length === 0 ? (
      <Text style={styles.emptyText}>Không có dữ liệu</Text>
    ) : (
      <View style={styles.row}>
        <DonutChart data={items} />
        <View style={styles.legend}>
          {items.map((item) => (
            <View key={item.key} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.legendPct}>
                {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
  },
  emptyText: {
    fontSize: 13,
    color: colors.slate[400],
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    color: colors.slate[700],
  },
  legendPct: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[800],
  },
});

export default MerchantShareCard;
