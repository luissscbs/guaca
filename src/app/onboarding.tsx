import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { OnboardingWizard, OnboardingCompleteData } from '../components/organisms/OnboardingWizard';
import { GuacaLogo } from '../components/atoms/GuacaLogo';
import { useFinanceStore } from '../store/useFinanceStore';
import { PALETTE } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const completeOnboarding = useFinanceStore((state) => state.completeOnboarding);
  const wallets = useFinanceStore((state) => state.wallets);
  const addWallet = useFinanceStore((state) => state.addWallet);

  const handleComplete = async (data: OnboardingCompleteData) => {
    try {
      await completeOnboarding({
        userName: data.userName,
        netMonthlyIncome: data.netMonthlyIncome,
        vitalBreakdown: data.vitalBreakdown,
        initialWalletName: data.initialWalletName,
        initialWalletType: 'bank',
        initialWalletBalance: data.initialWalletBalance,
        monthStartDay: data.monthStartDay,
        seedBudgets: true,
        profileType: data.profileType || 'salary',
        initialPresets: data.initialPresets,
      });

      // Asegurar que exista la bóveda 'Mi Guaca'
      const hasVault = wallets.some((w) => w.type === 'vault' || w.name.toLowerCase().includes('guaca'));
      if (!hasVault) {
        await addWallet({
          name: 'Mi Guaca',
          type: 'vault',
          balance: 0,
        });
      }

      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error al completar onboarding:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas px-4 py-2">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View className="flex-row items-center justify-center my-3">
        <GuacaLogo size={36} />
        <View className="ml-3">
          <Text className="font-sans-bold text-xl text-text-primary">
            Guaca
          </Text>
          <Text className="font-sans-medium text-xs text-text-muted">
            Lo tuyo, intocable. Lo demás, bajo control.
          </Text>
        </View>
      </View>
      <View className="flex-1">
        <OnboardingWizard onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
}
