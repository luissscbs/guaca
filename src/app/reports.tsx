import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, PieChart, BarChart2, TrendingUp } from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { PALETTE } from '../constants/theme';
import { DonutChart } from '../components/organisms/DonutChart';
import { ComparisonBarChart } from '../components/organisms/ComparisonBarChart';
import { TrendLineChart } from '../components/organisms/TrendLineChart';

export default function ReportsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const coachSummary = useFinanceStore((state) => state.coachSummary);
  const settings = useFinanceStore((state) => state.settings);
  const transactions = useFinanceStore((state) => state.transactions);

  const isPrivate = !!settings?.isPrivateMode;

  // Cálculos reactivos de los pilares desde coachSummary o transacciones
  const vitalAmount = coachSummary?.vitalSpent || 0;
  const growthAmount = coachSummary?.growthSpent || 0;
  const leisureAmount = coachSummary?.leisureSpent || 0;
  const debtAmount = coachSummary?.debtSpent || 0;

  // Datos simulados o históricos para tendencia
  const trendData = [
    { month: 'Sep', amount: Math.max(0, (coachSummary?.emergencyFundBalance || 400000) * 0.6) },
    { month: 'Oct', amount: Math.max(0, (coachSummary?.emergencyFundBalance || 600000) * 0.8) },
    { month: 'Nov', amount: coachSummary?.emergencyFundBalance || 800000 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      {/* Cabecera */}
      <View className="px-4 py-3 flex-row items-center border-b border-border-subtle bg-bg-surface">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-bg-subtle mr-3"
        >
          <ArrowLeft size={20} color={palette.brandPrimary} />
        </Pressable>
        <View>
          <Text className="text-lg font-sans-extrabold text-text-primary">
            Radiografía de tu Plata
          </Text>
          <Text className="text-xs font-sans text-text-secondary">
            Gráficas claras, directas y sin misterios.
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Dona de Distribución por Pilares */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <PieChart size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Distribución por Pilares
            </Text>
          </View>
          <DonutChart
            vital={vitalAmount}
            growth={growthAmount}
            leisure={leisureAmount}
            debt={debtAmount}
            isPrivate={isPrivate}
          />
        </View>

        {/* 2. Barras Comparativas */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <BarChart2 size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Comparativa del Mes
            </Text>
          </View>
          <ComparisonBarChart
            netIncome={coachSummary?.totalIncome || settings?.netMonthlyIncome || 0}
            vitalMinimum={coachSummary?.vitalMinimum || 0}
            debtObligations={coachSummary?.activeDebtsMinPayment || 0}
            guiltFreeAvailable={coachSummary?.guiltFreeAvailable || 0}
            isPrivate={isPrivate}
          />
        </View>

        {/* 3. Línea de Evolución del Ahorro */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <TrendingUp size={18} color={palette.financeGrowth} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              Evolución de Tu Guaca
            </Text>
          </View>
          <TrendLineChart
            data={trendData}
            title="Crecimiento de tu Colchón"
            isPrivate={isPrivate}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
