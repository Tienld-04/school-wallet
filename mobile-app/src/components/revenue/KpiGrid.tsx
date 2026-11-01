import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '../common/Icon';
import type { IconName } from '../common/Icon';
import { colors } from '../../constants/theme';

export interface KpiItem {
  label: string;
  value: string;
  subValue?: string;
  icon: IconName;
  bg: string;
  color: string;
}

const KpiCard: React.FC<KpiItem & { loading: boolean }> = ({ label, value, subValue, icon, bg, color, loading }) => (
  <View style={styles.kpi}>
    <View style={styles.header}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
    </View>
    {loading ? (
      <View style={styles.skeleton} />
    ) : (
      <>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {!!subValue && <Text style={styles.sub} numberOfLines={1}>{subValue}</Text>}
      </>
    )}
  </View>
);

const KpiGrid: React.FC<{ items: KpiItem[]; loading: boolean }> = ({ items, loading }) => {
  const rows: KpiItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.map((item) => item.label).join('|')} style={styles.row}>
          {row.map((item) => (
            <KpiCard key={item.label} {...item} loading={loading} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate[100],
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate[500],
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  sub: {
    fontSize: 11,
    color: colors.slate[400],
  },
  skeleton: {
    height: 20,
    width: '70%',
    borderRadius: 6,
    backgroundColor: colors.slate[100],
  },
});

export default KpiGrid;
