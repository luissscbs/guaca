import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { calculateEmergencyMonths } from '../../domain/coach';
import { EmergencyFundResult } from '../../domain/types';
import { formatMonths } from '../../utils/formatters';
import { MoneyText } from '../atoms/MoneyText';
import { ProgressBar } from '../atoms/ProgressBar';
import { GuacaButton } from '../atoms/GuacaButton';
import { GuacaDivider } from '../atoms/GuacaDivider';
import { PALETTE } from '../../constants/theme';

export interface EmergencyFundGaugeProps {
  emergencyFundBalance: number;
  vitalMinimum: number;
  result?: EmergencyFundResult;
  onContributePress?: () => void;
  isPrivate?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function EmergencyFundGauge({
  emergencyFundBalance,
  vitalMinimum,
  result: customResult,
  onContributePress,
  isPrivate = false,
  style,
  className = '',
  testID,
}: EmergencyFundGaugeProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const result =
    customResult ??
    calculateEmergencyMonths({
      emergencyFundBalance,
      vitalMinimum,
    });

  const {
    monthsCovered,
    daysCovered,
    progressPct,
    explanation,
  } = result;

  const milestones = [
    { targetMonths: 1, label: '1 mes', desc: 'Tranquilidad inicial' },
    { targetMonths: 3, label: '3 meses', desc: 'Estabilidad' },
    { targetMonths: 6, label: '6 meses', desc: 'Paz financiera' },
  ];

  return (
    <View
      testID={testID}
      style={style}
      className={`bg-surface border border-border-subtle rounded-md p-4 w-full ${className}`}
      accessible={true}
      accessibilityRole="summary"
    >
      {/* Cabecera cercana y familiar estilo Nequi */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          <ShieldCheck size={20} color={palette.financeGrowth} strokeWidth={2.2} />
          <Text className="ml-2 text-sm font-sans-bold text-text-primary">
            Tu Guaca
          </Text>
        </View>
        <Text className="text-xs font-sans-semibold text-finance-growth">
          {progressPct}% alcanzado
        </Text>
      </View>

      <Text className="text-xs font-sans text-text-secondary mb-2">
        ¿Cuántos meses te aguanta tu Guaca?
      </Text>

      {/* Meses y días cubiertos con tabular-nums obligatorio */}
      <View className="my-1">
        <Text
          className="text-2xl font-mono-bold text-text-primary"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMonths(monthsCovered)}
        </Text>
        <Text className="text-xs font-sans text-text-muted mt-0.5">
          {daysCovered} días cubiertos de Mínimo Vital
        </Text>
      </View>

      {/* Barra de progreso visual */}
      <View className="my-2">
        <ProgressBar
          progress={progressPct}
          tone="growth"
          height={10}
          accessibilityLabel={`Progreso de Tu Guaca: ${progressPct}%`}
        />
      </View>

      {/* Saldo actual vs meta en pesos */}
      <View className="flex-row items-center justify-between mt-1 mb-2">
        <View>
          <Text className="text-[11px] font-sans text-text-muted">Ahorro en tu Guaca</Text>
          <MoneyText
            amount={emergencyFundBalance}
            variant="row"
            tone="default"
            isPrivate={isPrivate}
          />
        </View>
        <View className="items-end">
          <Text className="text-[11px] font-sans text-text-muted">Siguiente escalón</Text>
          <MoneyText
            amount={result.goalAmount}
            variant="row"
            tone="growth"
            isPrivate={isPrivate}
          />
        </View>
      </View>

      <GuacaDivider className="my-3" />

      {/* Hitos de tranquilidad */}
      <View className="flex-row items-center justify-between py-1">
        {milestones.map((milestone) => {
          const reached = monthsCovered >= milestone.targetMonths;
          return (
            <View
              key={milestone.targetMonths}
              className={`flex-1 items-center px-1 py-2 mx-1 rounded-sm border ${
                reached
                  ? 'bg-finance-growthSoft/40 border-finance-growth/30'
                  : 'bg-bg-subtle/50 border-border-subtle'
              }`}
            >
              <View className="flex-row items-center">
                {reached ? (
                  <CheckCircle2
                    size={14}
                    color={palette.financeGrowth}
                    strokeWidth={2.4}
                  />
                ) : (
                  <Clock size={14} color={palette.textMuted} strokeWidth={2} />
                )}
                <Text
                  className={`ml-1 text-xs font-sans-bold ${
                    reached ? 'text-finance-growth' : 'text-text-muted'
                  }`}
                >
                  {milestone.label}
                </Text>
              </View>
              <Text
                className="text-[10px] font-sans text-text-muted text-center mt-0.5"
                numberOfLines={1}
              >
                {milestone.desc}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Consejo motivador empático */}
      {explanation ? (
        <View className="mt-3 bg-brand-soft/50 rounded-sm p-2.5 flex-row items-start border border-brand/10">
          <Sparkles
            size={16}
            color={palette.brandPrimary}
            strokeWidth={2}
            className="mt-0.5"
          />
          <Text className="ml-2 flex-1 text-xs font-sans text-text-secondary leading-relaxed">
            {explanation}
          </Text>
        </View>
      ) : null}

      {/* Botón de aporte con lenguaje de Guaca */}
      {onContributePress && (
        <View className="mt-4">
          <GuacaButton
            title="Aportar a mi Guaca"
            variant="tonal"
            onPress={onContributePress}
            accessibilityLabel="Aportar a mi Guaca"
          />
        </View>
      )}
    </View>
  );
}