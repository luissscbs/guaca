import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { MoneyText, ProgressBar, ProgressBarTone } from '../atoms';
import { formatCOP } from '../../utils/formatters';

export interface BudgetCategoryCardProps {
  categoryName: string;
  monthlyLimit: number;
  spentThisMonth: number;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function BudgetCategoryCard({
  categoryName,
  monthlyLimit,
  spentThisMonth,
  isPrivate = false,
  style,
  className = '',
  testID,
}: BudgetCategoryCardProps) {
  const safeLimit = Math.max(0, monthlyLimit);
  const safeSpent = Math.max(0, spentThisMonth);
  const spentPct =
    safeLimit > 0 ? Math.round((safeSpent / safeLimit) * 100) : 0;

  const isExceeded = safeSpent > safeLimit;
  const difference = Math.abs(safeLimit - safeSpent);

  let tone: ProgressBarTone = 'growth';
  if (spentPct >= 100) {
    tone = 'danger';
  } else if (spentPct >= 80) {
    tone = 'warning';
  }

  const helperText = isExceeded
    ? `Te pasaste por ${formatCOP(difference)}`
    : `Te quedan ${formatCOP(difference)}`;

  const helperTextColor = isExceeded
    ? 'text-finance-danger font-sans-bold'
    : 'text-finance-growth font-sans-semibold';

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-base font-sans-bold text-text-primary flex-1 mr-2"
          numberOfLines={1}
        >
          {categoryName}
        </Text>
        <Text className={`text-xs ${helperTextColor}`}>{helperText}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-xs font-sans text-text-muted mb-0.5">
            Gastado
          </Text>
          <MoneyText
            amount={safeSpent}
            variant="row"
            tone={isExceeded ? 'danger' : 'default'}
            isPrivate={isPrivate}
          />
        </View>
        <View className="items-end">
          <Text className="text-xs font-sans text-text-muted mb-0.5">
            Tope mensual
          </Text>
          <MoneyText
            amount={safeLimit}
            variant="row"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>
      </View>

      <ProgressBar
        progress={spentPct}
        tone={tone}
        height={8}
        accessibilityLabel={`Consumo de presupuesto ${categoryName}: ${spentPct}%`}
        className="mt-2"
      />
    </View>
  );
}
