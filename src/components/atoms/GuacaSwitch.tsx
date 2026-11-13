import React from 'react';
import { View, Switch, StyleProp, ViewStyle, Platform } from 'react-native';
import { PALETTE } from '../../constants/theme';

export interface GuacaSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function GuacaSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  style,
  className = '',
  testID,
}: GuacaSwitchProps) {
  return (
    <View
      style={style}
      className={`min-h-[48px] justify-center items-center ${className}`}
    >
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: PALETTE.light.bgSubtle,
          true: PALETTE.light.brandPrimary,
        }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? '#FFFFFF'
              : PALETTE.light.textMuted
            : undefined
        }
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}
