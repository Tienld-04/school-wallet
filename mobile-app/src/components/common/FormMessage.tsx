import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface FormMessageProps {
  message: string;
  type?: 'error' | 'success';
}

const FormMessage: React.FC<FormMessageProps> = ({ message, type = 'error' }) => {
  if (!message) return null;
  const isError = type === 'error';

  return (
    <View style={[styles.box, isError ? styles.errorBox : styles.successBox]}>
      <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: colors.red[50],
    borderColor: colors.red[200],
  },
  successBox: {
    backgroundColor: colors.emerald[50],
    borderColor: colors.emerald[200],
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: colors.red[500],
  },
  successText: {
    color: colors.emerald[700],
  },
});

export default FormMessage;
