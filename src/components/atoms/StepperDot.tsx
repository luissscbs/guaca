import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export interface StepperDotProps {
  active: boolean;
  completed?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function StepperDot({
  active,
  completed = false,
  style,
  className = '',
  testID,
}: StepperDotProps) {
  const bgClass = active
    ? 'bg-brand w-6'
    : completed
    ? 'bg-brand/60 w-2.5'
    : 'bg-border-subtle w-2.5';

  return (
    <View
      testID={testID}
      style={style}
      className={`h-2.5 rounded-full ${bgClass} mx-1 transition-all ${className}`}
    />
  );
}
