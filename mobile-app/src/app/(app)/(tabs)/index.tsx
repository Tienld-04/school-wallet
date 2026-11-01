import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import transactionApi from '@/api/transactionApi';
import walletApi from '@/api/walletApi';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Icon from '@/components/common/Icon';
import type { IconName } from '@/components/common/Icon';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import KycBanner from '@/components/common/KycBanner';
import ScreenScroll from '@/components/layout/ScreenScroll';
import { colors } from '@/constants/theme';
import { formatRelativeDateTime, formatSignedAmount, formatVND } from '@/utils/format';
import type { BalanceResponse, RecentTransactionResponse } from '@/types';

interface QuickAction {
  label: string;
  icon: IconName;
  bg: string;
  color: string;
  onPress: () => void;
}

const comingSoon = () => Toast.show({ type: 'info', text1: 'Tính năng đang được phát triển' });

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nạp tiền', icon: 'wallet-outline', bg: colors.secondary[50], color: colors.secondary[600], onPress: comingSoon },
  { label: 'Chuyển tiền', icon: 'swap-horizontal', bg: colors.primary[50], color: colors.primary[600], onPress: () => router.push('/transfer') },
  { label: 'Thanh toán', icon: 'card-outline', bg: colors.orange[50], color: colors.orange[500], onPress: () => router.push('/payment') },
  { label: 'Lịch sử', icon: 'time-outline', bg: colors.slate[100], color: colors.slate[500], onPress: () => router.navigate('/history') },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<RecentTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [balanceData, txData] = await Promise.all([
        walletApi.getMyBalance(),
        transactionApi.getRecent(),
      ]);
      setBalance(balanceData);
      setTransactions(txData);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenScroll
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
        }
      >
        <View style={styles.greetingRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? ''}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.fullName ?? ''}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={[styles.circle, styles.circleTop]} />
          <View style={[styles.circle, styles.circleBottom]} />

          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Pressable onPress={() => setShowBalance((prev) => !prev)} hitSlop={10}>
              <Icon name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.primary[200]} />
            </Pressable>
          </View>
          <Text style={styles.balanceValue}>
            {showBalance ? (balance ? formatVND(balance.balance) : '—') : '•••••••'}
            <Text style={styles.balanceCurrency}> VND</Text>
          </Text>

          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountLabel}>Số tài khoản</Text>
              <Text style={styles.accountNumber}>{user?.phone || '—'}</Text>
            </View>
            <View style={styles.accountOwner}>
              <Text style={styles.accountLabel}>Chủ tài khoản</Text>
              <Text style={styles.accountName} numberOfLines={1}>
                {user?.fullName?.toUpperCase() || '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Icon name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {!!user && <KycBanner kycStatus={user.kycStatus} />}

        <Card style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Giao dịch gần đây</Text>
            <Pressable onPress={() => router.navigate('/history')} hitSlop={8}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          {loading ? (
            <Loading />
          ) : transactions.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Chưa có giao dịch nào" />
          ) : (
            transactions.map((tx, i) => {
              const isCredit = tx.amount.startsWith('+');
              return (
                <Pressable
                  key={tx.transactionId}
                  onPress={() => router.push(`/transaction/${tx.transactionId}`)}
                  style={({ pressed }) => [
                    styles.txRow,
                    i < transactions.length - 1 && styles.txDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.txIcon, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
                    <Icon
                      name={isCredit ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={isCredit ? colors.secondary[600] : colors.slate[500]}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txTime}>{formatRelativeDateTime(tx.createdAt)}</Text>
                  </View>
                  <Text style={[styles.txAmount, isCredit ? styles.txAmountCredit : styles.txAmountDebit]}>
                    {formatSignedAmount(tx.amount)}
                    <Text style={styles.txCurrency}> VND</Text>
                  </Text>
                </Pressable>
              );
            })
          )}
        </Card>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 13,
    color: colors.slate[500],
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  balanceCard: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    padding: 20,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTop: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
  },
  circleBottom: {
    width: 140,
    height: 140,
    bottom: -70,
    right: 40,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.primary[200],
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 20,
  },
  balanceCurrency: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  accountOwner: {
    flex: 1,
    alignItems: 'flex-end',
  },
  accountLabel: {
    fontSize: 12,
    color: colors.primary[300],
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 14,
    color: colors.white,
    letterSpacing: 2,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate[600],
    textAlign: 'center',
  },
  recentCard: {
    paddingVertical: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[900],
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  txDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconCredit: {
    backgroundColor: colors.secondary[50],
  },
  txIconDebit: {
    backgroundColor: colors.slate[100],
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[800],
  },
  txTime: {
    fontSize: 12,
    color: colors.slate[400],
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  txAmountCredit: {
    color: colors.secondary[600],
  },
  txAmountDebit: {
    color: colors.slate[700],
  },
  txCurrency: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.slate[400],
  },
});
