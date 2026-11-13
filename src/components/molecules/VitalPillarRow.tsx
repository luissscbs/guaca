import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Home, ShoppingBag, Zap, Bus } from 'lucide-react-native';
import { VitalBreakdown } from '../../domain/types';
import { GuacaInput } from '../atoms';
import { PALETTE } from '../../constants/theme';

export interface VitalPillarRowProps {
  pillarKey: keyof VitalBreakdown;
  title: string;
  description: string;
  value: string;
  onChangeValue: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

function getPillarIcon(key: keyof VitalBreakdown) {
  switch (key) {
    case 'housing':
      return <Home size={20} color={PALETTE.light.financeVital} />;
    case 'food':
      return <ShoppingBag size={20} color={PALETTE.light.financeGrowth} />;
    case 'utilities':
      return <Zap size={20} color={PALETTE.light.financeWarning} />;
    case 'transport':
      return <Bus size={20} color={PALETTE.light.brandPrimary} />;
  }
}

export function VitalPillarRow({
  pillarKey,
  title,
  description,
  value,
  onChangeValue,
  style,
  className = '',
  testID,
}: VitalPillarRowProps) {
  return (
    <View
      testID={testID}
      style={style}
      className={`py-3 border-b border-border-subtle ${className}`}
    >
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-full bg-bg-subtle items-center justify-center mr-2.5">
          {getPillarIcon(pillarKey)}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-sans-bold text-text-primary">
            {title}
          </Text>
          <Text className="text-xs font-sans text-text-muted mt-0.5">
            {description}
          </Text>
        </View>
      </View>

      <GuacaInput
        prefix="$"
        placeholder="0"
        value={value}
        onChangeText={onChangeValue}
        isNumericCOP={true}
        accessibilityLabel={`Monto mensual para ${title}`}
      />
    </View>
  );
}
