import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { formatCompact } from '../../utils/format';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

const AXIS_WIDTH = 36;
const LABEL_HEIGHT = 18;
const TOP_PADDING = 8;
const MIN_SLOT = 36;
const MAX_BAR = 26;

const BarChart: React.FC<BarChartProps> = ({
  data, height = 160, color = colors.secondary[500], selectedIndex, onSelect,
}) => {
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(0, width - AXIS_WIDTH);
  const slot = plotWidth > 0 ? Math.max(MIN_SLOT, plotWidth / Math.max(data.length, 1)) : MIN_SLOT;
  const chartWidth = slot * data.length;
  const barWidth = Math.min(MAX_BAR, slot * 0.6);
  const plotHeight = height - LABEL_HEIGHT - TOP_PADDING;
  const max = Math.max(...data.map((d) => d.value), 0);
  const scale = max > 0 ? plotHeight / max : 0;
  const gridValues = max > 0 ? [max, max / 2, 0] : [0];

  return (
    <View style={[styles.container, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.axis, { width: AXIS_WIDTH }]}>
        {gridValues.map((v) => (
          <Text
            key={v}
            style={[styles.axisLabel, { top: TOP_PADDING + plotHeight - v * scale - 7 }]}
          >
            {formatCompact(v)}
          </Text>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={chartWidth > plotWidth}
      >
        <Svg width={Math.max(chartWidth, plotWidth)} height={height}>
          {gridValues.map((v) => {
            const y = TOP_PADDING + plotHeight - v * scale;
            return (
              <Line
                key={`grid-${v}`}
                x1={0}
                x2={Math.max(chartWidth, plotWidth)}
                y1={y}
                y2={y}
                stroke={colors.slate[100]}
                strokeWidth={1}
                strokeDasharray={v === 0 ? undefined : '3 3'}
              />
            );
          })}

          {data.map((d, i) => {
            const barHeight = Math.max(d.value * scale, d.value > 0 ? 2 : 0);
            const x = i * slot + (slot - barWidth) / 2;
            const dimmed = selectedIndex !== null && selectedIndex !== i;
            return (
              <React.Fragment key={d.key}>
                <Rect
                  x={x}
                  y={TOP_PADDING + plotHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={color}
                  opacity={dimmed ? 0.35 : 1}
                />
                <SvgText
                  x={i * slot + slot / 2}
                  y={height - 4}
                  fontSize={10}
                  fill={selectedIndex === i ? colors.slate[700] : colors.slate[400]}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
        <View style={styles.touchLayer}>
          {data.map((d, i) => (
            <Pressable
              key={d.key}
              onPress={() => onSelect(selectedIndex === i ? null : i)}
              style={{ width: slot, height }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  axis: {
    position: 'relative',
  },
  axisLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
    color: colors.slate[400],
  },
  touchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    flexDirection: 'row',
  },
});

export default BarChart;
