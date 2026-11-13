import React from 'react';
import {
  Pressable,
  Text,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import {
  Shield,
  TrendingUp,
  Sparkles,
  CreditCard,
  ArrowDownLeft,
  ArrowLeftRight,
  Layers,
  LucideIcon,
} from 'lucide-react-native';
import { FinancialPillar } from '../../domain/types';
import { PALETTE } from '../../constants/theme';

export type PillarChipType = FinancialPillar | 'all';

export interface PillarChipProps {
  pillar: PillarChipType;
  label?: string;
  selected?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

const PILLAR_CONFIG: Record<
  PillarChipType,
  {
    defaultLabel: string;
    Icon: LucideIcon;
    activeColor: string;
    softColor: string;
  }
> = {
  vital: {
    defaultLabel: 'Mínimo Vital',
    Icon: Shield,
    activeColor: PALETTE.light.financeVital,
    softColor: PALETTE.light.financeVitalSoft,
  },
  growth: {
    defaultLabel: 'Ahorro',
    Icon: TrendingUp,
    activeColor: PALETTE.light.financeGrowth,
    softColor: PALETTE.light.financeGrowthSoft,
  },
  leisure: {
    defaultLabel: 'Ocio',
    Icon: Sparkles,
    activeColor: '#7C3AED',
    softColor: '#EDE9FE',
  },
  debt: {
    defaultLabel: 'Deudas',
    Icon: CreditCard,
    activeColor: PALETTE.light.financeDanger,
    softColor: PALETTE.light.financeDangerSoft,
  },
  income: {
    defaultLabel: 'Ingresos',
    Icon: ArrowDownLeft,
    activeColor: PALETTE.light.brandPrimary,
    softColor: PALETTE.light.brandSoft,
  },
  transfer: {
    defaultLabel: 'Traslados',
    Icon: ArrowLeftRight,
    activeColor: '#475569',
    softColor: '#F1F5F9',
  },
  all: {
    defaultLabel: 'Todos',
    Icon: Layers,
    activeColor: PALETTE.light.brandPrimary,
    softColor: PALETTE.light.brandSoft,
  },
};

export function PillarChip({
  pillar,
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
  className = '',
  testID,
}: PillarChipProps) {
  const config = PILLAR_CONFIG[pillar];
  const displayLabel = label ?? config.defaultLabel;
  const IconComponent = config.Icon;

  const containerClasses = [
    'min-h-[48px] px-3.5 py-2.5 rounded-full flex-row items-center justify-center border',
    selected
      ? 'bg-brand border-brand'
      : 'bg-bg-subtle border-border-subtle active:bg-bg-elevated',
    disabled ? 'opacity-40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconColor = selected ? '#FFFFFF' : config.activeColor;
  const textColor = selected
    ? 'text-text-onBrand font-sans-bold'
    : 'text-text-primary font-sans-semibold';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Filtro ${displayLabel}`}
      style={style}
      className={containerClasses}
    >
      <IconComponent size={16} color={iconColor} strokeWidth={2.4} />
      <Text className={`ml-2 text-xs ${textColor}`}>{displayLabel}</Text>
    </Pressable>
  );
}
