import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import Icon from '../common/Icon';
import { colors } from '../../constants/theme';
import { formatVND } from '../../utils/format';

export interface BreakdownRow {
  key: string;
  name: string;
  value: number;
  details: string[];
}

interface MerchantBreakdownListProps {
  title: string;
  emptyText: string;
  rows: BreakdownRow[];
  total: number;
  valueColor: string;
}

const MerchantBreakdownList: React.FC<MerchantBreakdownListProps> = ({ title, emptyText, rows, total, valueColor }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        rows.map((row, i) => {
          const isExpanded = expanded === row.key;
          const pct = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <Pressable
              key={row.key}
              onPress={() => setExpanded(isExpanded ? null : row.key)}
              style={[styles.row, i > 0 && styles.divider]}
            >
              <View style={styles.main}>
                <Text style={styles.index}>{i + 1}</Text>
                <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
                <Text style={[styles.value, { color: valueColor }]}>{formatVND(row.value)}đ</Text>
                <Text style={styles.pct}>{pct.toFixed(1)}%</Text>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.slate[400]} />
              </View>
              {isExpanded && (
                <View style={styles.details}>
                  {row.details.map((d) => (
                    <Text key={d} style={styles.detailText}>{d}</Text>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.slate[400],
    textAlign: 'center',
    paddingBottom: 16,
  },
  row: {
    paddingVertical: 12,
    gap: 6,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  index: {
    width: 18,
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate[400],
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[800],
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  pct: {
    width: 44,
    fontSize: 12,
    color: colors.slate[500],
    textAlign: 'right',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingLeft: 26,
  },
  detailText: {
    fontSize: 12,
    color: colors.slate[500],
  },
});

export default MerchantBreakdownList;
