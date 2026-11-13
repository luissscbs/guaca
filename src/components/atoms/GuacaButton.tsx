import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tonal';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface GuacaButtonProps {
  title?: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  hapticFeedback?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

const VARIANT_CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-brand active:bg-brand-pressed border border-brand',
  secondary: 'bg-bg-subtle active:bg-bg-elevated border border-border-subtle',
  ghost: 'bg-transparent active:bg-bg-subtle border border-transparent',
  danger: 'bg-finance-danger active:opacity-90 border border-finance-danger',
  tonal: 'bg-brand-soft active:opacity-90 border border-brand/20',
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary: 'text-text-onBrand font-sans-bold',
  secondary: 'text-text-primary font-sans-semibold',
  ghost: 'text-brand font-sans-semibold',
  danger: 'text-white font-sans-bold',
  tonal: 'text-brand font-sans-bold',
};

export function GuacaButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconLeft,
  iconRight,
  hapticFeedback = true,
  style,
  className = '',
  accessibilityLabel,
  testID,
}: GuacaButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;

    if (hapticFeedback) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // Haptics not available on Web or during Jest tests; fail silently
      }
    }

    onPress(e);
  };

  const containerClasses = [
    'min-h-[48px] px-4 py-3 rounded-sm flex-row items-center justify-center',
    VARIANT_CONTAINER[variant],
    disabled ? 'opacity-40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textClasses = ['text-sm text-center', VARIANT_TEXT[variant]].join(' ');
  const displayIconLeft = iconLeft || icon;

  const spinnerColor =
    variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#0B6B53';

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={style}
      className={containerClasses}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
          {displayIconLeft && <View className="mr-2">{displayIconLeft}</View>}
          {title && <Text className={textClasses}>{title}</Text>}
          {iconRight && <View className="ml-2">{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
}
