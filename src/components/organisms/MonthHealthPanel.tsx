import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { MonthHealthStatus } from '../../domain/types';
import { MoneyText } from '../atoms/MoneyText';
import { TrafficLightBadge } from '../atoms/TrafficLightBadge';
import { GuacaDivider } from '../atoms/GuacaDivider';

export interface MonthHealthPanelProps {
  netIncome: number;
  vitalMinimum: number;
  debtObligations: number;
  savingCapacity: number;
  guiltFreeAvailable: number;
  status: MonthHealthStatus;
  explanation?: string;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function MonthHealthPanel({
  netIncome,
  vitalMinimum,
  debtObligations,
  savingCapacity,
  guiltFreeAvailable,
  status,
  explanation,
  isPrivate = false,
  style,
  className = '',
  testID,
}: MonthHealthPanelProps) {
  const toneMap = {
    peace: 'growth',
    alert: 'warning',
    risk: 'danger',
  } as const;

  const currentTone = toneMap[status] ?? 'default';

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Cabecera con estado y semáforo - copy cercano */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-sans-medium text-text-secondary">
          Tu plata libre para gastar sin culpa
        </Text>
        <TrafficLightBadge status={status} size="sm" />
      </View>

      {/* Monto héroe disponible */}
      <View className="my-1">
        <MoneyText
          amount={guiltFreeAvailable}
          variant="hero"
          tone={currentTone}
          isPrivate={isPrivate}
        />
      </View>

      {/* Explicación en lenguaje cotidiano del Coach */}
      {explanation ? (
        <Text className="text-xs font-sans text-text-secondary leading-relaxed mt-1">
          {explanation}
        </Text>
      ) : null}

      <GuacaDivider className="my-3.5" />

      {/* Desglose plano con filas limpias (cero tarjetas anidadas) */}
      <View className="space-y-2">
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs font-sans-medium text-text-secondary">
            Ingreso neto
          </Text>
          <MoneyText
            amount={netIncome}
            variant="row"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>

        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs font-sans-medium text-text-secondary">
            Lo sagrado del mes (Mínimo Vital)
          </Text>
          <MoneyText
            amount={vitalMinimum}
            variant="row"
            tone="vital"
            isPrivate={isPrivate}
          />
        </View>

        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs font-sans-medium text-text-secondary">
            Cuotas de deudas
          </Text>
          <MoneyText
            amount={debtObligations}
            variant="row"
            tone="danger"
            isPrivate={isPrivate}
          />
        </View>

        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs font-sans-medium text-text-secondary">
            Capacidad de ahorro
          </Text>
          <MoneyText
            amount={savingCapacity}
            variant="row"
            tone="growth"
            isPrivate={isPrivate}
          />
        </View>
      </View>
    </View>
  );
}