import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../constants/theme';

export interface DonutDatum {
  key: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120, strokeWidth = 18 }) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke={colors.slate[100]} strokeWidth={strokeWidth} fill="none" />
      {total > 0 &&
        data.map((d) => {
          const fraction = d.value / total;
          const rotation = (cumulative / total) * 360 - 90;
          cumulative += d.value;
          if (fraction <= 0) return null;
          return (
            <G key={d.key} rotation={rotation} origin={`${center}, ${center}`}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={d.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${Math.max(fraction * circumference - 1.5, 0.5)} ${circumference}`}
              />
            </G>
          );
        })}
    </Svg>
  );
};

export default DonutChart;
