import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PinInput from '../common/PinInput';
import { colors } from '../../constants/theme';

export interface SummaryRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface PinConfirmProps {
  title: string;
  rows: SummaryRow[];
  pin: string;
  onChangePin: (pin: string) => void;
  submitting: boolean;
  cancelLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}

const PinConfirm: React.FC<PinConfirmProps> = ({
  title, rows, pin, onChangePin, submitting, cancelLabel, onCancel, onSubmit,
}) => (
  <View>
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Icon name="lock-closed" size={22} color={colors.white} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Nhập mã OTP 6 số của bạn</Text>
    </View>

    <View style={styles.body}>
      <View style={styles.summary}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.summaryRow, i > 0 && styles.summaryDivider]}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text
              style={[styles.summaryValue, row.highlight && styles.summaryHighlight]}
              numberOfLines={1}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.pinLabel}>MÃ OTP</Text>
      <PinInput value={pin} onChange={onChangePin} />

      <View style={styles.buttons}>
        <Button title={cancelLabel} variant="secondary" disabled={submitting} onPress={onCancel} style={styles.flex} />
        <Button
          title="Xác nhận"
          loading={submitting}
          disabled={pin.length < 6}
          onPress={onSubmit}
          style={styles.flex}
        />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingTop: 24,
    paddingBottom: 22,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary[200],
    marginTop: 2,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  summary: {
    backgroundColor: colors.slate[50],
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.slate[400],
  },
  summaryValue: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[800],
    textAlign: 'right',
  },
  summaryHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[600],
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.slate[400],
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default PinConfirm;
