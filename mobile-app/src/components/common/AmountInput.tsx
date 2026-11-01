import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/theme';
import { formatDigits } from '../../utils/format';

interface AmountInputProps {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  hint?: string;
  autoFocus?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({ label, value, onChange, hint, autoFocus }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <TextInput
          value={formatDigits(value)}
          onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
          placeholder="0"
          placeholderTextColor={colors.slate[400]}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        <Text style={styles.suffix}>VND</Text>
      </View>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
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
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: '600',
    color: colors.slate[800],
  },
  suffix: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate[400],
  },
  hint: {
    fontSize: 12,
    color: colors.slate[400],
    paddingLeft: 4,
  },
});

export default AmountInput;
