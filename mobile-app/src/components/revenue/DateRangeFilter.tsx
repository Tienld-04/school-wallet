import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import { colors } from '../../constants/theme';
import { displayToIsoDate, isoDaysAgo, isoToDisplayDate, maskDateInput } from '../../utils/format';

type RangePreset = 'today' | '7d' | '30d' | 'custom';

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: 'custom', label: 'Tùy chọn' },
];

export const defaultRange = () => ({ from: isoDaysAgo(29), to: isoDaysAgo(0) });

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ from, to, onChange }) => {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    if (p === 'today') onChange(isoDaysAgo(0), isoDaysAgo(0));
    else if (p === '7d') onChange(isoDaysAgo(6), isoDaysAgo(0));
    else if (p === '30d') onChange(isoDaysAgo(29), isoDaysAgo(0));
    else {
      setCustomFrom(isoToDisplayDate(from));
      setCustomTo(isoToDisplayDate(to));
    }
  };

  const applyCustomRange = () => {
    const f = displayToIsoDate(customFrom);
    const t = displayToIsoDate(customTo);
    if (!f || !t) {
      Toast.show({ type: 'error', text1: 'Ngày không hợp lệ (dd/mm/yyyy)' });
      return;
    }
    if (f > t) {
      Toast.show({ type: 'error', text1: 'Ngày bắt đầu phải trước ngày kết thúc' });
      return;
    }
    onChange(f, t);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => applyPreset(p.key)}
            style={[styles.chip, preset === p.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, preset === p.key && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {preset === 'custom' && (
        <Card style={styles.customCard}>
          <View style={styles.customRow}>
            <View style={styles.flex}>
              <Input
                label="Từ ngày"
                value={customFrom}
                onChangeText={(v) => setCustomFrom(maskDateInput(v))}
                placeholder="dd/mm/yyyy"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.flex}>
              <Input
                label="Đến ngày"
                value={customTo}
                onChangeText={(v) => setCustomTo(maskDateInput(v))}
                placeholder="dd/mm/yyyy"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>
          <Button title="Áp dụng" onPress={applyCustomRange} />
        </Card>
      )}

      <Text style={styles.rangeText}>
        {isoToDisplayDate(from)} → {isoToDisplayDate(to)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[600],
  },
  chipTextActive: {
    color: colors.white,
  },
  customCard: {
    gap: 12,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeText: {
    fontSize: 12,
    color: colors.slate[400],
  },
});

export default DateRangeFilter;
