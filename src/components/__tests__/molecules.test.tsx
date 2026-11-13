import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  MoneyStatCard,
  WalletCard,
  CreditCardItem,
  DebtItemCard,
  TransactionItem,
  BudgetCategoryCard,
  SubscriptionLeakItem,
  SavingsGoalCard,
  InsightBanner,
  TransferAccountSelector,
  VitalPillarRow,
  GuacaSnackbar,
  EmptyState,
  SelectFieldTrigger,
} from '../molecules';
import { Wallet, CreditCard, Debt } from '../../domain/types';

describe('Molecules: MoneyStatCard', () => {
  it('renders title, amount with tabular numbers, and badge', () => {
    const { getByText } = render(
      <MoneyStatCard
        title="Capacidad de Ahorro"
        amount={450000}
        badgeStatus="peace"
        badgeLabel="Holgado"
        subtitle="Disponible para gastar sin culpa"
      />
    );
    expect(getByText('Capacidad de Ahorro')).toBeTruthy();
    expect(getByText('$ 450.000')).toBeTruthy();
    expect(getByText('Holgado')).toBeTruthy();
    expect(getByText('Disponible para gastar sin culpa')).toBeTruthy();
  });

  it('respects private mode mask', () => {
    const { getByText } = render(
      <MoneyStatCard title="Total Cuentas" amount={12500000} isPrivate />
    );
    expect(getByText('$ •••••••')).toBeTruthy();
  });
});

describe('Molecules: WalletCard', () => {
  const dummyWallet: Wallet = {
    id: 'w1',
    name: 'Bancolombia Ahorros',
    type: 'bank',
    balance: 2300000,
    isArchived: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders bank wallet with balance and action buttons >= 48dp', () => {
    const onEditMock = jest.fn();
    const onArchiveMock = jest.fn();
    const { getByText, getByLabelText } = render(
      <WalletCard wallet={dummyWallet} onEdit={onEditMock} onArchive={onArchiveMock} />
    );

    expect(getByText('Bancolombia Ahorros')).toBeTruthy();
    expect(getByText('$ 2.300.000')).toBeTruthy();
    expect(getByText('Cuenta Bancaria')).toBeTruthy();

    const editBtn = getByLabelText('Editar Bancolombia Ahorros');
    expect(editBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(editBtn);
    expect(onEditMock).toHaveBeenCalledTimes(1);

    const archiveBtn = getByLabelText('Archivar Bancolombia Ahorros');
    expect(archiveBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(archiveBtn);
    expect(onArchiveMock).toHaveBeenCalledTimes(1);
  });

  it('renders vault protection badge when wallet type is vault', () => {
    const vaultWallet: Wallet = {
      ...dummyWallet,
      id: 'v1',
      name: 'Bóveda Intocable',
      type: 'vault',
    };
    const { getAllByText } = render(
      <WalletCard wallet={vaultWallet} onEdit={() => {}} />
    );
    expect(getAllByText('Tu Guaca').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Molecules: CreditCardItem', () => {
  const dummyCard: CreditCard = {
    id: 'cc1',
    name: 'Visa Clásica',
    creditLimit: 5000000,
    currentBalance: 1500000,
    cutoffDay: 15,
    dueDay: 5,
    monthlyRatePct: 2.1,
    isArchived: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders used and available balance, dates in plain language, and pay button >= 48dp', () => {
    const onPayMock = jest.fn();
    const { getByText, getByRole } = render(
      <CreditCardItem card={dummyCard} onPayPress={onPayMock} />
    );

    expect(getByText('Visa Clásica')).toBeTruthy();
    expect(getByText('$ 1.500.000')).toBeTruthy(); // Usado
    expect(getByText('$ 3.500.000')).toBeTruthy(); // Disponible
    expect(getByText(/Corta el día 15 • Paga hasta el día 5/i)).toBeTruthy();

    const payBtn = getByRole('button', { name: 'Registrar pago' });
    expect(payBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(payBtn);
    expect(onPayMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: DebtItemCard', () => {
  const dummyDebt: Debt = {
    id: 'd1',
    name: 'Crédito Libre Inversión',
    creditor: 'Banco de Bogotá',
    originalBalance: 10000000,
    remainingBalance: 4200000,
    minimumMonthlyPayment: 280000,
    estimatedMonthlyRatePct: 2.1,
    isPaid: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders remaining balance, minimum payment, and real interest in COP per $100.000', () => {
    const onPayMock = jest.fn();
    const { getByText, queryByText } = render(
      <DebtItemCard
        debt={dummyDebt}
        onPayPress={onPayMock}
        priorityLabel="Prioridad #1 Avalancha"
      />
    );

    expect(getByText('Crédito Libre Inversión')).toBeTruthy();
    expect(getByText('$ 4.200.000')).toBeTruthy();
    expect(getByText('$ 280.000')).toBeTruthy();

    // PROHIBIDO mostrar "E.A."! Must show cost per $100.000
    expect(queryByText(/E\.A\./i)).toBeNull();
    expect(getByText(/por cada \$ 100\.000/i)).toBeTruthy();
    expect(getByText('$ 2.100 por cada $ 100.000')).toBeTruthy();

    // Priority badge
    expect(getByText('Prioridad #1 Avalancha')).toBeTruthy();

    // Pay button
    const payBtn = getByText('Abonar');
    expect(payBtn).toBeTruthy();
  });
});

describe('Molecules: TransactionItem', () => {
  it('renders flat row without nested cards, correct sign, and >= 48dp action buttons', () => {
    const onEditMock = jest.fn();
    const onDeleteMock = jest.fn();

    const { getByText, getByLabelText } = render(
      <TransactionItem
        id="tx1"
        title="Mercado Éxito"
        accountName="Bancolombia"
        date="12 Nov 2026"
        amount={185000}
        type="expense"
        pillar="vital"
        onEdit={onEditMock}
        onDelete={onDeleteMock}
      />
    );

    expect(getByText('Mercado Éxito')).toBeTruthy();
    expect(getByText('Bancolombia • 12 Nov 2026')).toBeTruthy();
    expect(getByText('- $ 185.000')).toBeTruthy();

    const editBtn = getByLabelText('Editar movimiento Mercado Éxito');
    expect(editBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(editBtn);
    expect(onEditMock).toHaveBeenCalledTimes(1);

    const deleteBtn = getByLabelText('Eliminar movimiento Mercado Éxito');
    expect(deleteBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(deleteBtn);
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: BudgetCategoryCard', () => {
  it('renders limit, spent, semantic progress, and remaining amount', () => {
    const { getByText } = render(
      <BudgetCategoryCard
        categoryName="Restaurantes"
        monthlyLimit={400000}
        spentThisMonth={250000}
      />
    );

    expect(getByText('Restaurantes')).toBeTruthy();
    expect(getByText('$ 400.000')).toBeTruthy(); // Límite
    expect(getByText('$ 250.000')).toBeTruthy(); // Gastado
    expect(getByText(/Te quedan \$ 150\.000/i)).toBeTruthy();
  });

  it('renders warning or danger alert when budget is exceeded', () => {
    const { getByText } = render(
      <BudgetCategoryCard
        categoryName="Salidas"
        monthlyLimit={200000}
        spentThisMonth={240000}
      />
    );
    expect(getByText(/Te pasaste por \$ 40\.000/i)).toBeTruthy();
  });
});

describe('Molecules: SubscriptionLeakItem', () => {
  it('renders subscription monthly cost AND annualized 12x impact in plain pesos', () => {
    const onToggleMock = jest.fn();
    const { getByText, getByRole } = render(
      <SubscriptionLeakItem
        name="Plataforma de Series"
        amount={35000}
        frequency="monthly"
        isActive={true}
        onToggleActive={onToggleMock}
      />
    );

    expect(getByText('Plataforma de Series')).toBeTruthy();
    expect(getByText('$ 35.000 / mes')).toBeTruthy();
    // 12x annualized calculation: 35000 * 12 = 420000
    expect(getByText(/Te cuesta \$ 420\.000 al año/i)).toBeTruthy();

    const toggleBtn = getByRole('button', { name: /Pausar/i });
    expect(toggleBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(toggleBtn);
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: SavingsGoalCard', () => {
  it('renders goal name, target, current amount, and contribute button >= 48dp', () => {
    const onContributeMock = jest.fn();
    const { getByText, getByRole } = render(
      <SavingsGoalCard
        name="Vacaciones Cartagena"
        targetAmount={3000000}
        currentAmount={1500000}
        onContributePress={onContributeMock}
      />
    );

    expect(getByText('Vacaciones Cartagena')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(getByText(/Faltan \$ 1\.500\.000/i)).toBeTruthy();

    const contributeBtn = getByRole('button', { name: 'Aportar a meta' });
    expect(contributeBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(contributeBtn);
    expect(onContributeMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: InsightBanner', () => {
  it('renders empathetic advice from Coach Pablo and CTA button >= 48dp', () => {
    const onActionMock = jest.fn();
    const { getByText, getByRole } = render(
      <InsightBanner
        message="¡Excelente inicio de mes! Ya tienes tu arriendo asegurado."
        actionTitle="Ajustar meta"
        onActionPress={onActionMock}
      />
    );

    expect(getByText('Pablo Financiero')).toBeTruthy();
    expect(
      getByText('¡Excelente inicio de mes! Ya tienes tu arriendo asegurado.')
    ).toBeTruthy();

    const btn = getByRole('button', { name: 'Ajustar meta' });
    expect(btn.props.className).toContain('min-h-[48px]');
    fireEvent.press(btn);
    expect(onActionMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: TransferAccountSelector', () => {
  it('renders source and destination selectors and triggers callbacks', () => {
    const onSelectSourceMock = jest.fn();
    const onSelectDestMock = jest.fn();

    const { getByText } = render(
      <TransferAccountSelector
        sourceAccountName="Bancolombia Ahorros"
        destinationAccountName="Efectivo Billetera"
        onSelectSource={onSelectSourceMock}
        onSelectDestination={onSelectDestMock}
      />
    );

    expect(getByText('Cuenta de origen')).toBeTruthy();
    expect(getByText('Bancolombia Ahorros')).toBeTruthy();
    expect(getByText('Cuenta de destino')).toBeTruthy();
    expect(getByText('Efectivo Billetera')).toBeTruthy();

    fireEvent.press(getByText('Bancolombia Ahorros'));
    expect(onSelectSourceMock).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Efectivo Billetera'));
    expect(onSelectDestMock).toHaveBeenCalledTimes(1);
  });

  it('shows error message if source and destination are identical', () => {
    const { getByText } = render(
      <TransferAccountSelector
        sourceAccountId="acc1"
        destinationAccountId="acc1"
        sourceAccountName="Nequi"
        destinationAccountName="Nequi"
        onSelectSource={() => {}}
        onSelectDestination={() => {}}
      />
    );

    expect(
      getByText('La cuenta de origen y destino no pueden ser la misma')
    ).toBeTruthy();
  });
});

describe('Molecules: VitalPillarRow', () => {
  it('renders pillar with title, description, and numeric COP input', () => {
    const onChangeMock = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <VitalPillarRow
        pillarKey="housing"
        title="Vivienda"
        description="Arriendo, hipoteca o cuota de administración"
        value="1200000"
        onChangeValue={onChangeMock}
      />
    );

    expect(getByText('Vivienda')).toBeTruthy();
    expect(
      getByText('Arriendo, hipoteca o cuota de administración')
    ).toBeTruthy();

    const input = getByPlaceholderText('0');
    fireEvent.changeText(input, '1300000');
    expect(onChangeMock).toHaveBeenCalledWith('1300000');
  });
});

describe('Molecules: GuacaSnackbar', () => {
  it('renders bottom snackbar with message and "Deshacer" button >= 48dp', () => {
    const onUndoMock = jest.fn();
    const onDismissMock = jest.fn();

    const { getByText, getByRole } = render(
      <GuacaSnackbar
        visible={true}
        message="Movimiento eliminado"
        canUndo={true}
        onUndo={onUndoMock}
        onDismiss={onDismissMock}
      />
    );

    expect(getByText('Movimiento eliminado')).toBeTruthy();

    const undoBtn = getByRole('button', { name: 'Deshacer' });
    expect(undoBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(undoBtn);
    expect(onUndoMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: EmptyState', () => {
  it('renders empathetic message and CTA button >= 48dp', () => {
    const onActionMock = jest.fn();
    const { getByText, getByRole } = render(
      <EmptyState
        title="Sin deudas registradas"
        description="¡Qué gran tranquilidad! Puedes registrar compromisos cuando lo requieras."
        actionTitle="Agregar deuda"
        onActionPress={onActionMock}
      />
    );

    expect(getByText('Sin deudas registradas')).toBeTruthy();
    expect(
      getByText(
        '¡Qué gran tranquilidad! Puedes registrar compromisos cuando lo requieras.'
      )
    ).toBeTruthy();

    const actionBtn = getByRole('button', { name: 'Agregar deuda' });
    expect(actionBtn.props.className).toContain('min-h-[48px]');
    fireEvent.press(actionBtn);
    expect(onActionMock).toHaveBeenCalledTimes(1);
  });
});

describe('Molecules: SelectFieldTrigger', () => {
  it('renders touch trigger >= 48dp with label and selected value', () => {
    const onPressMock = jest.fn();
    const { getByText, getByRole } = render(
      <SelectFieldTrigger
        label="Cuenta pagadora"
        value="Bancolombia Principal"
        onPress={onPressMock}
      />
    );

    expect(getByText('Cuenta pagadora')).toBeTruthy();
    expect(getByText('Bancolombia Principal')).toBeTruthy();

    const trigger = getByRole('button');
    expect(trigger.props.className).toContain('min-h-[48px]');
    fireEvent.press(trigger);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
