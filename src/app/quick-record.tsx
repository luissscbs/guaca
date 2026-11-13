import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { X } from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { PALETTE } from '../constants/theme';
import { QuickRecordSheet, QuickRecordData } from '../components/organisms/QuickRecordSheet';
import { TransactionType } from '../domain/types';

export default function QuickRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialType?: string; presetId?: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const wallets = useFinanceStore((state) => state.wallets);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const quickPresets = useFinanceStore((state) => state.quickPresets);
  const addQuickPreset = useFinanceStore((state) => state.addQuickPreset);
  const updateQuickPreset = useFinanceStore((state) => state.updateQuickPreset);
  const deleteQuickPreset = useFinanceStore((state) => state.deleteQuickPreset);

  const initialType: TransactionType =
    params.initialType === 'income' || params.initialType === 'transfer'
      ? params.initialType
      : 'expense';

  const handleSubmit = async (data: QuickRecordData) => {
    try {
      await addTransaction({
        amount: data.amount,
        type: data.type,
        pillar: data.pillar,
        walletId: data.walletId,
        destinationWalletId: data.destinationWalletId,
        categoryId: data.categoryId,
        note: data.note,
      });
      router.back();
    } catch (e) {
      console.error('Error al registrar movimiento:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-surface" edges={['top', 'left', 'right']}>
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border-subtle">
        <View>
          <Text className="text-lg font-sans-bold text-text-primary">
            Anotar Rápido
          </Text>
          <Text className="text-xs font-sans text-text-secondary">
            En 2 toques: gasto, ingreso o traslado
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-bg-subtle"
        >
          <X size={20} color={palette.textSecondary} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <QuickRecordSheet
          wallets={wallets}
          onSubmit={handleSubmit}
          onClose={() => router.back()}
          initialType={initialType}
          presets={quickPresets}
          initialPresetId={params.presetId}
          onCreatePreset={addQuickPreset}
          onUpdatePreset={updateQuickPreset}
          onDeletePreset={deleteQuickPreset}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
