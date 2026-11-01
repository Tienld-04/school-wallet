import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../constants/theme';

const PIN_LENGTH = 6;

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PinInput: React.FC<PinInputProps> = ({ value, onChange }) => {
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const filled = i < value.length;
        const active = focused && i === Math.min(value.length, PIN_LENGTH - 1);
        return (
          <View key={i} style={[styles.circle, filled && styles.circleFilled, !filled && active && styles.circleActive]}>
            {filled && <View style={styles.dot} />}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        autoFocus
        caretHidden
        contextMenuHidden
        textContentType="none"
        autoComplete="off"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  circleFilled: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default PinInput;
