import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Icon from '@/components/common/Icon';
import type { IconName } from '@/components/common/Icon';
import InfoRow from '@/components/common/InfoRow';
import Loading from '@/components/common/Loading';
import ScreenScroll from '@/components/layout/ScreenScroll';
import { KYC_STATUS } from '@/constants/status';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/format';

interface MenuItem {
  label: string;
  icon: IconName;
  href: Href;
}

const MENU: MenuItem[] = [
  { label: 'Xác minh KYC', icon: 'shield-checkmark-outline', href: '/kyc' },
  { label: 'Đổi mật khẩu', icon: 'lock-closed-outline', href: '/change-password' },
  { label: 'Đổi mã OTP', icon: 'keypad-outline', href: '/change-pin' },
];

const MERCHANT_MENU: MenuItem[] = [
  { label: 'Dịch vụ của tôi', icon: 'storefront-outline', href: '/my-merchants' },
  { label: 'Doanh thu', icon: 'stats-chart-outline', href: '/merchant-revenue' },
];

const ADMIN_MENU: MenuItem[] = [
  { label: 'Doanh thu nền tảng', icon: 'stats-chart-outline', href: '/platform-revenue' },
];

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  if (!user) return <Loading />;

  const kycStatus = KYC_STATUS[user.kycStatus] ?? KYC_STATUS.UNVERIFIED;
  const isAdmin = user.role === 'ADMIN';
  const showMerchantMenu = user.hasMerchants && !isAdmin;

  const renderMenu = (items: MenuItem[]) => (
    <Card style={styles.listCard}>
      {items.map((item, i) => (
        <Pressable
          key={item.label}
          onPress={() => router.push(item.href)}
          style={({ pressed }) => [styles.menuRow, i < items.length - 1 && styles.menuDivider, pressed && styles.pressed]}
        >
          <View style={styles.menuIcon}>
            <Icon name={item.icon} size={18} color={colors.primary[600]} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          {item.href === '/kyc' && <Badge status={kycStatus} />}
          <Icon name="chevron-forward" size={18} color={colors.slate[400]} />
        </Pressable>
      ))}
    </Card>
  );

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
      }
    >
      <Card style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{user.fullName}</Text>
          <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
        </View>
      </Card>

      <Card style={styles.listCard}>
        <InfoRow label="Họ và tên" value={user.fullName} />
        <InfoRow label="Số điện thoại" value={user.phone} />
        <InfoRow label="Số tài khoản" value={user.phone} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Ngày tạo" value={formatDate(user.createdAt)} />
        <InfoRow label="Trạng thái KYC" last>
          <Badge status={kycStatus} />
        </InfoRow>
      </Card>

      {isAdmin && renderMenu(ADMIN_MENU)}
      {showMerchantMenu && renderMenu(MERCHANT_MENU)}
      {renderMenu(MENU)}

      <Button title="Đăng xuất" variant="secondary" loading={loggingOut} onPress={handleLogout} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  email: {
    fontSize: 13,
    color: colors.slate[400],
    marginTop: 2,
  },
  listCard: {
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.slate[800],
  },
});
