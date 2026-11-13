import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Shield, PieChart, Zap, Target, Plus, X, ArrowRight } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PALETTE } from '../../constants/theme';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { parseCOPInput } from '../../utils/formatters';
import { BudgetCategoryCard } from '../../components/molecules/BudgetCategoryCard';
import { LeakDetectorList } from '../../components/organisms/LeakDetectorList';
import { SavingsGoalCard } from '../../components/molecules/SavingsGoalCard';
import { EmptyState } from '../../components/molecules/EmptyState';
import { MoneyText } from '../../components/atoms/MoneyText';
import { GuacaDivider } from '../../components/atoms/GuacaDivider';
import { GuacaButton } from '../../components/atoms/GuacaButton';
import { GuacaInput } from '../../components/atoms/GuacaInput';

export default function BudgetsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const settings = useFinanceStore((state) => state.settings);
  const budgets = useFinanceStore((state) => state.budgets);
  const subscriptions = useFinanceStore((state) => state.subscriptions);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);

  const setBudget = useFinanceStore((state) => state.setBudget);
  const deleteBudget = useFinanceStore((state) => state.deleteBudget);
  const addSubscription = useFinanceStore((state) => state.addSubscription);
  const updateSubscription = useFinanceStore((state) => state.updateSubscription);
  const deleteSubscription = useFinanceStore((state) => state.deleteSubscription);
  const addSavingsGoal = useFinanceStore((state) => state.addSavingsGoal);
  const contributeSavingsGoal = useFinanceStore((state) => state.contributeSavingsGoal);
  const deleteSavingsGoal = useFinanceStore((state) => state.deleteSavingsGoal);

  const isPrivate = !!settings?.isPrivateMode;
  const vital = settings?.vitalMinimumBreakdown || {
    housing: 0,
    food: 0,
    utilities: 0,
    transport: 0,
  };
  const totalVital = vital.housing + vital.food + vital.utilities + vital.transport;

  // Modales
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[1].id);
  const [budgetLimit, setBudgetLimit] = useState('');

  const [showLeakModal, setShowLeakModal] = useState(false);
  const [leakName, setLeakName] = useState('');
  const [leakAmount, setLeakAmount] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [showContributeModal, setShowContributeModal] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const handleSaveBudget = async () => {
    const limit = parseCOPInput(budgetLimit);
    if (limit <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa ingresa un tope mensual mayor a $ 0.');
      return;
    }
    try {
      await setBudget({
        categoryId: selectedCategory,
        monthlyLimit: limit,
      });
      setBudgetLimit('');
      setShowBudgetModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos guardar el tope.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleSaveLeak = async () => {
    const amount = parseCOPInput(leakAmount);
    if (!leakName.trim() || amount <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa escribe el nombre del servicio y el costo mensual mayor a $ 0.');
      return;
    }
    try {
      await addSubscription({
        name: leakName.trim(),
        amount,
        frequency: 'monthly',
      });
      setLeakName('');
      setLeakAmount('');
      setShowLeakModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos registrar la suscripción.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleSaveGoal = async () => {
    const target = parseCOPInput(goalTarget);
    if (!goalName.trim() || target <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa ingresa el nombre de tu meta y un monto mayor a $ 0.');
      return;
    }
    try {
      await addSavingsGoal({
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: 0,
      });
      setGoalName('');
      setGoalTarget('');
      setShowGoalModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos crear tu meta.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const handleContributeGoal = async () => {
    const amount = parseCOPInput(contributeAmount);
    if (!activeGoalId || amount <= 0) {
      Alert.alert('¡Ey, un detallito!', 'Porfa ingresa un valor mayor a $ 0 para sumar a tu meta.');
      return;
    }
    try {
      await contributeSavingsGoal(activeGoalId, amount);
      setContributeAmount('');
      setActiveGoalId(null);
      setShowContributeModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos sumar a tu meta.';
      Alert.alert('¡Ey, un detallito!', msg);
    }
  };

  const confirmDeleteBudget = (id: string, name: string) => {
    Alert.alert('¿Eliminar tope?', `Se eliminará el tope para ${name}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteBudget(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-3 mb-4">
          <Text className="text-xl font-sans-extrabold text-text-primary">
            Presupuesto, Fugas y Metas
          </Text>
          <Text className="text-xs font-sans text-text-secondary mt-0.5">
            Ponle límites a tus gastos y dale rumbo a tus ahorros.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* 1. LO SAGRADO DEL MES (MÍNIMO VITAL) */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Shield size={18} color={palette.financeVital} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary">
                Lo sagrado del mes
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustar lo sagrado"
              onPress={() => router.push('/settings')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-sans-bold text-brand mr-1">
                Ajustar
              </Text>
              <ArrowRight size={14} color={palette.brandPrimary} />
            </Pressable>
          </View>
          <Text className="text-xs font-sans text-text-secondary mb-3">
            El escudo protector de tu vida: techo, comida, servicios y transporte.
          </Text>

          <View className="bg-finance-vitalSoft/40 border border-finance-vital/20 rounded-sm p-3 mb-3">
            <Text className="text-xs font-sans-medium text-finance-vital">
              Total Mínimo Vital Intocable
            </Text>
            <View className="mt-1">
              <MoneyText amount={totalVital} variant="hero" tone="vital" isPrivate={isPrivate} />
            </View>
          </View>

          <View className="grid grid-cols-2 gap-2">
            <View className="bg-bg-subtle/50 p-2.5 rounded-sm">
              <Text className="text-[11px] font-sans text-text-muted">Vivienda</Text>
              <MoneyText amount={vital.housing} variant="row" isPrivate={isPrivate} />
            </View>
            <View className="bg-bg-subtle/50 p-2.5 rounded-sm">
              <Text className="text-[11px] font-sans text-text-muted">Mercado</Text>
              <MoneyText amount={vital.food} variant="row" isPrivate={isPrivate} />
            </View>
            <View className="bg-bg-subtle/50 p-2.5 rounded-sm">
              <Text className="text-[11px] font-sans text-text-muted">Servicios</Text>
              <MoneyText amount={vital.utilities} variant="row" isPrivate={isPrivate} />
            </View>
            <View className="bg-bg-subtle/50 p-2.5 rounded-sm">
              <Text className="text-[11px] font-sans text-text-muted">Transporte</Text>
              <MoneyText amount={vital.transport} variant="row" isPrivate={isPrivate} />
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. PRESUPUESTOS POR CATEGORÍA */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <PieChart size={18} color={palette.brandPrimary} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary">
                Topes por Categoría
              </Text>
            </View>
            <GuacaButton
              title="Definir tope"
              variant="tonal"
              size="sm"
              iconLeft={<Plus size={14} color={palette.brandPrimary} />}
              onPress={() => setShowBudgetModal(true)}
            />
          </View>

          {budgets.length === 0 ? (
            <EmptyState
              title="Sin topes definidos"
              description="Establece límites en compras, salidas o comidas para no descuadrarte."
            />
          ) : (
            <View className="space-y-3">
              {budgets.map((b, idx) => (
                <Pressable
                  key={b.id}
                  onLongPress={() => confirmDeleteBudget(b.id, b.categoryId)}
                >
                  <BudgetCategoryCard
                    categoryName={b.categoryId}
                    monthlyLimit={b.monthlyLimit}
                    spentThisMonth={b.spentThisMonth}
                    isPrivate={isPrivate}
                  />
                  {idx < budgets.length - 1 && <GuacaDivider className="my-1.5" />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* 3. GASTOS QUE PELLIZCAN (LEAK DETECTOR) */}
        {/* ============================================================ */}
        <View className="mb-4">
          <LeakDetectorList
            subscriptions={subscriptions}
            onToggleActive={(sub) => {
              updateSubscription(sub.id, { isActive: !sub.isActive });
            }}
            onAddPress={() => setShowLeakModal(true)}
          />
        </View>

        {/* ============================================================ */}
        {/* 4. METAS DE AHORRO Y MI GUACA */}
        {/* ============================================================ */}
        <View className="bg-bg-surface border border-border-subtle rounded-md p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Target size={18} color={palette.financeGrowth} />
              <Text className="ml-2 font-sans-bold text-base text-text-primary">
                Metas de Ahorro
              </Text>
            </View>
            <GuacaButton
              title="Nueva meta"
              variant="tonal"
              size="sm"
              iconLeft={<Plus size={14} color={palette.brandPrimary} />}
              onPress={() => setShowGoalModal(true)}
            />
          </View>

          {savingsGoals.length === 0 ? (
            <EmptyState
              title="Sin metas activas"
              description="Añade tu próximo viaje, curso o sueño para impulsarlo con tu plata libre."
            />
          ) : (
            <View className="space-y-3">
              {savingsGoals.map((g, idx) => (
                <View key={g.id}>
                  <SavingsGoalCard
                    name={g.name}
                    targetAmount={g.targetAmount}
                    currentAmount={g.currentAmount}
                    isPrivate={isPrivate}
                    onContributePress={() => {
                      setActiveGoalId(g.id);
                      setShowContributeModal(true);
                    }}
                  />
                  {idx < savingsGoals.length - 1 && <GuacaDivider className="my-1.5" />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal: Definir Presupuesto */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Definir Tope Mensual
              </Text>
              <Pressable onPress={() => setShowBudgetModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>

            <Text className="text-xs font-sans-bold text-text-primary mb-2">
              Categoría
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
              {DEFAULT_CATEGORIES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full border mr-2 ${
                    selectedCategory === c.id
                      ? 'bg-brandSoft/70 border-brand'
                      : 'bg-bg-subtle border-border-subtle'
                  }`}
                >
                  <Text className="text-xs font-sans-medium text-text-primary">
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <GuacaInput
              label="Tope mensual máximo"
              placeholder="Ej: 500000"
              prefix="$"
              isNumericCOP
              value={budgetLimit}
              onChangeText={setBudgetLimit}
              containerClassName="mb-4"
            />

            <GuacaButton title="Fijar tope" variant="primary" onPress={handleSaveBudget} />
          </View>
        </View>
      </Modal>

      {/* Modal: Agregar Fuga / Suscripción */}
      <Modal visible={showLeakModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Nueva Suscripción o Fuga
              </Text>
              <Pressable onPress={() => setShowLeakModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="Nombre del servicio o gasto recurrente"
              placeholder="Ej: Netflix, Gimnasio, Café diario"
              value={leakName}
              onChangeText={setLeakName}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Costo mensual"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={leakAmount}
              onChangeText={setLeakAmount}
              helperText="Guaca multiplicará este valor x12 para mostrarte el impacto anual."
              containerClassName="mb-4"
            />
            <GuacaButton title="Anotar gasto recurrente" variant="primary" onPress={handleSaveLeak} />
          </View>
        </View>
      </Modal>

      {/* Modal: Nueva Meta de Ahorro */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Nueva Meta de Ahorro
              </Text>
              <Pressable onPress={() => setShowGoalModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="Nombre de tu sueño o meta"
              placeholder="Ej: Moto, Viaje fin de año, Diplomado"
              value={goalName}
              onChangeText={setGoalName}
              containerClassName="mb-3"
            />
            <GuacaInput
              label="Monto objetivo total"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={goalTarget}
              onChangeText={setGoalTarget}
              containerClassName="mb-4"
            />
            <GuacaButton title="Crear meta" variant="primary" onPress={handleSaveGoal} />
          </View>
        </View>
      </Modal>

      {/* Modal: Aportar a Meta */}
      <Modal visible={showContributeModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-bg-surface p-4 rounded-t-lg border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-bold text-lg text-text-primary">
                Meter Plata a tu Meta
              </Text>
              <Pressable onPress={() => setShowContributeModal(false)}>
                <X size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <GuacaInput
              label="¿Cuánto quieres meter hoy?"
              placeholder="0"
              prefix="$"
              isNumericCOP
              value={contributeAmount}
              onChangeText={setContributeAmount}
              helperText="¡Cada peso te acerca más a tu objetivo!"
              containerClassName="mb-4"
            />
            <GuacaButton title="Sumar a mi meta" variant="primary" onPress={handleContributeGoal} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
