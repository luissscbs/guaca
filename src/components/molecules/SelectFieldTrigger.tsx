import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/theme';

export interface SelectFieldTriggerProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
  errorMessage?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function SelectFieldTrigger({
  label,
  value,
  placeholder = 'Selecciona una opción',
  onPress,
  disabled = false,
  errorMessage,
  style,
  className = '',
  testID,
}: SelectFieldTriggerProps) {
  const hasError = Boolean(errorMessage);

  return (
    <View style={style} className={`w-full ${className}`} testID={testID}>
      {label && (
        <Text className="text-xs font-sans-medium text-text-secondary mb-1.5">
          {label}
        </Text>
      )}

      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        accessibilityState={{ disabled }}
        className={`min-h-[48px] px-3.5 py-3 rounded-sm bg-bg-subtle border ${
          hasError
            ? 'border-finance-danger'
            : 'border-border-subtle active:bg-bg-elevated'
        } flex-row items-center justify-between ${disabled ? 'opacity-40' : ''}`}
      >
        <Text
          className={`text-sm ${
            value ? 'font-sans-semibold text-text-primary' : 'font-sans text-text-muted'
          }`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={PALETTE.light.textSecondary} />
      </Pressable>

      {hasError && (
        <Text
          className="text-xs font-sans-medium text-finance-danger mt-1"
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
