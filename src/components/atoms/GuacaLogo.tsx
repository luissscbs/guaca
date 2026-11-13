import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { PALETTE } from '../../constants/theme';

export interface GuacaLogoProps {
  size?: number;
  theme?: 'light' | 'dark';
  isPrivateMode?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
}

export function GuacaLogo({
  size = 40,
  theme = 'light',
  isPrivateMode = false,
  style,
  className,
  accessibilityLabel = 'Logotipo Guaca G-Vault',
}: GuacaLogoProps) {
  const palette = PALETTE[theme];

  const bgColor = isPrivateMode
    ? palette.financeVitalSoft
    : palette.brandSoft;

  const strokeColor = isPrivateMode
    ? palette.financeVital
    : palette.brandPrimary;

  return (
    <View
      style={style}
      className={className}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {/* Outer Vault Container */}
        <Rect
          x={2}
          y={2}
          width={36}
          height={36}
          rx={11}
          fill={bgColor}
          stroke={strokeColor}
          strokeWidth={2.2}
        />

        {/* Monolithic G Path */}
        <Path
          d="M27.5 14.5C25.8 11.8 23.1 10.2 19.8 10.2C14.4 10.2 10.2 14.5 10.2 20C10.2 25.5 14.4 29.8 19.8 29.8C24.8 29.8 28.6 26.4 29.2 21.6H23.2"
          stroke={strokeColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vault Core: Diamond in normal mode, 3 Lock Dots in private mode */}
        {isPrivateMode ? (
          <>
            <Circle cx={15} cy={20} r={2.2} fill={strokeColor} />
            <Circle cx={20} cy={20} r={2.2} fill={strokeColor} />
            <Circle cx={25} cy={20} r={2.2} fill={strokeColor} />
          </>
        ) : (
          <Path d="M20 15L24.5 20L20 25L15.5 20L20 15Z" fill={strokeColor} />
        )}
      </Svg>
    </View>
  );
}
