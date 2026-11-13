import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Target } from 'lucide-react-native';
import { MoneyText, ProgressBar, GuacaButton } from '../atoms';
import { formatCOP, formatPercentage } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';

export interface SavingsGoalCardProps {
  name: string;
  targetAmount: number;
  currentAmount: number;
  isPrivate?: boolean;
  onContributePress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function SavingsGoalCard({
  name,
  targetAmount,
  currentAmount,
  isPrivate = false,
  onContributePress,
  style,
  className = '',
  testID,
}: SavingsGoalCardProps) {
  const safeTarget = Math.max(0, targetAmount);
  const safeCurrent = Math.max(0, currentAmount);
  const progressPct =
    safeTarget > 0 ? Math.min(100, (safeCurrent / safeTarget) * 100) : 0;
  const remaining = Math.max(0, safeTarget - safeCurrent);

  const formattedPct = formatPercentage(progressPct, 0);

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-finance-growthSoft items-center justify-center mr-3">
            <Target size={20} color={PALETTE.light.financeGrowth} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-sans-bold text-text-primary"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text className="text-xs font-sans text-text-muted mt-0.5">
              {remaining === 0
                ? '¡Meta cumplida!'
                : `Faltan ${isPrivate ? '$ •••••••' : formatCOP(remaining)}`}
            </Text>
          </View>
        </View>

        <View className="bg-finance-growthSoft px-2.5 py-1 rounded-full">
          <Text className="text-xs font-mono-bold text-finance-growth">
            {formattedPct}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-xs font-sans text-text-muted mb-0.5">
            Ahorrado
          </Text>
          <MoneyText
            amount={safeCurrent}
            variant="row"
            tone="growth"
            isPrivate={isPrivate}
          />
        </View>
        <View className="items-end">
          <Text className="text-xs font-sans text-text-muted mb-0.5">Meta</Text>
          <MoneyText
            amount={safeTarget}
            variant="row"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>
      </View>

      <ProgressBar
        progress={progressPct}
        tone="growth"
        height={8}
        accessibilityLabel={`Progreso meta ${name}: ${formattedPct}`}
        className="my-3"
      />

      {onContributePress && (
        <GuacaButton
          title="Aportar a meta"
          variant="secondary"
          onPress={onContributePress}
          className="mt-1"
        />
      )}
    </View>
  );
}
