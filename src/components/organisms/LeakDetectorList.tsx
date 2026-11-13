import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AlertCircle, Plus } from 'lucide-react-native';
import { SubscriptionLeak } from '../../domain/types';
import { formatCOP } from '../../utils/formatters';
import { MoneyText } from '../atoms/MoneyText';
import { GuacaButton } from '../atoms/GuacaButton';
import { SubscriptionLeakItem } from '../molecules/SubscriptionLeakItem';
import { EmptyState } from '../molecules/EmptyState';
import { PALETTE } from '../../constants/theme';

export interface LeakDetectorListProps {
  subscriptions: SubscriptionLeak[];
  onToggleActive?: (subscription: SubscriptionLeak) => void;
  onEdit?: (subscription: SubscriptionLeak) => void;
  onDelete?: (subscription: SubscriptionLeak) => void;
  onAddPress?: () => void;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function LeakDetectorList({
  subscriptions,
  onToggleActive,
  onEdit,
  onDelete,
  onAddPress,
  isPrivate = false,
  style,
  className = '',
  testID,
}: LeakDetectorListProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);

  const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
    const monthlyCost =
      s.frequency === 'annual' ? Math.round(s.amount / 12) : s.amount;
    return sum + monthlyCost;
  }, 0);

  const annualTotal = monthlyTotal * 12;

  if (subscriptions.length === 0) {
    return (
      <View
        testID={testID}
        style={style}
        className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      >
        <EmptyState
          title="Sin suscripciones ni fugas"
          description="No tienes gastos hormiga ni suscripciones recurrentes registradas. ¡Excelente control!"
          actionTitle="Agregar suscripción o fuga"
          onActionPress={onAddPress}
        />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={style}
      className={`w-full gap-3 ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Tarjeta superior: Resumen de impacto 12x y acción de agregar */}
      <View className="bg-surface border border-border-subtle rounded-md p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <AlertCircle
              size={18}
              color={palette.financeWarning}
              strokeWidth={2.4}
            />
            <Text className="ml-2 text-sm font-sans-bold text-text-primary">
              Detector de Fugas y Suscripciones
            </Text>
          </View>
          <Text className="text-xs font-sans-medium text-text-muted">
            {activeSubscriptions.length} activas
          </Text>
        </View>

        {/* Resumen de impacto 12x */}
        <View className="bg-finance-warningSoft/50 rounded-sm p-3 border border-finance-warning/20">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Gasto recurrente mensual
            </Text>
            <MoneyText
              amount={monthlyTotal}
              variant="row"
              tone="warning"
              isPrivate={isPrivate}
            />
          </View>

          <View className="mt-1 pt-1 border-t border-finance-warning/15">
            <Text className="text-xs font-sans text-finance-warning">
              Impacto anualizado (12x):{' '}
              <Text className="font-sans-bold text-finance-warning">
                Te cuesta {isPrivate ? '$ •••••••' : formatCOP(annualTotal)} al año
              </Text>
            </Text>
          </View>
        </View>

        {/* Botón para agregar dentro de la tarjeta de control */}
        {onAddPress && (
          <View className="mt-3">
            <GuacaButton
              title="Agregar suscripción o fuga"
              variant="secondary"
              onPress={onAddPress}
              iconLeft={<Plus size={16} color={palette.brandPrimary} />}
              accessibilityLabel="Agregar suscripción o fuga"
            />
          </View>
        )}
      </View>

      {/* Título de la lista */}
      <Text className="text-xs font-sans-bold text-text-primary px-1">
        Suscripciones y fugas monitoreadas
      </Text>

      {/* Lista de suscripciones hermanas independientes (sin tarjeta envolvente y sin divisores entre tarjetas) */}
      <View className="w-full gap-3">
        {subscriptions.map((sub) => (
          <SubscriptionLeakItem
            key={sub.id}
            name={sub.name}
            amount={sub.amount}
            frequency={sub.frequency}
            isActive={sub.isActive}
            isPrivate={isPrivate}
            onToggleActive={() => onToggleActive?.(sub)}
            onEdit={() => onEdit?.(sub)}
            onDelete={() => onDelete?.(sub)}
          />
        ))}
      </View>
    </View>
  );
}