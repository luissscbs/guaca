import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { formatCOP } from '../../utils/formatters';

export type MoneyTextVariant = 'hero' | 'macro' | 'row' | 'secondary';
export type MoneyTextTone =
  | 'default'
  | 'positive'
  | 'vital'
  | 'growth'
  | 'warning'
  | 'danger'
  | 'muted';

export interface MoneyTextProps {
  amount: number;
  variant?: MoneyTextVariant;
  tone?: MoneyTextTone;
  isPrivate?: boolean;
  showSign?: boolean;
  style?: StyleProp<TextStyle>;
  className?: string;
  accessibilityLabel?: string;
}

const VARIANT_CLASSES: Record<MoneyTextVariant, string> = {
  hero: 'text-3xl font-mono-bold',
  macro: 'text-2xl font-mono-bold',
  row: 'text-base font-mono-semibold',
  secondary: 'text-xs font-mono',
};

const TONE_CLASSES: Record<MoneyTextTone, string> = {
  default: 'text-text-primary',
  positive: 'text-finance-growth',
  growth: 'text-finance-growth',
  vital: 'text-finance-vital',
  warning: 'text-finance-warning',
  danger: 'text-finance-danger',
  muted: 'text-text-muted',
};

export function MoneyText({
  amount,
  variant = 'row',
  tone = 'default',
  isPrivate = false,
  showSign = false,
  style,
  className = '',
  accessibilityLabel,
}: MoneyTextProps) {
  const formatted = formatCOP(amount, { isPrivate, showSign });

  const accessibleLabel =
    accessibilityLabel ??
    (isPrivate
      ? 'Monto oculto por privacidad'
      : `${formatted} pesos colombianos`);

  const combinedClasses = [
    VARIANT_CLASSES[variant],
    TONE_CLASSES[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Text
      className={combinedClasses}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibleLabel}
    >
      {formatted}
    </Text>
  );
}
