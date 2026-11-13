import React from 'react';
import {
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type IconButtonTone = 'default' | 'brand' | 'danger' | 'ghost';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  tone?: IconButtonTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

const TONE_CLASSES: Record<IconButtonTone, string> = {
  default: 'bg-bg-subtle active:bg-bg-elevated border border-border-subtle',
  brand: 'bg-brand-soft active:opacity-80 border border-brand/20',
  danger: 'bg-finance-dangerSoft active:opacity-80 border border-finance-danger/20',
  ghost: 'bg-transparent active:bg-bg-subtle border border-transparent',
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'default',
  disabled = false,
  style,
  className = '',
  testID,
}: IconButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Ignore in tests
    }
    onPress(e);
  };

  const containerClasses = [
    'min-w-[48px] min-h-[48px] rounded-full items-center justify-center p-2.5',
    TONE_CLASSES[tone],
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
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={style}
      className={containerClasses}
    >
      {icon}
    </Pressable>
  );
}
