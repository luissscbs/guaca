import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Debt } from '../../domain/types';
import { MoneyText, GuacaButton } from '../atoms';
import { formatInterestPer100k } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';

export interface DebtItemCardProps {
  debt: Debt;
  priorityLabel?: string;
  isPrivate?: boolean;
  onPayPress?: (debt: Debt) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function DebtItemCard({
  debt,
  priorityLabel,
  isPrivate = false,
  onPayPress,
  style,
  className = '',
  testID,
}: DebtItemCardProps) {
  const interestCostFormatted = formatInterestPer100k(
    debt.estimatedMonthlyRatePct
  );

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text
            className="text-base font-sans-bold text-text-primary"
            numberOfLines={1}
          >
            {debt.name}
          </Text>
          <Text className="text-xs font-sans text-text-muted mt-0.5">
            {debt.creditor}
          </Text>
        </View>

        {priorityLabel && (
          <View className="bg-finance-dangerSoft px-2.5 py-1 rounded-full border border-finance-danger/20">
            <Text className="text-xs font-sans-bold text-finance-danger">
              {priorityLabel}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between mb-3 pt-2 border-t border-border-subtle">
        <View>
          <Text className="text-xs font-sans-medium text-text-muted mb-0.5">
            Saldo pendiente
          </Text>
          <MoneyText
            amount={debt.remainingBalance}
            variant="macro"
            tone="danger"
            isPrivate={isPrivate}
          />
        </View>
        <View className="items-end">
          <Text className="text-xs font-sans-medium text-text-muted mb-0.5">
            Cuota mínima
          </Text>
          <MoneyText
            amount={debt.minimumMonthlyPayment}
            variant="row"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>
      </View>

      {/* Costo en pesos por cada $100.000 prestados (PROHIBIDO mostrar "E.A.") */}
      <View className="flex-row items-center bg-bg-subtle p-2.5 rounded-sm mb-3 border border-border-subtle">
        <AlertCircle size={16} color={PALETTE.light.financeWarning} />
        <Text className="text-xs font-sans text-text-secondary ml-2 flex-1">
          Costo en intereses:{' '}
          <Text className="font-sans-bold text-finance-warning">
            {interestCostFormatted}
          </Text>
        </Text>
      </View>

      {onPayPress && (
        <GuacaButton
          title="Abonar"
          variant="primary"
          onPress={() => onPayPress(debt)}
        />
      )}
    </View>
  );
}
