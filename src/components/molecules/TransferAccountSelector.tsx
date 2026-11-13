import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ArrowDown, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/theme';

export interface TransferAccountSelectorProps {
  sourceAccountId?: string;
  destinationAccountId?: string;
  sourceAccountName?: string;
  destinationAccountName?: string;
  onSelectSource: () => void;
  onSelectDestination: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export function TransferAccountSelector({
  sourceAccountId,
  destinationAccountId,
  sourceAccountName,
  destinationAccountName,
  onSelectSource,
  onSelectDestination,
  style,
  className = '',
  testID,
}: TransferAccountSelectorProps) {
  const isSameAccount =
    Boolean(sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId) ||
    Boolean(
      sourceAccountName &&
        destinationAccountName &&
        sourceAccountName === destinationAccountName &&
        !sourceAccountId &&
        !destinationAccountId
    );

  return (
    <View style={style} className={`w-full ${className}`} testID={testID}>
      {/* Source Account Box */}
      <View className="mb-2">
        <Text className="text-xs font-sans-medium text-text-secondary mb-1">
          Cuenta de origen
        </Text>
        <Pressable
          onPress={onSelectSource}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar cuenta de origen, seleccionada actualmente: ${
            sourceAccountName || 'Ninguna'
          }`}
          className="min-h-[48px] px-3.5 py-3 rounded-sm bg-bg-subtle border border-border-subtle flex-row items-center justify-between active:bg-bg-elevated"
        >
          <Text
            className={`text-sm ${
              sourceAccountName
                ? 'font-sans-bold text-text-primary'
                : 'font-sans text-text-muted'
            }`}
          >
            {sourceAccountName || 'Selecciona de dónde sale la plata'}
          </Text>
          <ChevronRight size={18} color={PALETTE.light.textSecondary} />
        </Pressable>
      </View>

      {/* Down Arrow Indicator */}
      <View className="items-center my-1">
        <View className="w-8 h-8 rounded-full bg-bg-subtle items-center justify-center border border-border-subtle">
          <ArrowDown size={16} color={PALETTE.light.brandPrimary} />
        </View>
      </View>

      {/* Destination Account Box */}
      <View className="mt-1">
        <Text className="text-xs font-sans-medium text-text-secondary mb-1">
          Cuenta de destino
        </Text>
        <Pressable
          onPress={onSelectDestination}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar cuenta de destino, seleccionada actualmente: ${
            destinationAccountName || 'Ninguna'
          }`}
          className={`min-h-[48px] px-3.5 py-3 rounded-sm bg-bg-subtle border ${
            isSameAccount ? 'border-finance-danger' : 'border-border-subtle'
          } flex-row items-center justify-between active:bg-bg-elevated`}
        >
          <Text
            className={`text-sm ${
              destinationAccountName
                ? 'font-sans-bold text-text-primary'
                : 'font-sans text-text-muted'
            }`}
          >
            {destinationAccountName || 'Selecciona a dónde llega la plata'}
          </Text>
          <ChevronRight size={18} color={PALETTE.light.textSecondary} />
        </Pressable>
      </View>

      {isSameAccount && (
        <View className="flex-row items-center mt-2 px-1" accessibilityRole="alert">
          <AlertTriangle size={14} color={PALETTE.light.financeDanger} />
          <Text className="text-xs font-sans-medium text-finance-danger ml-1.5 flex-1">
            La cuenta de origen y destino no pueden ser la misma
          </Text>
        </View>
      )}
    </View>
  );
}
