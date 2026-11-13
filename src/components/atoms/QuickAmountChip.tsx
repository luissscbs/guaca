import React from 'react';
import {
  Pressable,
  Text,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { formatCOP } from '../../utils/formatters';

export interface QuickAmountChipProps {
  amount: number;
  onPress: (amount: number) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function QuickAmountChip({
  amount,
  onPress,
  disabled = false,
  style,
  className = '',
  testID,
}: QuickAmountChipProps) {
  const formatted = formatCOP(amount);
  const label = `+${formatted}`;

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    onPress(amount);
  };

  const containerClasses = [
    'min-h-[48px] px-3.5 py-2.5 rounded-full bg-bg-subtle active:bg-bg-elevated border border-border-subtle items-center justify-center',
    disabled ? 'opacity-40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Sumar ${formatted} pesos`}
      style={style}
      className={containerClasses}
    >
      <Text
        className="text-xs font-mono-semibold text-brand"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
