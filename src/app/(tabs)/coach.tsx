import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Sparkles, Shield, Search, Key, ChevronRight, BarChart3, HelpCircle, Zap, ShieldCheck } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PALETTE } from '../../constants/theme';
import { EmergencyFundGauge } from '../../components/organisms/EmergencyFundGauge';
import { DebtPayoffPlanner } from '../../components/organisms/DebtPayoffPlanner';
import { AffordabilitySimulator } from '../../components/organisms/AffordabilitySimulator';
import { InsightBanner } from '../../components/molecules/InsightBanner';
import { EmptyState } from '../../components/molecules/EmptyState';
import { GuacaButton } from '../../components/atoms/GuacaButton';
import { GuacaDivider } from '../../components/atoms/GuacaDivider';

export default function CoachScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const settings = useFinanceStore((state) => state.settings);
  const coachSummary = useFinanceStore((state) => state.coachSummary);
  const detectiveInsights = useFinanceStore((state) => state.detectiveInsights);
  const debts = useFinanceStore((state) => state.debts);
  const debtPlan = useFinanceStore((state) => state.debtPlan);
  const aiCoachAdvice = useFinanceStore((state) => state.aiCoachAdvice);
  const isAiLoading = useFinanceStore((state) => state.isAiLoading);
  const askAiCoach = useFinanceStore((state) => state.askAiCoach);
  const refreshDebtPlan = useFinanceStore((state) => state.refreshDebtPlan);

  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(0);

  const isPrivate = !!settings?.isPrivateMode;
  const hasGeminiKey = !!settings?.geminiApiKey?.trim();

  const handleAskAI = async () => {
    try {
      await askAiCoach();
    } catch (e) {
      console.error('Error al consultar Coach IA:', e);
    }
  };

  const handleStrategyChange = (st: 'snowball' | 'avalanche') => {
    setDebtStrategy(st);
  };

  const handleExtraPaymentChange = (amount: number) => {
    setExtraPayment(amount);
    refreshDebtPlan(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-3 mb-4">
          <View className="flex-row items-center">
            <Text className="text-xl font-sans-extrabold text-text-primary mr-2">
              Tu Coach & Detective
            </Text>
            <Sparkles size={18} color={palette.brandPrimary} />
          </View>
          <Text className="text-xs font-sans text-text-secondary mt-0.5">
            Estrategias inteligentes para blindar tu vida y pagar menos intereses.
          </Text>
        </View>

        {/* 1. Medidor de Tu Guaca (Fondo de Emergencia) */}
        <View className="mb-4">
          <EmergencyFundGauge
            emergencyFundBalance={coachSummary?.emergencyFundBalance || 0}
            vitalMinimum={coachSummary?.vitalMinimum || 0}
            onContributePress={() => router.push('/quick-record')}
            isPrivate={isPrivate}
          />
        </View>

        {/* 2. El Detective de tu Plata (Insights Locales 100% Gratis) */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Search size={18} color={palette.brandPrimary} />
            <Text className="ml-2 font-sans-bold text-base text-text-primary">
              El Detective de tu Plata
            </Text>
          </View>
          <Text className="text-xs font-sans text-text-secondary mb-3">
            Analiza tus gastos reales y te muestra cuántos días de paz ganas al optimizar fugas.
          </Text>

          {detectiveInsights.length === 0 ? (
            <EmptyState
              title="¡Todo en orden!"
              description="El detective no detectó fugas alarmantes en tus gastos de este mes. ¡Sigue así!"
            />
          ) : (
            <View className="space-y-3">
              {detectiveInsights.map((insight, idx) => (
                <View key={insight.id || idx}>
                  <InsightBanner
                    message={insight.nequiMessage}
                  />
                  {idx < detectiveInsights.length - 1 && <GuacaDivider className="my-1.5" />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. Tu Parcero Coach con IA */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Sparkles size={18} color={palette.brandPrimary} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary">
                Tu Parcero Coach con IA
              </Text>
            </View>
            <View className="bg-brandSoft/60 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-sans-bold text-brand">
                {hasGeminiKey ? 'Gemini Flash' : 'Modo Detective'}
              </Text>
            </View>
          </View>

          <Text className="text-xs font-sans text-text-secondary mb-3">
            Recibe consejos personalizados sin regaños. Si configuras tu clave gratis de Google Gemini, el análisis será aún más profundo.
          </Text>

          {aiCoachAdvice && (
            <View className="bg-bg-subtle/70 border border-border-subtle rounded-sm p-3 mb-3">
              <Text className="text-xs font-sans-medium text-text-primary leading-relaxed">
                {aiCoachAdvice.message}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-[10px] font-sans-bold text-text-muted mr-1.5">
                  Fuente:
                </Text>
                {aiCoachAdvice.source === 'gemini' ? (
                  <View className="flex-row items-center">
                    <Zap size={12} color={palette.brandPrimary} />
                    <Text className="text-[10px] font-sans-bold text-brand ml-1">
                      Google Gemini Flash
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <ShieldCheck size={12} color={palette.textSecondary} />
                    <Text className="text-[10px] font-sans-bold text-text-secondary ml-1">
                      Detective Local sin conexión
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <GuacaButton
            title={isAiLoading ? 'Analizando tu mes...' : 'Pedir consejo a mi Coach IA'}
            variant="primary"
            loading={isAiLoading}
            iconLeft={<Sparkles size={16} color="#FFFFFF" />}
            onPress={handleAskAI}
          />

          {!hasGeminiKey && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configurar clave gratis de Gemini"
              onPress={() => router.push('/settings')}
              className="flex-row items-center justify-between mt-3 pt-3 border-t border-border-subtle"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Key size={14} color={palette.brandPrimary} />
                <Text className="ml-2 text-xs font-sans-medium text-brand">
                  ¿Quieres análisis con IA de Google? Pega tu clave gratis aquí
                </Text>
              </View>
              <ChevronRight size={14} color={palette.brandPrimary} />
            </Pressable>
          )}
        </View>

        {/* 4. Planificador de Deudas (Victorias Rápidas vs Ahorra Más Intereses) */}
        {debts.length > 0 && (
          <View className="mb-4">
            <DebtPayoffPlanner
              debts={debts}
              strategy={debtStrategy}
              onStrategyChange={handleStrategyChange}
              extraMonthlyPayment={extraPayment}
              onExtraMonthlyPaymentChange={handleExtraPaymentChange}
              isPrivate={isPrivate}
            />
          </View>
        )}

        {/* 5. Simulador de Compras a Cuotas */}
        <View className="mb-4">
          <AffordabilitySimulator
            savingCapacity={coachSummary?.savingCapacity || 0}
            vitalMinimum={coachSummary?.vitalMinimum || 0}
          />
        </View>

        {/* 6. Enlace a Radiografía y Reportes Gráficos */}
        <View className="bg-brandSoft/40 border border-brand/20 rounded-md p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-sans-bold text-text-primary">
              Radiografía Gráfica Completa
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              Revisa tus donas de distribución, barras comparativas y la tendencia de tu ahorro.
            </Text>
          </View>
          <GuacaButton
            title="Ver reportes"
            variant="tonal"
            size="sm"
            iconLeft={<BarChart3 size={14} color={palette.brandPrimary} />}
            onPress={() => router.push('/reports')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
