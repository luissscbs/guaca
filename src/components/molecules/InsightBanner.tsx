import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { GuacaButton } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface InsightBannerProps {
  message: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function InsightBanner({
  message,
  actionTitle,
  onActionPress,
  style,
  className = '',
  testID,
}: InsightBannerProps) {
  return (
    <View
      testID={testID}
      style={style}
      className={`bg-brand-soft border border-brand/20 rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-full bg-brand items-center justify-center mr-2.5">
          <Sparkles size={16} color="#FFFFFF" />
        </View>
        <Text className="text-sm font-sans-bold text-brand">
          Pablo Financiero
        </Text>
      </View>

      <Text className="text-sm font-sans text-text-primary leading-relaxed mb-3">
        {message}
      </Text>

      {actionTitle && onActionPress && (
        <GuacaButton
          title={actionTitle}
          variant="tonal"
          size="sm"
          onPress={onActionPress}
        />
      )}
    </View>
  );
}
