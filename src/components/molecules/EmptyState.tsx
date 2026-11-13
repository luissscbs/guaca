import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { GuacaButton } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onActionPress,
  icon,
  style,
  className = '',
  testID,
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      style={style}
      className={`py-8 px-4 items-center justify-center text-center ${className}`}
    >
      <View className="w-14 h-14 rounded-full bg-brand-soft items-center justify-center mb-4">
        {icon || <Sparkles size={28} color={PALETTE.light.brandPrimary} />}
      </View>

      <Text className="text-base font-sans-bold text-text-primary text-center mb-1.5">
        {title}
      </Text>

      <Text className="text-sm font-sans text-text-muted text-center max-w-xs mb-5 leading-relaxed">
        {description}
      </Text>

      {actionTitle && onActionPress && (
        <GuacaButton
          title={actionTitle}
          variant="primary"
          onPress={onActionPress}
          className="min-w-[160px]"
        />
      )}
    </View>
  );
}
