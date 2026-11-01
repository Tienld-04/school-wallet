import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

const Loading: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.container, style]}>
    <ActivityIndicator size="large" color={colors.primary[600]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loading;
