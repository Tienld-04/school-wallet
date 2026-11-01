import React from 'react';
import type { ColorValue } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, color }) => (
  <Ionicons name={name} size={size} color={color} />
);

export default Icon;
