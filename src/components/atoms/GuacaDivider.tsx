import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export interface GuacaDividerProps {
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function GuacaDivider({
  style,
  className = '',
  testID,
}: GuacaDividerProps) {
  return (
    <View
      testID={testID}
      style={style}
      className={`h-[1px] w-full bg-border-subtle my-2 ${className}`}
    />
  );
}
