import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import type { IconName } from './Icon';
import { colors } from '../../constants/theme';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => (
  <View style={styles.container}>
    <View style={styles.iconBox}>
      <Icon name={icon} size={24} color={colors.slate[400]} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[500],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.slate[400],
    marginTop: 4,
    textAlign: 'center',
  },
});

export default EmptyState;
