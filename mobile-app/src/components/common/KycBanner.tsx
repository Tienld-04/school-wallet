import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Icon from './Icon';
import { colors } from '../../constants/theme';

interface BannerConfig {
  title: string;
  description: string;
  ctaLabel: string;
  iconColor: string;
  bg: string;
  border: string;
  textColor: string;
}

export const KYC_BANNER_CONFIG: Record<string, BannerConfig> = {
  UNVERIFIED: {
    title: 'Bạn cần xác minh KYC để sử dụng tính năng này',
    description: 'Vui lòng hoàn thành xác minh danh tính (KYC) trước khi chuyển tiền, thanh toán hoặc nạp tiền.',
    ctaLabel: 'Xác minh ngay',
    iconColor: colors.amber[600],
    bg: colors.amber[50],
    border: colors.amber[200],
    textColor: colors.amber[700],
  },
  PENDING: {
    title: 'Hồ sơ KYC của bạn đang chờ duyệt',
    description: 'Hồ sơ đã được gửi và đang chờ admin xét duyệt. Bạn sẽ có thể giao dịch sau khi được xác minh.',
    ctaLabel: 'Xem trạng thái',
    iconColor: colors.amber[600],
    bg: colors.amber[50],
    border: colors.amber[200],
    textColor: colors.amber[700],
  },
  REJECTED: {
    title: 'Hồ sơ KYC của bạn đã bị từ chối',
    description: 'Hồ sơ xác minh không được chấp nhận. Vui lòng kiểm tra lý do và nộp lại hồ sơ.',
    ctaLabel: 'Nộp lại hồ sơ',
    iconColor: colors.red[500],
    bg: colors.red[50],
    border: colors.red[200],
    textColor: colors.red[700],
  },
};

const KycBanner: React.FC<{ kycStatus: string }> = ({ kycStatus }) => {
  if (kycStatus === 'VERIFIED') return null;
  const config = KYC_BANNER_CONFIG[kycStatus] ?? KYC_BANNER_CONFIG.UNVERIFIED;

  return (
    <Pressable
      onPress={() => router.push('/kyc')}
      style={[styles.banner, { backgroundColor: config.bg, borderColor: config.border }]}
    >
      <Icon name="shield-checkmark-outline" size={22} color={config.iconColor} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: config.textColor }]}>{config.title}</Text>
        <Text style={[styles.cta, { color: config.textColor }]}>{config.ctaLabel} →</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default KycBanner;
