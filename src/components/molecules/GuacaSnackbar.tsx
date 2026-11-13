import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';

export interface GuacaSnackbarProps {
  visible: boolean;
  message: string;
  canUndo?: boolean;
  onUndo?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function GuacaSnackbar({
  visible,
  message,
  canUndo = false,
  onUndo,
  onDismiss,
  style,
  className = '',
  testID,
}: GuacaSnackbarProps) {
  if (!visible) return null;

  return (
    <View
      testID={testID}
      style={[{ elevation: 6 }, style]}
      className={`bg-text-primary rounded-sm p-4 flex-row items-center justify-between shadow-xl ${className}`}
      accessible={true}
      accessibilityRole="alert"
    >
      <Text
        className="text-sm font-sans-medium text-white flex-1 mr-3"
        numberOfLines={2}
      >
        {message}
      </Text>

      <View className="flex-row items-center space-x-2">
        {canUndo && onUndo && (
          <Pressable
            onPress={onUndo}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Deshacer"
            className="min-h-[48px] px-3 justify-center items-center rounded-sm bg-brand/20 active:bg-brand/30"
          >
            <Text className="text-sm font-sans-bold text-brand">Deshacer</Text>
          </Pressable>
        )}

        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cerrar notificación"
            className="min-h-[48px] min-w-[48px] justify-center items-center rounded-sm active:bg-white/10"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
