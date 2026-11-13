import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import {
  MoneyText,
  MoneyTextVariant,
  MoneyTextTone,
  TrafficLightBadge,
  TrafficLightStatus,
} from '../atoms';

export interface MoneyStatCardProps {
  title: string;
  amount: number;
  variant?: MoneyTextVariant;
  tone?: MoneyTextTone;
  badgeStatus?: TrafficLightStatus;
  badgeLabel?: string;
  subtitle?: string;
  isPrivate?: boolean;
  showSign?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function MoneyStatCard({
  title,
  amount,
  variant = 'macro',
  tone = 'default',
  badgeStatus,
  badgeLabel,
  subtitle,
  isPrivate = false,
  showSign = false,
  style,
  className = '',
  testID,
}: MoneyStatCardProps) {
  return (
    <View
      testID={testID}
      style={style}
      className={`bg-bg-surface border border-border-subtle rounded-sm p-4 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-sans-medium text-text-secondary uppercase tracking-wider">
          {title}
        </Text>
        {badgeStatus && (
          <TrafficLightBadge status={badgeStatus} label={badgeLabel} size="sm" />
        )}
      </View>

      <MoneyText
        amount={amount}
        variant={variant}
        tone={tone}
        isPrivate={isPrivate}
        showSign={showSign}
      />

      {subtitle && (
        <Text className="text-xs font-sans text-text-muted mt-2">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
