import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react-native';
import { PALETTE } from '../../constants/theme';

export type TrafficLightStatus = 'peace' | 'alert' | 'risk' | 'vital';

export interface TrafficLightBadgeProps {
  status: TrafficLightStatus;
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

const STATUS_CONFIG = {
  peace: {
    defaultLabel: 'Paz Financiera',
    bgClass: 'bg-finance-growthSoft',
    textClass: 'text-finance-growth font-sans-semibold',
    iconColor: PALETTE.light.financeGrowth,
    Icon: CheckCircle2,
  },
  alert: {
    defaultLabel: 'Alerta',
    bgClass: 'bg-finance-warningSoft',
    textClass: 'text-finance-warning font-sans-semibold',
    iconColor: PALETTE.light.financeWarning,
    Icon: AlertTriangle,
  },
  risk: {
    defaultLabel: 'Riesgo',
    bgClass: 'bg-finance-dangerSoft',
    textClass: 'text-finance-danger font-sans-semibold',
    iconColor: PALETTE.light.financeDanger,
    Icon: AlertOctagon,
  },
  vital: {
    defaultLabel: 'Mínimo Vital',
    bgClass: 'bg-finance-vitalSoft',
    textClass: 'text-finance-vital font-sans-semibold',
    iconColor: PALETTE.light.financeVital,
    Icon: ShieldCheck,
  },
};

export function TrafficLightBadge({
  status,
  label,
  size = 'md',
  style,
  className = '',
  testID,
}: TrafficLightBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.defaultLabel;
  const iconSize = size === 'sm' ? 14 : 16;
  const paddingClasses = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const textClasses = size === 'sm' ? 'text-xs' : 'text-xs';

  const containerClasses = [
    'flex-row items-center rounded-full self-start',
    paddingClasses,
    config.bgClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const IconComponent = config.Icon;

  return (
    <View
      testID={testID}
      style={style}
      className={containerClasses}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Estado: ${displayLabel}`}
    >
      <IconComponent size={iconSize} color={config.iconColor} strokeWidth={2.4} />
      <Text className={`ml-1.5 ${textClasses} ${config.textClass}`}>
        {displayLabel}
      </Text>
    </View>
  );
}
