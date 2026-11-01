import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ScrollViewProps } from 'react-native';

const ScreenScroll: React.FC<ScrollViewProps> = ({ contentContainerStyle, children, ...rest }) => (
  <ScrollView
    keyboardShouldPersistTaps="handled"
    automaticallyAdjustKeyboardInsets
    showsVerticalScrollIndicator={false}
    {...rest}
    contentContainerStyle={[styles.content, contentContainerStyle]}
  >
    {children}
  </ScrollView>
);

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
});

export default ScreenScroll;
