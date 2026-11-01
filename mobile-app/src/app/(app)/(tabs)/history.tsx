import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import transactionApi from '@/api/transactionApi';
import walletApi from '@/api/walletApi';
import usePaginatedList from '@/hooks/usePaginatedList';
import Badge from '@/components/common/Badge';
import Icon from '@/components/common/Icon';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import { TRANSACTION_STATUS } from '@/constants/status';
import { colors } from '@/constants/theme';
import { formatDateTime, formatVND } from '@/utils/format';
import { getErrorMessage } from '@/utils/errorMessage';
import type { LedgerEntry, TransactionHistoryItem } from '@/types';

const PAGE_SIZE = 20;

const typeLabel: Record<string, string> = {
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán',
  TOPUP: 'Nạp tiền',
};

type TabKey = 'transactions' | 'ledger';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'transactions', label: 'Giao dịch' },
  { key: 'ledger', label: 'Biến động số dư' },
];

const fetchTransactionsPage = (page: number) => transactionApi.getHistory(page, PAGE_SIZE);
const fetchLedgerPage = (page: number) => walletApi.getMyLedger(page, PAGE_SIZE);
const transactionKey = (tx: TransactionHistoryItem) => tx.transactionId;
const ledgerKey = (entry: LedgerEntry) => entry.entryId;
const onTransactionsError = (err: unknown) =>
  Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tải lịch sử giao dịch') });
const onLedgerError = (err: unknown) =>
  Toast.show({ type: 'error', text1: getErrorMessage(err, 'Không thể tải biến động số dư') });

const openDetail = (transactionId: string) => router.push(`/transaction/${transactionId}`);

const rowShape = (index: number, total: number) => [
  index === 0 && styles.rowFirst,
  index === total - 1 && styles.rowLast,
];

const TransactionRow: React.FC<{ tx: TransactionHistoryItem; index: number; total: number }> = ({ tx, index, total }) => {
  const isCredit = tx.displayAmount > 0;
  const counterName = isCredit ? tx.fromFullName : tx.toFullName;
  const counterPhone = isCredit ? tx.fromPhone : tx.toPhone;
  const status = TRANSACTION_STATUS[tx.status] || TRANSACTION_STATUS.PENDING;

  return (
    <Pressable
      onPress={() => openDetail(tx.transactionId)}
      style={({ pressed }) => [styles.row, ...rowShape(index, total), pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, isCredit ? styles.iconCredit : styles.iconDebit]}>
        <Icon name={isCredit ? 'arrow-down' : 'arrow-up'} size={18} color={isCredit ? colors.secondary[600] : colors.slate[500]} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {counterName || '—'}
          {!!counterPhone && <Text style={styles.rowTitleMuted}> - {counterPhone}</Text>}
        </Text>
        <Text style={styles.rowDesc} numberOfLines={1}>
          {tx.description || typeLabel[tx.transactionType] || tx.transactionType}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          #{tx.transactionId.slice(0, 8)} · {formatDateTime(tx.createdAt)}
          {tx.fee > 0 && isCredit ? ` · Phí: ${formatVND(tx.fee)}đ` : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.amount, isCredit ? styles.amountCredit : styles.amountDebit]}>
          {isCredit ? '+' : '-'}
          {formatVND(tx.displayAmount)}
        </Text>
        <Badge status={status} style={styles.badge} />
      </View>
    </Pressable>
  );
};

const LedgerRow: React.FC<{ entry: LedgerEntry; index: number; total: number }> = ({ entry, index, total }) => {
  const isCredit = entry.direction === 'CREDIT';
  const transactionId = entry.transactionId;

  return (
    <Pressable
      disabled={!transactionId}
      onPress={() => transactionId && openDetail(transactionId)}
      style={({ pressed }) => [styles.row, ...rowShape(index, total), pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, isCredit ? styles.iconCredit : styles.iconDebit]}>
        <Icon name={isCredit ? 'arrow-down' : 'arrow-up'} size={18} color={isCredit ? colors.secondary[600] : colors.slate[500]} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{entry.reasonLabel}</Text>
        {!!entry.note && <Text style={styles.rowDesc} numberOfLines={1}>{entry.note}</Text>}
        <Text style={styles.rowMeta} numberOfLines={1}>{formatDateTime(entry.createdAt)}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          Số dư: {formatVND(entry.balanceBefore)} → {formatVND(entry.balanceAfter)}đ
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.amount, isCredit ? styles.amountCredit : styles.amountDebit]}>
          {isCredit ? '+' : '-'}
          {formatVND(entry.amount)}
        </Text>
        <Text style={styles.currency}>{entry.currency}</Text>
      </View>
    </Pressable>
  );
};

export default function HistoryScreen() {
  const [tab, setTab] = useState<TabKey>('transactions');
  const transactions = usePaginatedList(fetchTransactionsPage, transactionKey, onTransactionsError);
  const ledger = usePaginatedList(fetchLedgerPage, ledgerKey, onLedgerError);
  const { loadInitial: loadTransactions } = transactions;

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleTabChange = (key: TabKey) => {
    setTab(key);
    if (key === 'ledger' && !ledger.loaded && !ledger.loading) ledger.loadInitial();
  };

  const footer = (loadingMore: boolean) =>
    loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary[600]} /> : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.segment}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => handleTabChange(t.key)}
            style={[styles.segmentItem, tab === t.key && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'transactions' ? (
        transactions.loading ? (
          <Loading />
        ) : (
          <FlatList
            data={transactions.items}
            keyExtractor={transactionKey}
            renderItem={({ item, index }) => (
              <TransactionRow tx={item} index={index} total={transactions.items.length} />
            )}
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={<EmptyState icon="time-outline" title="Chưa có giao dịch nào" />}
            ListFooterComponent={footer(transactions.loadingMore)}
            onEndReached={transactions.loadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={transactions.refreshing}
                onRefresh={transactions.refresh}
                tintColor={colors.primary[600]}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )
      ) : ledger.loading ? (
        <Loading />
      ) : (
        <FlatList
          data={ledger.items}
          keyExtractor={ledgerKey}
          renderItem={({ item, index }) => <LedgerRow entry={item} index={index} total={ledger.items.length} />}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={<EmptyState icon="add-circle-outline" title="Chưa có biến động số dư nào" />}
          ListFooterComponent={footer(ledger.loadingMore)}
          onEndReached={ledger.loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={ledger.refreshing} onRefresh={ledger.refresh} tintColor={colors.primary[600]} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.slate[100],
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[500],
  },
  segmentTextActive: {
    color: colors.slate[900],
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCredit: {
    backgroundColor: colors.secondary[50],
  },
  iconDebit: {
    backgroundColor: colors.slate[100],
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[800],
  },
  rowTitleMuted: {
    fontWeight: '400',
    color: colors.slate[400],
  },
  rowDesc: {
    fontSize: 12,
    color: colors.slate[500],
  },
  rowMeta: {
    fontSize: 11,
    color: colors.slate[400],
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountCredit: {
    color: colors.secondary[600],
  },
  amountDebit: {
    color: colors.slate[700],
  },
  currency: {
    fontSize: 11,
    color: colors.slate[400],
  },
  badge: {
    alignSelf: 'flex-end',
  },
  separator: {
    height: 1,
    backgroundColor: colors.slate[100],
  },
  footer: {
    paddingVertical: 16,
  },
});
