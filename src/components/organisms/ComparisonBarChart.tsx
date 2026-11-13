import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import Svg, { Rect } from 'react-native-svg';
import { formatCOP } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';
import { GuacaDivider } from '../atoms/GuacaDivider';

export interface ComparisonBarChartProps {
  netIncome: number;
  vitalMinimum: number;
  debtObligations: number;
  guiltFreeAvailable: number;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function ComparisonBarChart({
  netIncome,
  vitalMinimum,
  debtObligations,
  guiltFreeAvailable,
  isPrivate = false,
  style,
  className = '',
  testID,
}: ComparisonBarChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const safeIncome = Math.max(0, netIncome);
  const safeVital = Math.max(0, vitalMinimum);
  const safeDebts = Math.max(0, debtObligations);
  const safeAvailable = Math.max(0, guiltFreeAvailable);

  const maxValue = Math.max(safeIncome, safeVital, safeDebts, safeAvailable, 1);

  const bars = [
    {
      key: 'income',
      label: 'Ingreso Neto',
      amount: safeIncome,
      color: palette.brandPrimary,
    },
    {
      key: 'vital',
      label: 'Mínimo Vital',
      amount: safeVital,
      color: palette.financeVital,
    },
    {
      key: 'debts',
      label: 'Deudas',
      amount: safeDebts,
      color: palette.financeDanger,
    },
    {
      key: 'available',
      label: 'Ocio / Libre',
      amount: safeAvailable,
      color: palette.financeGrowth,
    },
  ];

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      <View className="mb-2">
        <Text className="text-sm font-sans-bold text-text-primary">
          Comparativa de Flujo Mensual
        </Text>
        <Text className="text-xs font-sans text-text-muted mt-0.5">
          Ingreso vs compromisos y saldo libre
        </Text>
      </View>

      <GuacaDivider className="my-2" />

      <View className="space-y-3.5 my-1">
        {bars.map((bar) => {
          const widthPct = Math.round((bar.amount / maxValue) * 100);
          const safePct = Math.max(2, Math.min(100, widthPct));
          const formattedAmount = isPrivate ? '$ •••••••' : formatCOP(bar.amount);

          return (
            <View key={bar.key} className="space-y-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-sans-medium text-text-secondary">
                  {bar.label}
                </Text>
                <Text
                  className="text-xs font-mono-semibold text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formattedAmount}
                </Text>
              </View>

              {/* Barra SVG horizontal con bordes redondeados */}
              <View className="w-full h-3 rounded-full bg-bg-subtle overflow-hidden">
                <Svg width="100%" height={12}>
                  <Rect
                    x={0}
                    y={0}
                    width={`${safePct}%`}
                    height={12}
                    fill={bar.color}
                    rx={6}
                    ry={6}
                  />
                </Svg>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}