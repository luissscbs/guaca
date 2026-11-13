import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export type ProgressBarTone = 'brand' | 'vital' | 'growth' | 'warning' | 'danger';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  tone?: ProgressBarTone;
  height?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

const TONE_BG: Record<ProgressBarTone, string> = {
  brand: 'bg-brand',
  vital: 'bg-finance-vital',
  growth: 'bg-finance-growth',
  warning: 'bg-finance-warning',
  danger: 'bg-finance-danger',
};

export function ProgressBar({
  progress,
  tone = 'brand',
  height = 8,
  style,
  className = '',
  accessibilityLabel = 'Barra de progreso',
  testID,
}: ProgressBarProps) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const clamped = Math.min(100, Math.max(0, safeProgress));

  return (
    <View
      testID={testID}
      style={[{ height }, style]}
      className={`w-full bg-bg-subtle rounded-full overflow-hidden ${className}`}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View
        style={{ width: `${clamped}%`, height: '100%' }}
        className={`rounded-full ${TONE_BG[tone]}`}
      />
    </View>
  );
}
