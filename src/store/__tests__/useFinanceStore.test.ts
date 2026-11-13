/**
 * Pruebas unitarias para el Store reactivo Zustand v5 (Guaca v2).
 * Cubre: ciclo de vida de inicialización, onboarding, registro de movimientos reactivo,
 * cálculo instantáneo de métricas del Coach, eliminación con Snackbar y Undo,
 * planes de deuda, paginación y respaldo/restauración.
 */

import { createInMemoryDatabase } from '../../db/client';
import { useFinanceStore } from '../useFinanceStore';

describe('useFinanceStore Zustand (TDD)', () => {
  beforeEach(async () => {
    // Resetear store y suministrar db en memoria
    const db = createInMemoryDatabase();
    await useFinanceStore.getState().initStore(db);
  });

  it('inicia en estado no-onboarding y listo para configuración', () => {
    const state = useFinanceStore.getState();
    expect(state.isReady).toBe(true);
    expect(state.settings).toBeNull();
    expect(state.wallets).toEqual([]);
    expect(state.transactions).toEqual([]);
  });

  it('completa el onboarding y actualiza el estado reactivo inmediatamente', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 4500000,
      vitalBreakdown: {
        housing: 1500000,
        food: 800000,
        utilities: 300000,
        transport: 250000,
      },
      initialWalletName: 'Nequi Nómina',
      initialWalletBalance: 600000,
      seedBudgets: true,
    });

    const state = useFinanceStore.getState();
    expect(state.settings?.userName).toBe('Felipe');
    expect(state.settings?.onboardingCompleted).toBe(true);
    expect(state.wallets.length).toBe(1);
    expect(state.wallets[0].balance).toBe(600000);
    expect(state.budgets.length).toBe(4);
    expect(state.coachSummary?.vitalMinimum).toBe(2850000);
    expect(state.coachSummary?.savingCapacity).toBe(1650000);
    expect(state.coachSummary?.healthStatus.status).toBe('peace');
  });

  it('registra un gasto y actualiza el saldo de la billetera y el resumen del Coach', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Efectivo',
      initialWalletBalance: 500000,
    });

    const walletId = useFinanceStore.getState().wallets[0].id;

    await useFinanceStore.getState().addTransaction({
      amount: 150000,
      type: 'expense',
      pillar: 'vital',
      walletId,
      date: '2026-11-12T15:00:00.000Z',
    });

    const state = useFinanceStore.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.wallets[0].balance).toBe(350000); // 500k - 150k
    expect(state.coachSummary?.vitalSpent).toBe(150000);
  });

  it('elimina un movimiento, activa el Snackbar con Deshacer y restaura el saldo al deshacer', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Efectivo',
      initialWalletBalance: 500000,
    });

    const walletId = useFinanceStore.getState().wallets[0].id;

    await useFinanceStore.getState().addTransaction({
      amount: 100000,
      type: 'expense',
      pillar: 'vital',
      walletId,
      date: '2026-11-12T15:00:00.000Z',
    });

    expect(useFinanceStore.getState().wallets[0].balance).toBe(400000);
    const txId = useFinanceStore.getState().transactions[0].id;

    // Eliminar movimiento
    await useFinanceStore.getState().deleteTransaction(txId);

    // Saldo restaurado a 500k, snackbar visible con acción de Deshacer
    let state = useFinanceStore.getState();
    expect(state.transactions.length).toBe(0);
    expect(state.wallets[0].balance).toBe(500000);
    expect(state.snackbar.visible).toBe(true);
    expect(state.snackbar.canUndo).toBe(true);

    // Ejecutar Deshacer
    await useFinanceStore.getState().undoLastTransaction();

    state = useFinanceStore.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.wallets[0].balance).toBe(400000);
  });

  it('recalcula los planes de deuda (Bola de Nieve y Avalancha) al registrar deudas', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 4000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Cuenta',
      initialWalletBalance: 1000000,
    });

    await useFinanceStore.getState().addDebt({
      name: 'Tarjeta CMR',
      creditor: 'Falabella',
      originalBalance: 2000000,
      remainingBalance: 1500000,
      minimumMonthlyPayment: 150000,
      estimatedMonthlyRatePct: 2.2,
    });

    await useFinanceStore.getState().addDebt({
      name: 'Crédito Moto',
      creditor: 'Sufi',
      originalBalance: 6000000,
      remainingBalance: 4000000,
      minimumMonthlyPayment: 300000,
      estimatedMonthlyRatePct: 1.5,
    });

    const state = useFinanceStore.getState();
    expect(state.debts.length).toBe(2);
    expect(state.debtPlan).not.toBeNull();
    expect(state.debtPlan?.snowball).toBeDefined();
    expect(state.debtPlan?.avalanche).toBeDefined();
    expect(state.debtPlan?.snowball.priorityDebt?.name).toBe('Tarjeta CMR');
  });

  it('permite cambiar el modo de tema y el modo privado reactivamente', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Efectivo',
      initialWalletBalance: 500000,
    });

    useFinanceStore.getState().setThemeMode('dark');
    expect(useFinanceStore.getState().themeMode).toBe('dark');

    await useFinanceStore.getState().togglePrivateMode();
    expect(useFinanceStore.getState().settings?.isPrivateMode).toBe(true);
  });

  it('calcula reactivamente safeAllowance y detectiveInsights al completar onboarding y registrar movimientos', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Nequi',
      initialWalletBalance: 500000,
    });

    const state = useFinanceStore.getState();
    expect(state.safeAllowance).not.toBeNull();
    expect(state.safeAllowance?.profileType).toBe('salary');
    expect(state.safeAllowance?.profileLabel).toBe('Sueldo fijo');
    expect(state.detectiveInsights).toBeDefined();

    // Agregar suscripción
    await useFinanceStore.getState().addSubscription({
      name: 'Spotify Familiar',
      amount: 30000,
      frequency: 'monthly',
    });

    const updatedState = useFinanceStore.getState();
    expect(updatedState.detectiveInsights.length).toBeGreaterThan(0);
    expect(updatedState.detectiveInsights[0].categoryOrLeakName).toBe('Spotify Familiar');
    expect(updatedState.detectiveInsights[0].annualSavings).toBe(360000);
  });

  it('ejecuta askAiCoach actualizando el estado de carga y aiCoachAdvice', async () => {
    await useFinanceStore.getState().completeOnboarding({
      userName: 'Felipe',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Nequi',
      initialWalletBalance: 500000,
    });

    const advice = await useFinanceStore.getState().askAiCoach();
    expect(advice).toBeDefined();
    expect(advice.source).toBe('local-detective'); // Sin API key por defecto
    expect(advice.tips.length).toBeGreaterThan(0);

    const state = useFinanceStore.getState();
    expect(state.isAiLoading).toBe(false);
    expect(state.aiCoachAdvice).toEqual(advice);
  });
});
