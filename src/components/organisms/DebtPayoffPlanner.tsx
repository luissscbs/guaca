import React, { useState } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AlertTriangle, Zap, TrendingDown } from 'lucide-react-native';
import { Debt, DebtPayoffStrategy } from '../../domain/types';
import { planDebtPayoff } from '../../domain/debtPlanner';
import { MoneyText } from '../atoms/MoneyText';
import { QuickAmountChip } from '../atoms/QuickAmountChip';
import { DebtItemCard } from '../molecules/DebtItemCard';
import { EmptyState } from '../molecules/EmptyState';
import { PALETTE } from '../../constants/theme';

export interface DebtPayoffPlannerProps {
  debts: Debt[];
  extraMonthlyPayment?: number;
  onExtraMonthlyPaymentChange?: (amount: number) => void;
  strategy?: DebtPayoffStrategy;
  onStrategyChange?: (strategy: DebtPayoffStrategy) => void;
  onPayDebt?: (debt: Debt) => void;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function DebtPayoffPlanner({
  debts,
  extraMonthlyPayment = 0,
  onExtraMonthlyPaymentChange,
  strategy = 'snowball',
  onStrategyChange,
  onPayDebt,
  isPrivate = false,
  style,
  className = '',
  testID,
}: DebtPayoffPlannerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const [internalStrategy, setInternalStrategy] = useState<DebtPayoffStrategy>(strategy);
  const [internalExtra, setInternalExtra] = useState<number>(extraMonthlyPayment);

  const activeStrategy = onStrategyChange ? strategy : internalStrategy;
  const activeExtra = onExtraMonthlyPaymentChange ? extraMonthlyPayment : internalExtra;

  const handleStrategySelect = (newStrategy: DebtPayoffStrategy) => {
    if (onStrategyChange) {
      onStrategyChange(newStrategy);
    } else {
      setInternalStrategy(newStrategy);
    }
  };

  const handleAddExtra = (increment: number) => {
    const updated = activeExtra + increment;
    if (onExtraMonthlyPaymentChange) {
      onExtraMonthlyPaymentChange(updated);
    } else {
      setInternalExtra(updated);
    }
  };

  const plan = planDebtPayoff(debts, activeExtra, activeStrategy);

  if (debts.length === 0) {
    return (
      <View
        testID={testID}
        style={style}
        className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      >
        <EmptyState
          title="Sin deudas registradas"
          description="¡Paz total! No tienes deudas pendientes en este momento."
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
      {/* Tarjeta superior: Selector de Estrategia, Abono Extra y Resumen */}
      <View className="bg-surface border border-border-subtle rounded-md p-4">
        {/* Selector de Estrategia táctil >= 48dp */}
        <View className="flex-row rounded-sm bg-bg-subtle p-1 mb-4 border border-border-subtle">
          <Pressable
            onPress={() => handleStrategySelect('snowball')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Victorias Rápidas: Paga primero la deuda más pequeña"
            accessibilityState={{ selected: activeStrategy === 'snowball' }}
            className={`flex-1 min-h-[48px] items-center justify-center rounded-sm px-2 ${
              activeStrategy === 'snowball'
                ? 'bg-surface shadow-sm border border-border-subtle'
                : ''
            }`}
          >
            <View className="flex-row items-center">
              <Zap
                size={16}
                color={
                  activeStrategy === 'snowball'
                    ? palette.brandPrimary
                    : palette.textMuted
                }
                strokeWidth={2.2}
              />
              <Text
                className={`ml-1.5 text-xs font-sans-bold ${
                  activeStrategy === 'snowball'
                    ? 'text-brand'
                    : 'text-text-secondary'
                }`}
              >
                Victorias Rápidas
              </Text>
            </View>
            <Text className="text-[10px] font-sans text-text-muted mt-0.5">
              Menor saldo primero
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleStrategySelect('avalanche')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ahorra Más Intereses: Paga primero la deuda con mayor interés"
            accessibilityState={{ selected: activeStrategy === 'avalanche' }}
            className={`flex-1 min-h-[48px] items-center justify-center rounded-sm px-2 ${
              activeStrategy === 'avalanche'
                ? 'bg-surface shadow-sm border border-border-subtle'
                : ''
            }`}
          >
            <View className="flex-row items-center">
              <TrendingDown
                size={16}
                color={
                  activeStrategy === 'avalanche'
                    ? palette.brandPrimary
                    : palette.textMuted
                }
                strokeWidth={2.2}
              />
              <Text
                className={`ml-1.5 text-xs font-sans-bold ${
                  activeStrategy === 'avalanche'
                    ? 'text-brand'
                    : 'text-text-secondary'
                }`}
              >
                Ahorra Más Intereses
              </Text>
            </View>
            <Text className="text-[10px] font-sans text-text-muted mt-0.5">
              Mayor tasa primero
            </Text>
          </Pressable>
        </View>

        {/* Selector de Abono Extra Mensual */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Abono extra mensual
            </Text>
            <MoneyText
              amount={activeExtra}
              variant="row"
              tone="growth"
              isPrivate={isPrivate}
            />
          </View>

          <View className="flex-row flex-wrap gap-2">
            <QuickAmountChip amount={50000} onPress={handleAddExtra} />
            <QuickAmountChip amount={100000} onPress={handleAddExtra} />
            <QuickAmountChip amount={200000} onPress={handleAddExtra} />
          </View>
        </View>

        {/* Alerta de deuda impagable si aplica */}
        {plan.unpayableWarning && (
          <View
            accessible={true}
            accessibilityRole="alert"
            className="bg-finance-dangerSoft/50 border border-finance-danger/30 rounded-sm p-3 mb-4 flex-row items-start"
          >
            <AlertTriangle
              size={18}
              color={palette.financeDanger}
              strokeWidth={2.4}
              className="mt-0.5"
            />
            <Text className="ml-2 flex-1 text-xs font-sans-medium text-finance-danger leading-relaxed">
              {plan.explanation}
            </Text>
          </View>
        )}

        {/* Resumen del Plan */}
        <View className="bg-bg-subtle/50 rounded-sm p-3 border border-border-subtle">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Meses para ser libre
            </Text>
            <Text
              className="text-sm font-mono-bold text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {plan.monthsToFreedom} meses
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Meses que te ahorras
            </Text>
            <Text
              className="text-sm font-mono-bold text-finance-growth"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {plan.monthsSaved} meses antes
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Intereses que te ahorras
            </Text>
            <MoneyText
              amount={plan.interestSaved}
              variant="row"
              tone="growth"
              isPrivate={isPrivate}
            />
          </View>
        </View>
      </View>

      {/* Título de la sección de deudas */}
      <Text className="text-xs font-sans-bold text-text-primary px-1">
        Orden de ataque ({activeStrategy === 'snowball' ? 'Victorias Rápidas' : 'Ahorra Más Intereses'})
      </Text>

      {/* Lista de deudas hermanas independientes (sin tarjeta envolvente y sin divisores entre tarjetas) */}
      <View className="w-full gap-3">
        {debts.map((debt) => {
          const isPriority1 = plan.priorityDebt?.id === debt.id;
          const priorityLabel = isPriority1
            ? `Prioridad #1 ${
                activeStrategy === 'snowball' ? 'Menor Saldo' : 'Mayor Interés'
              }`
            : undefined;

          return (
            <DebtItemCard
              key={debt.id}
              debt={debt}
              priorityLabel={priorityLabel}
              onPayPress={() => onPayDebt?.(debt)}
              isPrivate={isPrivate}
            />
          );
        })}
      </View>
    </View>
  );
}