import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { formatCOP } from '@/utils/formatters';

export default function HomeScreen() {
  const sampleAmount = 1250000;

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-sans-extrabold text-3xl text-text-primary text-center">
          Guaca
        </Text>
        <Text className="font-sans-medium text-sm text-text-secondary mt-2 text-center">
          Lo tuyo, intocable. Lo demás, bajo control.
        </Text>
        <View className="mt-8 p-4 rounded-md bg-bg-surface border border-border-subtle w-full max-w-sm items-center">
          <Text className="font-sans-medium text-xs text-text-muted mb-1">
            Capacidad de Ahorro Real
          </Text>
          <Text
            className="font-mono-bold text-2xl text-finance-growth"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatCOP(sampleAmount)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
