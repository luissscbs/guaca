import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Repeat } from 'lucide-react-native';
import { LeakFrequency } from '../../domain/types';
import { GuacaButton } from '../atoms';
import { formatCOP } from '../../utils/formatters';
import { PALETTE } from '../../constants/theme';

export interface SubscriptionLeakItemProps {
  name: string;
  amount: number;
  frequency?: LeakFrequency;
  isActive?: boolean;
  isPrivate?: boolean;
  onToggleActive?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function SubscriptionLeakItem({
  name,
  amount,
  frequency = 'monthly',
  isActive = true,
  isPrivate = false,
  onToggleActive,
  onEdit,
  onDelete,
  style,
  className = '',
  testID,
}: SubscriptionLeakItemProps) {
  const isMonthly = frequency === 'monthly';
  const annualCost = isMonthly ? amount * 12 : amount;

  const costFormatted = isPrivate
    ? '$ •••••••'
    : `${formatCOP(amount)} / ${isMonthly ? 'mes' : 'año'}`;

  const annualImpactFormatted = isPrivate
    ? '$ •••••••'
    : formatCOP(annualCost);

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${
        !isActive ? 'opacity-50' : ''
      } ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 rounded-full bg-finance-warningSoft items-center justify-center mr-2.5">
            <Repeat size={18} color={PALETTE.light.financeWarning} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-sans-bold text-text-primary"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text className="text-xs font-mono-semibold text-text-secondary mt-0.5">
              {costFormatted}
            </Text>
          </View>
        </View>

        {!isActive && (
          <View className="bg-bg-subtle px-2.5 py-1 rounded-full border border-border-subtle">
            <Text className="text-xs font-sans text-text-muted">Pausada</Text>
          </View>
        )}
      </View>

      {/* Impacto anualizado 12x en pesos COP */}
      <View className="bg-finance-warningSoft/50 px-3 py-2 rounded-sm mb-3 border border-finance-warning/20">
        <Text className="text-xs font-sans text-finance-warning">
          Impacto total:{' '}
          <Text className="font-sans-bold text-finance-warning">
            Te cuesta {annualImpactFormatted} al año
          </Text>
        </Text>
      </View>

      <View className="flex-row items-center justify-end space-x-2">
        {onToggleActive && (
          <GuacaButton
            title={isActive ? 'Pausar' : 'Reactivar'}
            variant="ghost"
            size="sm"
            onPress={onToggleActive}
            accessibilityLabel={isActive ? `Pausar ${name}` : `Reactivar ${name}`}
          />
        )}
      </View>
    </View>
  );
}
