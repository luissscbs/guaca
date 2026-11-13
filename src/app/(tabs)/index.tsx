import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Eye, EyeOff, Settings, ShieldCheck, ArrowRight, Compass } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PALETTE } from '../../constants/theme';
import { MonthHealthPanel } from '../../components/organisms/MonthHealthPanel';
import { EmergencyFundGauge } from '../../components/organisms/EmergencyFundGauge';
import { InsightBanner } from '../../components/molecules/InsightBanner';
import { TransactionItem } from '../../components/molecules/TransactionItem';
import { EmptyState } from '../../components/molecules/EmptyState';
import { GuacaDivider } from '../../components/atoms/GuacaDivider';
import { MoneyText } from '../../components/atoms/MoneyText';
import { IconButton } from '../../components/atoms/IconButton';

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const settings = useFinanceStore((state) => state.settings);
  const coachSummary = useFinanceStore((state) => state.coachSummary);
  const safeAllowance = useFinanceStore((state) => state.safeAllowance);
  const detectiveInsights = useFinanceStore((state) => state.detectiveInsights);
  const transactions = useFinanceStore((state) => state.transactions);
  const wallets = useFinanceStore((state) => state.wallets);
  const togglePrivateMode = useFinanceStore((state) => state.togglePrivateMode);

  const isPrivate = !!settings?.isPrivateMode;
  const userName = settings?.userName || 'Parcero';

  // Últimos 5 movimientos
  const recentTransactions = transactions.slice(0, 5);

  const getWalletName = (walletId: string) => {
    const w = wallets.find((item) => item.id === walletId);
    return w ? w.name : 'Mi Cuenta';
  };

  const topInsight = detectiveInsights[0];

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera: Saludo + Controles */}
        <View className="flex-row items-center justify-between mt-3 mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-xl font-sans-extrabold text-text-primary" numberOfLines={1}>
              ¡Hola, {userName}! 👋
            </Text>
            <Text className="text-xs font-sans text-text-secondary mt-0.5">
              Lo tuyo intocable, lo demás bajo control.
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconButton
              icon={isPrivate ? <EyeOff size={20} color={palette.brandPrimary} /> : <Eye size={20} color={palette.brandPrimary} />}
              accessibilityLabel={isPrivate ? 'Mostrar cifras' : 'Ocultar cifras'}
              onPress={togglePrivateMode}
            />
            <IconButton
              icon={<Settings size={20} color={palette.textSecondary} />}
              accessibilityLabel="Ajustes y Mínimo Vital"
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        {/* 1. Semáforo del Mes (MonthHealthPanel) */}
        <View className="mb-4">
          <MonthHealthPanel
            netIncome={coachSummary?.totalIncome || settings?.netMonthlyIncome || 0}
            vitalMinimum={coachSummary?.vitalMinimum || 0}
            debtObligations={coachSummary?.activeDebtsMinPayment || 0}
            savingCapacity={coachSummary?.savingCapacity || 0}
            guiltFreeAvailable={coachSummary?.guiltFreeAvailable || 0}
            status={coachSummary?.healthStatus?.status || 'peace'}
            explanation={coachSummary?.healthStatus?.explanation || 'Aquí verás el balance de tu mes.'}
            isPrivate={isPrivate}
          />
        </View>

        {/* 2. Tarjeta Dedicada de Tope Seguro (Safe Allowance) */}
        {safeAllowance && (
          <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <Compass size={18} color={palette.brandPrimary} />
                <Text className="ml-2 font-sans-bold text-sm text-text-primary">
                  Tope Seguro para Gastar
                </Text>
              </View>
              <Text className="text-[11px] font-sans-semibold text-brand bg-brandSoft/60 px-2 py-0.5 rounded-full">
                {safeAllowance.profileLabel}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-bg-subtle/50 border border-border-subtle/60 rounded-sm p-3">
                <Text className="text-[11px] font-sans text-text-muted mb-1">
                  Para gastar hoy sin descuadrarte
                </Text>
                <MoneyText
                  amount={safeAllowance.dailyAllowance}
                  variant="row"
                  tone="growth"
                  isPrivate={isPrivate}
                />
              </View>

              <View className="flex-1 bg-bg-subtle/50 border border-border-subtle/60 rounded-sm p-3">
                <Text className="text-[11px] font-sans text-text-muted mb-1">
                  Para tu semana
                </Text>
                <MoneyText
                  amount={safeAllowance.weeklyAllowance}
                  variant="row"
                  tone="growth"
                  isPrivate={isPrivate}
                />
              </View>
            </View>

            <Text className="text-[11px] font-sans text-text-secondary mt-2.5">
              Quedan {safeAllowance.daysRemaining} días en el ciclo. ¡Gasta tranquilo lo que es tuyo!
            </Text>
          </View>
        )}

        {/* 3. Tu Guaca (Colchón de Tranquilidad) */}
        <View className="mb-4">
          <EmergencyFundGauge
            emergencyFundBalance={coachSummary?.emergencyFundBalance || 0}
            vitalMinimum={coachSummary?.vitalMinimum || 0}
            onContributePress={() => router.push('/(tabs)/coach')}
            isPrivate={isPrivate}
          />
        </View>

        {/* 4. Banner del Detective de tu Plata */}
        {topInsight && (
          <View className="mb-4">
            <InsightBanner
              message={topInsight.nequiMessage}
              actionTitle="Ver análisis completo"
              onActionPress={() => router.push('/(tabs)/coach')}
            />
          </View>
        )}

        {/* 5. Últimos Movimientos */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-sans-bold text-base text-text-primary">
              Últimos movimientos
            </Text>
            {transactions.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver todos los movimientos"
                onPress={() => router.push('/(tabs)/movements')}
                className="flex-row items-center"
              >
                <Text className="text-xs font-sans-bold text-brand mr-1">
                  Ver todos
                </Text>
                <ArrowRight size={14} color={palette.brandPrimary} />
              </Pressable>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <EmptyState
              title="Por aquí todavía no se ha movido ni una moneda..."
              description="Cuando hagas una compra, recibas tu plata o muevas entre cuentas, anótalo en 2 toques con el botón (+)."
            />
          ) : (
            <View>
              {recentTransactions.map((tx, idx) => (
                <View key={tx.id}>
                  <TransactionItem
                    id={tx.id}
                    title={tx.note || tx.categoryId || 'Movimiento'}
                    accountName={getWalletName(tx.walletId)}
                    date={tx.date}
                    amount={tx.amount}
                    type={tx.type}
                    pillar={tx.pillar}
                    isPrivate={isPrivate}
                  />
                  {idx < recentTransactions.length - 1 && <GuacaDivider className="my-1" />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
