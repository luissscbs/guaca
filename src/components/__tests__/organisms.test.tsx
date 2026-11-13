import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  MonthHealthPanel,
  EmergencyFundGauge,
  DebtPayoffPlanner,
  AffordabilitySimulator,
  LeakDetectorList,
  QuickRecordSheet,
  OnboardingWizard,
  BackupRestoreCard,
  DonutChart,
  ComparisonBarChart,
  TrendLineChart,
} from '../organisms';
import { Debt, SubscriptionLeak, Wallet } from '../../domain/types';

describe('Organisms: MonthHealthPanel', () => {
  it('renders guilt-free available amount with hero size and month health badge', () => {
    const { getByText, getByLabelText } = render(
      <MonthHealthPanel
        netIncome={4000000}
        vitalMinimum={2200000}
        debtObligations={600000}
        savingCapacity={1200000}
        guiltFreeAvailable={800000}
        status="peace"
        explanation="¡Estado de Paz! Tienes tranquilidad para gastar sin culpa."
      />
    );

    expect(getByText('Tu plata libre para gastar sin culpa')).toBeTruthy();
    expect(getByText('$ 800.000')).toBeTruthy();
    expect(getByLabelText(/Estado: Paz Financiera/i)).toBeTruthy();
    expect(
      getByText('¡Estado de Paz! Tienes tranquilidad para gastar sin culpa.')
    ).toBeTruthy();

    // Desglose plano
    expect(getByText('Ingreso neto')).toBeTruthy();
    expect(getByText('$ 4.000.000')).toBeTruthy();
    expect(getByText('Lo sagrado del mes (Mínimo Vital)')).toBeTruthy();
    expect(getByText('$ 2.200.000')).toBeTruthy();
    expect(getByText('Cuotas de deudas')).toBeTruthy();
    expect(getByText('$ 600.000')).toBeTruthy();
    expect(getByText('Capacidad de ahorro')).toBeTruthy();
    expect(getByText('$ 1.200.000')).toBeTruthy();
  });

  it('masks amounts with privacy symbol when isPrivate is true', () => {
    const { getAllByText, queryByText } = render(
      <MonthHealthPanel
        netIncome={4000000}
        vitalMinimum={2200000}
        debtObligations={600000}
        savingCapacity={1200000}
        guiltFreeAvailable={800000}
        status="alert"
        explanation="Margen ajustado."
        isPrivate={true}
      />
    );

    // Amounts should not be visible as plain numbers
    expect(queryByText('$ 800.000')).toBeNull();
    expect(queryByText('$ 4.000.000')).toBeNull();
    // Privacy mask should appear multiple times
    const masked = getAllByText('$ •••••••');
    expect(masked.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Organisms: EmergencyFundGauge', () => {
  it('renders months covered, days covered, milestones, and motivational explanation with tabular numbers', () => {
    const onContributeMock = jest.fn();
    const { getByText, getByRole } = render(
      <EmergencyFundGauge
        emergencyFundBalance={4400000}
        vitalMinimum={2000000}
        onContributePress={onContributeMock}
      />
    );

    // 4.400.000 / 2.000.000 = 2,2 meses
    const monthsText = getByText('2,2 meses');
    expect(monthsText).toBeTruthy();
    expect(monthsText.props.style).toMatchObject({ fontVariant: ['tabular-nums'] });
    expect(getByText(/66 días cubiertos/i)).toBeTruthy();

    expect(getByText('Tu Guaca')).toBeTruthy();
    expect(getByText(/¿cuántos meses te aguanta tu Guaca\?/i)).toBeTruthy();

    // Hitos de tranquilidad
    expect(getByText('1 mes')).toBeTruthy();
    expect(getByText('3 meses')).toBeTruthy();
    expect(getByText('6 meses')).toBeTruthy();

    // Botón para aportar
    const contributeBtn = getByRole('button', { name: /Aportar a mi Guaca/i });
    expect(contributeBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(contributeBtn);
    expect(onContributeMock).toHaveBeenCalledTimes(1);
  });

  it('handles zero vital minimum gracefully with guidance', () => {
    const { getByText } = render(
      <EmergencyFundGauge emergencyFundBalance={0} vitalMinimum={0} />
    );

    expect(
      getByText(/Configura primero tus 4 pilares del Mínimo Vital/i)
    ).toBeTruthy();
  });
});

describe('Organisms: DebtPayoffPlanner', () => {
  const dummyDebts: Debt[] = [
    {
      id: 'd1',
      name: 'Tarjeta CMR',
      creditor: 'Falabella',
      originalBalance: 2000000,
      remainingBalance: 800000,
      minimumMonthlyPayment: 120000,
      estimatedMonthlyRatePct: 2.2,
      isPaid: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'd2',
      name: 'Crédito Vehículo',
      creditor: 'Bancolombia',
      originalBalance: 15000000,
      remainingBalance: 9000000,
      minimumMonthlyPayment: 450000,
      estimatedMonthlyRatePct: 1.6,
      isPaid: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('toggles between snowball (Victorias Rápidas) and avalanche (Ahorra Más Intereses) without nested card borders', () => {
    const onStrategyChangeMock = jest.fn();
    const { getByRole, getByText, getByTestId } = render(
      <DebtPayoffPlanner
        debts={dummyDebts}
        strategy="snowball"
        onStrategyChange={onStrategyChangeMock}
        testID="debt-planner-root"
      />
    );

    // No nested card borders on root container
    const root = getByTestId('debt-planner-root');
    expect(root.props.className).toContain('gap-3');
    expect(root.props.className).not.toContain('border border-border-subtle rounded-md');

    expect(getByText('Victorias Rápidas')).toBeTruthy();
    expect(getByText('Ahorra Más Intereses')).toBeTruthy();

    const avalancheTab = getByRole('button', { name: /Ahorra Más Intereses/i });
    expect(avalancheTab.props.className).toContain('min-h-[48px]');
    fireEvent.press(avalancheTab);
    expect(onStrategyChangeMock).toHaveBeenCalledWith('avalanche');
  });

  it('adds extra payment via quick chips and calculates payoff time', () => {
    const onExtraPaymentChangeMock = jest.fn();
    const { getByText, getByRole } = render(
      <DebtPayoffPlanner
        debts={dummyDebts}
        extraMonthlyPayment={100000}
        onExtraMonthlyPaymentChange={onExtraPaymentChangeMock}
      />
    );

    // Chip de +$50.000
    const chip50k = getByRole('button', { name: /Sumar \$ 50\.000/i });
    expect(chip50k.props.className).toContain('min-h-[48px]');
    fireEvent.press(chip50k);
    expect(onExtraPaymentChangeMock).toHaveBeenCalledWith(150000);

    // Muestra meses para quedar libre
    expect(getByText(/Meses para ser libre/i)).toBeTruthy();
  });

  it('renders unpayable warning when minimum payment does not cover interest', () => {
    const unpayableDebts: Debt[] = [
      {
        id: 'u1',
        name: 'Deuda Usurera',
        creditor: 'Gota a Gota',
        originalBalance: 5000000,
        remainingBalance: 5000000,
        minimumMonthlyPayment: 50000, // 1%
        estimatedMonthlyRatePct: 10.0, // 10% interest per month ($500.000 due!)
        isPaid: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const { getByRole } = render(
      <DebtPayoffPlanner debts={unpayableDebts} extraMonthlyPayment={0} />
    );

    const alert = getByRole('alert');
    expect(alert).toBeTruthy();
  });
});

describe('Organisms: AffordabilitySimulator', () => {
  it('evaluates purchase in installments and displays verdict and quotas in plain COP', () => {
    const { getByText, getByPlaceholderText, getByRole } = render(
      <AffordabilitySimulator savingCapacity={600000} vitalMinimum={2000000} />
    );

    const priceInput = getByPlaceholderText('Monto total de la compra');
    fireEvent.changeText(priceInput, '300000');

    // 1 cuota chip
    const chip3 = getByRole('button', { name: '3 cuotas' });
    expect(chip3.props.className).toContain('min-h-[48px]');
    fireEvent.press(chip3);

    // 300.000 / 3 = 100.000 cuota mensual. Con 600.000 de ahorro, 100k deja 500k (>50% de 600k) -> Compra Segura
    expect(getByText('Compra Segura')).toBeTruthy();
    const quotaText = getByText('$ 100.000 / mes');
    expect(quotaText).toBeTruthy();
    expect(quotaText.props.style).toMatchObject({ fontVariant: ['tabular-nums'] });
  });

  it('detects danger when installment exceeds saving capacity', () => {
    const { getByText, getByPlaceholderText } = render(
      <AffordabilitySimulator savingCapacity={200000} vitalMinimum={2000000} />
    );

    const priceInput = getByPlaceholderText('Monto total de la compra');
    fireEvent.changeText(priceInput, '1200000'); // 1 cuota = 1.200.000 > 200.000 -> Peligro Mínimo Vital

    expect(getByText('Peligro Mínimo Vital')).toBeTruthy();
    expect(getByText(/supera tu capacidad de ahorro/i)).toBeTruthy();
  });
});

describe('Organisms: LeakDetectorList', () => {
  const dummyLeaks: SubscriptionLeak[] = [
    {
      id: 'l1',
      name: 'Netflix 4K',
      amount: 45000,
      frequency: 'monthly',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'l2',
      name: 'Spotify Familiar',
      amount: 28000,
      frequency: 'monthly',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('displays total monthly cost AND 12x annualized impact in plain COP without nested card borders', () => {
    const onToggleMock = jest.fn();
    const onAddMock = jest.fn();

    const { getByText, getByRole, getByTestId } = render(
      <LeakDetectorList
        subscriptions={dummyLeaks}
        onToggleActive={onToggleMock}
        onAddPress={onAddMock}
        testID="leak-list-root"
      />
    );

    // No nested card borders on root container
    const root = getByTestId('leak-list-root');
    expect(root.props.className).toContain('gap-3');
    expect(root.props.className).not.toContain('border border-border-subtle rounded-md');

    // Total mensual: 45.000 + 28.000 = 73.000
    expect(getByText('$ 73.000')).toBeTruthy();
    // Total anual 12x: 73.000 * 12 = 876.000
    expect(getByText(/Te cuesta \$ 876\.000 al año/i)).toBeTruthy();

    expect(getByText('Netflix 4K')).toBeTruthy();
    expect(getByText('Spotify Familiar')).toBeTruthy();

    const addBtn = getByRole('button', { name: /Agregar suscripción o fuga/i });
    expect(addBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(addBtn);
    expect(onAddMock).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no subscriptions exist', () => {
    const onAddMock = jest.fn();
    const { getByText } = render(
      <LeakDetectorList subscriptions={[]} onAddPress={onAddMock} />
    );

    expect(getByText('Sin suscripciones ni fugas')).toBeTruthy();
  });
});

describe('Organisms: QuickRecordSheet', () => {
  const dummyWallets: Wallet[] = [
    {
      id: 'w1',
      name: 'Bancolombia Ahorros',
      type: 'bank',
      balance: 1500000,
      isArchived: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'w2',
      name: 'Billetera Efectivo',
      type: 'cash',
      balance: 80000,
      isArchived: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('switches between expense, income, and transfer, adjusting UI accordingly', () => {
    const onSubmitMock = jest.fn();
    const { getByText, queryByText, getByRole } = render(
      <QuickRecordSheet
        wallets={dummyWallets}
        onSubmit={onSubmitMock}
        initialType="expense"
      />
    );

    // Expense shows pillars
    expect(getByText('Mínimo Vital')).toBeTruthy();
    expect(getByText('Ocio')).toBeTruthy();

    // Switch to transfer
    const transferBtn = getByRole('button', { name: 'Traslado' });
    fireEvent.press(transferBtn);

    // Transfer shows TransferAccountSelector and hides expense pillars
    expect(getByText('Cuenta de origen')).toBeTruthy();
    expect(getByText('Cuenta de destino')).toBeTruthy();
    expect(queryByText('Ocio')).toBeNull();
  });

  it('adds quick amount chip values to amount input and submits valid form', () => {
    const onSubmitMock = jest.fn();
    const { getByRole, getByPlaceholderText } = render(
      <QuickRecordSheet
        wallets={dummyWallets}
        onSubmit={onSubmitMock}
        initialType="expense"
      />
    );

    // Sumar +$50.000
    const chip50k = getByRole('button', { name: /Sumar \$ 50\.000/i });
    fireEvent.press(chip50k);

    const amountInput = getByPlaceholderText('0');
    expect(amountInput.props.value).toBe('50000');

    // Submit form
    const submitBtn = getByRole('button', { name: 'Registrar movimiento' });
    expect(submitBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50000,
        type: 'expense',
        walletId: 'w1',
      })
    );
  });
});

describe('Organisms: OnboardingWizard', () => {
  it('guides through 3 steps, calculates real-time vital minimum, and completes onboarding', () => {
    const onCompleteMock = jest.fn();
    const { getByText, getByPlaceholderText, getByRole } = render(
      <OnboardingWizard onComplete={onCompleteMock} />
    );

    // Paso 1: Bienvenida y cuenta inicial
    expect(getByText('Paso 1 de 3')).toBeTruthy();
    const nameInput = getByPlaceholderText('Tu nombre o apodo');
    fireEvent.changeText(nameInput, 'Carlos');

    const walletNameInput = getByPlaceholderText('Nombre de tu cuenta principal');
    fireEvent.changeText(walletNameInput, 'Bancolombia');

    const walletBalanceInput = getByPlaceholderText('Saldo inicial');
    fireEvent.changeText(walletBalanceInput, '1500000');

    const nextBtnStep1 = getByRole('button', { name: 'Siguiente' });
    fireEvent.press(nextBtnStep1);

    // Paso 2: Ingresos netos
    expect(getByText('Paso 2 de 3')).toBeTruthy();
    const incomeInput = getByPlaceholderText('Ingreso neto al mes');
    fireEvent.changeText(incomeInput, '3500000');

    const dayInput = getByPlaceholderText('Día de pago (1 al 28)');
    fireEvent.changeText(dayInput, '15');

    const nextBtnStep2 = getByRole('button', { name: 'Siguiente' });
    fireEvent.press(nextBtnStep2);

    // Paso 3: Mínimo Vital en 4 casillas obligatorias
    expect(getByText('Paso 3 de 3')).toBeTruthy();
    expect(getByText('Vivienda')).toBeTruthy();
    expect(getByText('Mercado')).toBeTruthy();
    expect(getByText('Servicios')).toBeTruthy();
    expect(getByText('Transporte')).toBeTruthy();

    const housingInput = getByPlaceholderText('Vivienda');
    fireEvent.changeText(housingInput, '1200000');

    const foodInput = getByPlaceholderText('Mercado');
    fireEvent.changeText(foodInput, '600000');

    const utilitiesInput = getByPlaceholderText('Servicios');
    fireEvent.changeText(utilitiesInput, '300000');

    const transportInput = getByPlaceholderText('Transporte');
    fireEvent.changeText(transportInput, '150000');

    // Suma en vivo: 1.200.000 + 600.000 + 300.000 + 150.000 = 2.250.000
    expect(getByText('$ 2.250.000')).toBeTruthy();

    const finishBtn = getByRole('button', { name: 'Activar mi Guaca' });
    expect(finishBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(finishBtn);

    expect(onCompleteMock).toHaveBeenCalledWith({
      userName: 'Carlos',
      currency: 'COP',
      initialWalletName: 'Bancolombia',
      initialWalletBalance: 1500000,
      netMonthlyIncome: 3500000,
      monthStartDay: 15,
      vitalBreakdown: {
        housing: 1200000,
        food: 600000,
        utilities: 300000,
        transport: 150000,
      },
    });
  });
});

describe('Organisms: BackupRestoreCard', () => {
  it('triggers export and requires explicit confirmation before restoring data', async () => {
    const onExportMock = jest.fn().mockResolvedValue(true);
    const onRestoreMock = jest.fn().mockResolvedValue(true);

    const { getByRole, getByText } = render(
      <BackupRestoreCard
        lastBackupDate="10 Nov 2026"
        onExportBackup={onExportMock}
        onRestoreBackup={onRestoreMock}
      />
    );

    expect(getByText(/Último respaldo: 10 Nov 2026/i)).toBeTruthy();

    // Exportar
    const exportBtn = getByRole('button', { name: /Exportar copia de seguridad/i });
    expect(exportBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(exportBtn);
    await waitFor(() => {
      expect(onExportMock).toHaveBeenCalledTimes(1);
    });

    // Restaurar inicial (abre diálogo de confirmación)
    const restoreBtn = getByRole('button', { name: /Restaurar desde archivo/i });
    expect(restoreBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(restoreBtn);

    // Diálogo de confirmación debe aparecer
    expect(
      getByText(/Se reemplazarán los datos actuales con la copia de seguridad/i)
    ).toBeTruthy();

    // Confirmar
    const confirmBtn = getByRole('button', { name: 'Sí, restaurar datos' });
    fireEvent.press(confirmBtn);
    await waitFor(() => {
      expect(onRestoreMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Organisms: SVG Charts', () => {
  it('renders DonutChart with pillar slices, center total, and handles private mode', () => {
    const { getByText, getAllByText, rerender } = render(
      <DonutChart
        vital={2000000}
        growth={800000}
        leisure={500000}
        debt={400000}
        isPrivate={false}
      />
    );

    // Total: 3.700.000
    expect(getByText('$ 3.700.000')).toBeTruthy();
    expect(getByText('Mínimo Vital')).toBeTruthy();
    expect(getByText('Ahorro')).toBeTruthy();

    // Modo privado enmascara total y cifras
    rerender(
      <DonutChart
        vital={2000000}
        growth={800000}
        leisure={500000}
        debt={400000}
        isPrivate={true}
      />
    );
    const masked = getAllByText('$ •••••••');
    expect(masked.length).toBeGreaterThanOrEqual(1);
  });

  it('renders ComparisonBarChart with comparative bars and labels', () => {
    const { getByText } = render(
      <ComparisonBarChart
        netIncome={4000000}
        vitalMinimum={2000000}
        debtObligations={600000}
        guiltFreeAvailable={1400000}
      />
    );

    expect(getByText('Ingreso Neto')).toBeTruthy();
    expect(getByText('$ 4.000.000')).toBeTruthy();
    expect(getByText('Mínimo Vital')).toBeTruthy();
    expect(getByText('$ 2.000.000')).toBeTruthy();
  });

  it('renders TrendLineChart with data points and handles empty states', () => {
    const data = [
      { month: 'Ene', amount: 400000 },
      { month: 'Feb', amount: 550000 },
      { month: 'Mar', amount: 700000 },
    ];

    const { getByText, rerender } = render(
      <TrendLineChart data={data} title="Evolución de Ahorro" />
    );

    expect(getByText('Evolución de Ahorro')).toBeTruthy();
    expect(getByText('Ene')).toBeTruthy();
    expect(getByText('Mar')).toBeTruthy();

    // Menos de 2 puntos muestra estado vacío didáctico
    rerender(<TrendLineChart data={[{ month: 'Ene', amount: 400000 }]} />);
    expect(
      getByText(/Registra al menos 2 meses para ver tu tendencia/i)
    ).toBeTruthy();
  });
});
