import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  style?: StyleProp<ViewStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'lg' ? styles.lg : styles.md,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary[600]} />
      ) : (
        <Text style={[styles.text, variant === 'primary' ? styles.textPrimary : styles.textSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  primary: {
    backgroundColor: colors.primary[600],
  },
  secondary: {
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  md: {
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.primary[700],
  },
});

export default Button;
