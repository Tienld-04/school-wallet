import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface InfoRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  last?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, children, last }) => (
  <View style={[styles.row, !last && styles.divider]}>
    <Text style={styles.label}>{label}</Text>
    {children ?? (
      <Text style={styles.value} numberOfLines={2}>
        {value || '—'}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  label: {
    fontSize: 14,
    color: colors.slate[500],
  },
  value: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[800],
    textAlign: 'right',
  },
});

export default InfoRow;
