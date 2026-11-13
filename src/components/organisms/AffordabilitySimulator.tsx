import React, { useState } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import { HelpCircle, Calculator } from 'lucide-react-native';
import { simulatePurchase } from '../../domain/coach';
import { PurchaseSimulationResult } from '../../domain/types';
import { formatCOP, parseCOPInput } from '../../utils/formatters';
import { GuacaInput } from '../atoms/GuacaInput';
import { TrafficLightBadge } from '../atoms/TrafficLightBadge';
import { GuacaDivider } from '../atoms/GuacaDivider';
import { MoneyText } from '../atoms/MoneyText';
import { PALETTE } from '../../constants/theme';

export interface AffordabilitySimulatorProps {
  savingCapacity: number;
  vitalMinimum?: number;
  onSimulate?: (result: PurchaseSimulationResult) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function AffordabilitySimulator({
  savingCapacity,
  vitalMinimum = 0,
  onSimulate,
  style,
  className = '',
  testID,
}: AffordabilitySimulatorProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const [amountStr, setAmountStr] = useState<string>('');
  const [months, setMonths] = useState<number>(1);

  const amount = parseCOPInput(amountStr);
  const result = simulatePurchase({
    amount,
    months,
    savingCapacity,
    vitalMinimum,
  });

  const handleAmountChange = (text: string) => {
    setAmountStr(text);
    if (onSimulate) {
      const parsed = parseCOPInput(text);
      const res = simulatePurchase({
        amount: parsed,
        months,
        savingCapacity,
        vitalMinimum,
      });
      onSimulate(res);
    }
  };

  const handleMonthsChange = (newMonths: number) => {
    setMonths(newMonths);
    if (onSimulate) {
      const res = simulatePurchase({
        amount,
        months: newMonths,
        savingCapacity,
        vitalMinimum,
      });
      onSimulate(res);
    }
  };

  const installmentOptions = [1, 3, 6, 12];

  const verdictConfig = {
    safe: {
      status: 'peace' as const,
      label: 'Compra Segura',
      badgeClass: 'text-finance-growth',
    },
    warning: {
      status: 'alert' as const,
      label: 'Cuidado con el Ahorro',
      badgeClass: 'text-finance-warning',
    },
    danger: {
      status: 'risk' as const,
      label: 'Peligro Mínimo Vital',
      badgeClass: 'text-finance-danger',
    },
  }[result.verdict];

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Encabezado */}
      <View className="flex-row items-center mb-3">
        <Calculator size={20} color={palette.brandPrimary} strokeWidth={2.2} />
        <View className="ml-2">
          <Text className="text-sm font-sans-bold text-text-primary">
            ¿Me alcanza de verdad?
          </Text>
          <Text className="text-xs font-sans text-text-secondary">
            Simulador de compras y cuotas sin autoengaños
          </Text>
        </View>
      </View>

      {/* Input de monto */}
      <View className="mb-3">
        <GuacaInput
          label="¿Cuánto cuesta la compra?"
          placeholder="Monto total de la compra"
          prefix="$"
          isNumericCOP={true}
          value={amountStr}
          onChangeText={handleAmountChange}
        />
      </View>

      {/* Selector de cuotas táctil >= 48dp */}
      <View className="mb-4">
        <Text className="text-xs font-sans-medium text-text-secondary mb-1.5">
          ¿En cuántas cuotas mensuales?
        </Text>
        <View className="flex-row gap-2">
          {installmentOptions.map((opt) => {
            const isSelected = months === opt;
            const label = opt === 1 ? '1 cuota' : `${opt} cuotas`;
            return (
              <Pressable
                key={opt}
                onPress={() => handleMonthsChange(opt)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
                className={`flex-1 min-h-[48px] items-center justify-center rounded-sm border ${
                  isSelected
                    ? 'bg-brand border-brand'
                    : 'bg-bg-subtle border-border-subtle active:bg-bg-elevated'
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    isSelected ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <GuacaDivider className="my-2" />

      {/* Resultado y Veredicto */}
      <View className="my-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-sans-medium text-text-secondary">
            Diagnóstico del Coach
          </Text>
          <TrafficLightBadge
            status={verdictConfig.status}
            label={verdictConfig.label}
          />
        </View>

        {/* Cuota calculada con tabular-nums obligatorio */}
        <View className="bg-bg-subtle/60 rounded-sm p-3 border border-border-subtle mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-sans-medium text-text-secondary">
              Cuota mensual a pagar
            </Text>
            <Text
              className="text-base font-mono-bold text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCOP(result.monthlyQuota)} / mes
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-1.5">
            <Text className="text-xs font-sans text-text-muted">
              Margen de ahorro restante
            </Text>
            <MoneyText
              amount={result.remainingSavingCapacity}
              variant="row"
              tone={result.remainingSavingCapacity > 0 ? 'growth' : 'danger'}
            />
          </View>
        </View>

        {/* Explicación en lenguaje para dummies */}
        <View className="flex-row items-start">
          <HelpCircle
            size={16}
            color={palette.textMuted}
            strokeWidth={2}
            className="mt-0.5"
          />
          <Text className="ml-2 flex-1 text-xs font-sans text-text-secondary leading-relaxed">
            {result.explanation}
          </Text>
        </View>
      </View>
    </View>
  );
}