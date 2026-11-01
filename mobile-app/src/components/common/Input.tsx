import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  password?: boolean;
}

const Input: React.FC<InputProps> = ({ label, error, password, style, onFocus, onBlur, ...rest }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          {...rest}
          style={[styles.input, style]}
          placeholderTextColor={colors.slate[400]}
          secureTextEntry={password && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {password && (
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
            <Text style={styles.toggle}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[700],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.slate[200],
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  fieldFocused: {
    borderColor: colors.primary[400],
  },
  fieldError: {
    borderColor: colors.red[500],
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.slate[800],
  },
  toggle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
    paddingLeft: 8,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.red[500],
  },
});

export default Input;
