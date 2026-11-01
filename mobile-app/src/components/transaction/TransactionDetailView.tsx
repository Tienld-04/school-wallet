import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import { TRANSACTION_STATUS } from '../../constants/status';
import { colors } from '../../constants/theme';
import { formatDateTime, formatVND } from '../../utils/format';
import { copyTransactionId } from '../../utils/copy';
import type { TransactionDetail } from '../../types';

const typeLabel: Record<string, string> = {
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán dịch vụ',
  TOPUP: 'Nạp tiền',
};

interface FieldProps {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, sub, mono }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, mono && styles.mono]}>{value}</Text>
    {!!sub && <Text style={styles.fieldSub}>{sub}</Text>}
  </View>
);

const TransactionDetailView: React.FC<{ data: TransactionDetail }> = ({ data }) => {
  const status = TRANSACTION_STATUS[data.status] || TRANSACTION_STATUS.PENDING;
  const merchantAmount = data.amount - data.fee;

  return (
    <View style={styles.container}>
      <Card style={styles.gap}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.fieldLabel}>Mã giao dịch</Text>
            <Pressable onPress={() => copyTransactionId(data.transactionId)} style={styles.copyRow} hitSlop={6}>
              <Text style={[styles.idText, styles.mono]}>{data.transactionId}</Text>
              <Icon name="copy-outline" size={14} color={colors.slate[500]} />
            </Pressable>
          </View>
          <Badge status={status} />
        </View>

        <Field label="Loại giao dịch" value={typeLabel[data.transactionType] || data.transactionType} />
        <Field label="Thời gian" value={formatDateTime(data.createdAt, true)} />
        <Field label="Người gửi" value={data.fromFullName || '—'} sub={data.fromPhone} />
        <Field label="Người nhận" value={data.toFullName || '—'} sub={data.toPhone} />
        <Field label="Mô tả" value={data.description || '—'} />
        {!!data.merchantId && <Field label="Merchant ID" value={data.merchantId} mono />}
      </Card>

      <Card style={styles.gapSmall}>
        <Text style={styles.sectionTitle}>Số tiền</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Số tiền giao dịch</Text>
          <Text style={styles.amountValue}>{formatVND(data.amount)}đ</Text>
        </View>
        {data.fee > 0 && (
          <>
            <View style={styles.amountRow}>
              <Text style={styles.feeText}>Phí nền tảng</Text>
              <Text style={[styles.feeText, styles.bold]}>−{formatVND(data.fee)}đ</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.amountRow}>
              <Text style={styles.netLabel}>Người nhận thực nhận</Text>
              <Text style={styles.netValue}>{formatVND(merchantAmount)}đ</Text>
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, styles.timelineTitle]}>Lịch sử trạng thái</Text>
        {data.statusHistory.length === 0 ? (
          <Text style={styles.emptyText}>Không có dữ liệu</Text>
        ) : (
          data.statusHistory.map((h, i) => {
            const s = TRANSACTION_STATUS[h.toStatus] || TRANSACTION_STATUS.PENDING;
            const isLast = i === data.statusHistory.length - 1;
            const fromLabel = h.fromStatus ? TRANSACTION_STATUS[h.fromStatus]?.label || h.fromStatus : null;
            return (
              <View key={h.historyId} style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={[styles.dot, { backgroundColor: s.dot }]} />
                  {!isLast && <View style={styles.line} />}
                </View>
                <View style={[styles.flex, !isLast && styles.timelineSpacing]}>
                  <Text style={styles.timelineStatus}>
                    {fromLabel ? `${fromLabel} → ${s.label}` : s.label}
                  </Text>
                  {!!h.reason && <Text style={styles.timelineReason}>{h.reason}</Text>}
                  <Text style={styles.timelineTime}>{formatDateTime(h.changedAt, true)}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  gap: {
    gap: 14,
  },
  gapSmall: {
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.slate[700],
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.slate[400],
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[800],
  },
  fieldSub: {
    fontSize: 12,
    color: colors.slate[500],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[700],
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.slate[500],
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[800],
  },
  feeText: {
    fontSize: 14,
    color: colors.amber[700],
  },
  bold: {
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.slate[100],
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary[700],
  },
  netValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary[700],
  },
  timelineTitle: {
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.slate[400],
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    alignItems: 'center',
    width: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: colors.slate[200],
    marginTop: 4,
  },
  timelineSpacing: {
    paddingBottom: 16,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[800],
  },
  timelineReason: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: colors.slate[400],
    marginTop: 2,
  },
});

export default TransactionDetailView;
