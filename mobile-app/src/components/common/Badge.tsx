import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { StatusStyle } from '../../constants/status';

interface BadgeProps {
  status: StatusStyle;
  style?: StyleProp<ViewStyle>;
}

const Badge: React.FC<BadgeProps> = ({ status, style }) => (
  <View style={[styles.badge, { backgroundColor: status.bg }, style]}>
    <Text style={[styles.text, { color: status.text }]}>{status.label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default Badge;
