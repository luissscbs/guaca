import React from 'react';
import {
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export interface QuickFABProps {
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export function QuickFAB({
  onPress,
  style,
  className = '',
  accessibilityLabel = 'Anotar rápido',
  testID,
}: QuickFABProps) {
  const handlePress = (e: GestureResponderEvent) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      // Ignore haptics errors in tests/web
    }
    onPress(e);
  };

  const containerClasses = [
    'w-14 h-14 rounded-full bg-brand items-center justify-center active:bg-brand-pressed shadow-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      style={[{ elevation: 6 }, style]}
      className={containerClasses}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Plus size={28} color="#FFFFFF" strokeWidth={2.6} />
    </Pressable>
  );
}
