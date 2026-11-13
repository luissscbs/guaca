import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { TrendingUp, Calendar } from 'lucide-react-native';
import { formatCOP } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';
import { GuacaDivider } from '../atoms/GuacaDivider';

export interface TrendDataPoint {
  month: string;
  amount: number;
}

export interface TrendLineChartProps {
  data: TrendDataPoint[];
  title?: string;
  subtitle?: string;
  isPrivate?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function TrendLineChart({
  data,
  title = 'Tendencia Mensual',
  subtitle = 'Evolución mes a mes',
  isPrivate = false,
  height = 140,
  style,
  className = '',
  testID,
}: TrendLineChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  if (!data || data.length < 2) {
    return (
      <View
        testID={testID}
        style={style}
        className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
        accessible={true}
        accessibilityRole="summary"
      >
        <Text className="text-sm font-sans-bold text-text-primary mb-1">{title}</Text>
        <Text className="text-xs font-sans text-text-muted mb-3">{subtitle}</Text>
        <GuacaDivider className="my-2" />
        <View className="py-6 items-center justify-center">
          <Calendar size={28} color={palette.textMuted} strokeWidth={1.8} />
          <Text className="text-xs font-sans-medium text-text-muted text-center mt-2 px-4 leading-relaxed">
            Registra al menos 2 meses para ver tu tendencia de evolución financiera.
          </Text>
        </View>
      </View>
    );
  }

  const viewBoxWidth = 320;
  const viewBoxHeight = height;
  const paddingX = 24;
  const paddingY = 24;

  const amounts = data.map((d) => Math.max(0, d.amount));
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const range = maxAmount - minAmount || 1;

  const points = data.map((d, index) => {
    const x =
      paddingX + (index * (viewBoxWidth - 2 * paddingX)) / (data.length - 1);
    const normalized = (Math.max(0, d.amount) - minAmount) / range;
    const y =
      viewBoxHeight - paddingY - normalized * (viewBoxHeight - 2 * paddingY);
    return { x, y, month: d.month, amount: d.amount };
  });

  const linePath = points.reduce((acc, curr, index) => {
    return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const baselineY = viewBoxHeight - paddingY + 6;

  const areaPath = `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          <TrendingUp
            size={18}
            color={palette.financeGrowth}
            strokeWidth={2.4}
          />
          <Text className="ml-2 text-sm font-sans-bold text-text-primary">
            {title}
          </Text>
        </View>
      </View>
      <Text className="text-xs font-sans text-text-muted mb-2">{subtitle}</Text>

      <GuacaDivider className="my-2" />

      {/* Gráfica SVG */}
      <View className="w-full items-center my-1">
        <Svg
          width="100%"
          height={viewBoxHeight}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        >
          <Defs>
            <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={palette.brandPrimary} stopOpacity={isDark ? 0.4 : 0.25} />
              <Stop offset="100%" stopColor={palette.brandPrimary} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Relleno degradado bajo la curva */}
          <Path d={areaPath} fill="url(#trendGradient)" />

          {/* Línea principal */}
          <Path
            d={linePath}
            stroke={palette.brandPrimary}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Puntos destacados */}
          {points.map((pt, i) => (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={4.5}
              fill={isDark ? palette.bgSurface : '#FFFFFF'}
              stroke={palette.brandPrimary}
              strokeWidth={2.5}
            />
          ))}
        </Svg>
      </View>

      {/* Etiquetas de meses y montos con tabular-nums */}
      <View className="flex-row justify-between pt-1">
        {data.map((item, index) => (
          <View key={index} className="items-center">
            <Text className="text-[11px] font-sans-semibold text-text-secondary">
              {item.month}
            </Text>
            <Text
              className="text-[10px] font-mono text-text-muted mt-0.5"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {isPrivate ? '$ •••••••' : formatCOP(item.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}