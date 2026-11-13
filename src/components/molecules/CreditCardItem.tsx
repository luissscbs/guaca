import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { CreditCard as CardIcon } from 'lucide-react-native';
import { CreditCard } from '../../domain/types';
import { MoneyText, ProgressBar, GuacaButton } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface CreditCardItemProps {
  card: CreditCard;
  isPrivate?: boolean;
  onPayPress?: (card: CreditCard) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function CreditCardItem({
  card,
  isPrivate = false,
  onPayPress,
  style,
  className = '',
  testID,
}: CreditCardItemProps) {
  const available = Math.max(0, card.creditLimit - card.currentBalance);
  const usedPct =
    card.creditLimit > 0
      ? Math.min(100, Math.round((card.currentBalance / card.creditLimit) * 100))
      : 0;

  const progressTone =
    usedPct > 80 ? 'danger' : usedPct > 50 ? 'warning' : 'vital';

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-finance-vitalSoft items-center justify-center mr-3">
            <CardIcon size={22} color={PALETTE.light.financeVital} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-sans-bold text-text-primary"
              numberOfLines={1}
            >
              {card.name}
            </Text>
            <Text className="text-xs font-sans text-text-muted mt-0.5">
              {`Corta el día ${card.cutoffDay} • Paga hasta el día ${card.dueDay}`}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-xs font-sans-medium text-text-muted mb-0.5">
            Cupo usado
          </Text>
          <MoneyText
            amount={card.currentBalance}
            variant="row"
            tone={usedPct > 80 ? 'danger' : 'default'}
            isPrivate={isPrivate}
          />
        </View>
        <View className="items-end">
          <Text className="text-xs font-sans-medium text-text-muted mb-0.5">
            Disponible
          </Text>
          <MoneyText
            amount={available}
            variant="row"
            tone="growth"
            isPrivate={isPrivate}
          />
        </View>
      </View>

      <ProgressBar
        progress={usedPct}
        tone={progressTone}
        height={6}
        accessibilityLabel={`Cupo usado: ${usedPct}%`}
        className="my-3"
      />

      {onPayPress && (
        <GuacaButton
          title="Registrar pago"
          variant="secondary"
          onPress={() => onPayPress(card)}
          className="mt-1"
        />
      )}
    </View>
  );
}
