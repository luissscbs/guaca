import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Circle, G } from 'react-native-svg';
import { formatCOP, formatPercentage } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';
import { GuacaDivider } from '../atoms/GuacaDivider';

export interface DonutChartProps {
  vital: number;
  growth: number;
  leisure: number;
  debt: number;
  isPrivate?: boolean;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function DonutChart({
  vital,
  growth,
  leisure,
  debt,
  isPrivate = false,
  size = 180,
  strokeWidth = 22,
  style,
  className = '',
  testID,
}: DonutChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const safeVital = Math.max(0, vital);
  const safeGrowth = Math.max(0, growth);
  const safeLeisure = Math.max(0, leisure);
  const safeDebt = Math.max(0, debt);

  const total = safeVital + safeGrowth + safeLeisure + safeDebt;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const leisureColor = isDark ? '#A78BFA' : '#7C3AED';

  const items = [
    {
      key: 'vital',
      label: 'Mínimo Vital',
      amount: safeVital,
      color: palette.financeVital,
    },
    {
      key: 'growth',
      label: 'Ahorro',
      amount: safeGrowth,
      color: palette.financeGrowth,
    },
    {
      key: 'leisure',
      label: 'Ocio',
      amount: safeLeisure,
      color: leisureColor,
    },
    {
      key: 'debt',
      label: 'Deudas',
      amount: safeDebt,
      color: palette.financeDanger,
    },
  ];

  let accumulatedLength = 0;
  const slices = items.map((item) => {
    const fraction = total > 0 ? item.amount / total : 0;
    const arcLength = fraction * circumference;
    const offset = -accumulatedLength;
    accumulatedLength += arcLength;
    const percentage = total > 0 ? (item.amount / total) * 100 : 0;

    return {
      ...item,
      fraction,
      arcLength,
      offset,
      percentage,
    };
  });

  const totalFormatted = isPrivate ? '$ •••••••' : formatCOP(total);

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full items-center ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Gráfica SVG Dona */}
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center relative my-2"
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Fondo de anillo vacío adaptado a dark/light */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={palette.bgSubtle}
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {total > 0 &&
              slices.map((slice) => {
                if (slice.arcLength <= 0) return null;
                return (
                  <Circle
                    key={slice.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${slice.arcLength} ${
                      circumference - slice.arcLength
                    }`}
                    strokeDashoffset={slice.offset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                );
              })}
          </G>
        </Svg>

        {/* Centro de la dona con el Total */}
        <View className="absolute items-center justify-center px-2">
          <Text className="text-[10px] font-sans text-text-muted uppercase tracking-wider">
            Total Mes
          </Text>
          <Text
            className="text-base font-mono-bold text-text-primary text-center mt-0.5"
            style={{ fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
          >
            {totalFormatted}
          </Text>
        </View>
      </View>

      <GuacaDivider className="my-2.5" />

      {/* Leyenda accesible con valor en COP y porcentaje */}
      <View className="w-full space-y-2">
        {slices.map((slice) => (
          <View
            key={slice.key}
            className="flex-row items-center justify-between py-1"
          >
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: slice.color }}
                className="w-3 h-3 rounded-full mr-2"
              />
              <Text className="text-xs font-sans-medium text-text-primary">
                {slice.label}
              </Text>
            </View>

            <View className="flex-row items-center space-x-2">
              <Text
                className="text-xs font-mono-semibold text-text-secondary"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {isPrivate ? '$ •••••••' : formatCOP(slice.amount)}
              </Text>
              <Text className="text-[11px] font-sans text-text-muted ml-2 w-10 text-right">
                {formatPercentage(slice.percentage, 0)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}