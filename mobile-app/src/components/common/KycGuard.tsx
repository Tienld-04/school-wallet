import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import useAuth from '../../hooks/useAuth';
import Button from './Button';
import Icon from './Icon';
import Loading from './Loading';
import { KYC_BANNER_CONFIG } from './KycBanner';
import { colors } from '../../constants/theme';

const KycGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Loading />;

  if (user.kycStatus === 'VERIFIED') return <>{children}</>;

  const config = KYC_BANNER_CONFIG[user.kycStatus] ?? KYC_BANNER_CONFIG.UNVERIFIED;

  return (
    <View style={[styles.box, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.white }]}>
        <Icon name="shield-checkmark-outline" size={28} color={config.iconColor} />
      </View>
      <Text style={[styles.title, { color: config.textColor }]}>{config.title}</Text>
      <Text style={styles.description}>{config.description}</Text>
      <Button title={config.ctaLabel} onPress={() => router.push('/kyc')} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.slate[600],
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    alignSelf: 'stretch',
  },
});

export default KycGuard;
