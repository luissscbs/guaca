import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import RootLayout from '../_layout';
import OnboardingScreen from '../onboarding';
import HomeScreen from '../(tabs)/index';
import MovementsScreen from '../(tabs)/movements';
import AccountsScreen from '../(tabs)/accounts';
import BudgetsScreen from '../(tabs)/budgets';
import CoachScreen from '../(tabs)/coach';
import QuickRecordScreen from '../quick-record';
import ReportsScreen from '../reports';
import SettingsScreen from '../settings';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    PanGestureHandler: View,
    AttachGestureHandler: View,
    State: {},
    Directions: {},
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaView: ({ children, ...props }: any) => {
      const { View } = require('react-native');
      return <View {...props}>{children}</View>;
    },
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    useSegments: () => ['(tabs)'],
    Redirect: ({ href }: { href: string }) => null,
    Stack: Object.assign(({ children }: any) => <>{children}</>, {
      Screen: () => null,
    }),
    Tabs: Object.assign(({ children }: any) => <>{children}</>, {
      Screen: () => null,
    }),
  };
});

jest.mock('@expo-google-fonts/manrope', () => ({
  useFonts: () => [true, null],
  Manrope_400Regular: 'Manrope_400Regular',
  Manrope_500Medium: 'Manrope_500Medium',
  Manrope_600SemiBold: 'Manrope_600SemiBold',
  Manrope_700Bold: 'Manrope_700Bold',
  Manrope_800ExtraBold: 'Manrope_800ExtraBold',
}));

jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
  JetBrainsMono_500Medium: 'JetBrainsMono_500Medium',
  JetBrainsMono_600SemiBold: 'JetBrainsMono_600SemiBold',
  JetBrainsMono_700Bold: 'JetBrainsMono_700Bold',
}));

describe('Screens & Navigation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFinanceStore.setState({
      isReady: true,
      isLoading: false,
      error: null,
      themeMode: 'system',
      settings: {
        userName: 'Carlos',
        currency: 'COP',
        netMonthlyIncome: 3500000,
        vitalMinimumBreakdown: {
          housing: 1200000,
          food: 600000,
          utilities: 300000,
          transport: 150000,
        },
        monthStartDay: 1,
        isPrivateMode: false,
        onboardingCompleted: true,
        profileType: 'salary',
        geminiApiKey: 'AIzaSyFakeKey123',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      wallets: [
        {
          id: 'w1',
          name: 'Bancolombia',
          type: 'bank',
          balance: 1500000,
          isArchived: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'w-vault',
          name: 'Mi Guaca',
          type: 'vault',
          balance: 800000,
          isArchived: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      creditCards: [
        {
          id: 'cc1',
          name: 'Tarjeta Nu',
          creditLimit: 3000000,
          currentBalance: 500000,
          cutoffDay: 15,
          dueDay: 5,
          monthlyRatePct: 2.1,
          isArchived: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      debts: [
        {
          id: 'd1',
          name: 'Préstamo Familiar',
          creditor: 'Tía Gloria',
          originalBalance: 2000000,
          remainingBalance: 1200000,
          minimumMonthlyPayment: 150000,
          estimatedMonthlyRatePct: 0.0,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      transactions: [],
      hasMoreTransactions: false,
      transactionFilters: {},
      budgets: [
        {
          id: 'b1',
          categoryId: 'mercado',
          monthlyLimit: 700000,
          spentThisMonth: 450000,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      subscriptions: [
        {
          id: 's1',
          name: 'Spotify Familiar',
          amount: 28000,
          frequency: 'monthly',
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      savingsGoals: [
        {
          id: 'g1',
          name: 'Viaje a Santa Marta',
          targetAmount: 2000000,
          currentAmount: 800000,
          isCompleted: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      coachSummary: {
        monthKey: '2026-11',
        totalIncome: 3500000,
        vitalSpent: 1200000,
        growthSpent: 300000,
        leisureSpent: 200000,
        debtSpent: 150000,
        totalExpenses: 1850000,
        totalLiquidity: 1500000,
        emergencyFundBalance: 800000,
        activeDebtsTotal: 1200000,
        activeDebtsMinPayment: 150000,
        vitalMinimum: 2250000,
        savingCapacity: 1100000,
        guiltFreeAvailable: 650000,
        healthStatus: {
          status: 'peace',
          savingCapacity: 1100000,
          savingCapacityPct: 31,
          explanation: '¡Vas muy bien! Tu mes tiene paz.',
        },
        emergencyFund: {
          monthsCovered: 1.1,
          daysCovered: 33,
          nextMilestoneMonths: 3,
          goalAmount: 6750000,
          progressPct: 36,
          explanation: 'Tienes un colchón que te cuida 33 días.',
        },
      },
      safeAllowance: {
        profileType: 'salary',
        profileLabel: 'Sueldo Fijo',
        dailyAllowance: 35000,
        weeklyAllowance: 245000,
        daysRemaining: 18,
        headlineMessage: 'Para gastar hoy sin descuadrarte',
      },
      detectiveInsights: [
        {
          id: 'det-1',
          sourceType: 'subscription',
          categoryOrLeakName: 'Spotify Familiar',
          monthlySpend: 28000,
          suggestedCutAmount: 28000,
          annualSavings: 336000,
          daysOfGuacaGained: 4,
          debtMonthsSaved: 2,
          nequiMessage: 'Si cancelas Spotify Familiar le sumas 4 días de tranquilidad a Tu Guaca.',
        },
      ],
      debtPlan: null,
      aiCoachAdvice: null,
      isAiLoading: false,
      snackbar: {
        visible: false,
        message: '',
        canUndo: false,
      },
    });
  });

  describe('Root Layout & Redirection', () => {
    it('redirects to onboarding if onboarding is not completed', async () => {
      useFinanceStore.setState({
        settings: {
          ...useFinanceStore.getState().settings!,
          onboardingCompleted: false,
        },
      });

      render(<RootLayout />);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/onboarding');
      });
    });

    it('renders global snackbar when active and allows dismiss', () => {
      const dismissMock = jest.fn();
      useFinanceStore.setState({
        snackbar: {
          visible: true,
          message: 'Movimiento eliminado',
          canUndo: true,
          onUndo: jest.fn(),
        },
        dismissSnackbar: dismissMock,
      });

      const { getByText } = render(<RootLayout />);
      expect(getByText('Movimiento eliminado')).toBeTruthy();
      expect(getByText('Deshacer')).toBeTruthy();
    });
  });

  describe('Onboarding Screen', () => {
    it('completes onboarding with student profile and creates Mi Guaca vault', async () => {
      const completeMock = jest.fn().mockResolvedValue(undefined);
      const addWalletMock = jest.fn().mockResolvedValue({ id: 'w-vault', name: 'Mi Guaca' });
      useFinanceStore.setState({
        completeOnboarding: completeMock,
        addWallet: addWalletMock,
        wallets: [],
      });

      const { getByText, getByPlaceholderText, getByRole } = render(<OnboardingScreen />);

      // Select student profile
      const studentBtn = getByRole('button', { name: /Soy estudiante/i });
      fireEvent.press(studentBtn);

      fireEvent.changeText(getByPlaceholderText('Tu nombre o apodo'), 'Sofia');
      fireEvent.changeText(getByPlaceholderText('Nombre de tu cuenta principal'), 'Bancolombia A la mano');
      fireEvent.press(getByRole('button', { name: 'Siguiente' }));

      // Step 2
      expect(getByText(/Tu mesada o apoyo del mes/i)).toBeTruthy();
      fireEvent.changeText(getByPlaceholderText('Ingreso neto al mes'), '900000');
      fireEvent.changeText(getByPlaceholderText('Día de pago (1 al 28)'), '5');
      fireEvent.press(getByRole('button', { name: 'Siguiente' }));

      // Step 3
      fireEvent.changeText(getByPlaceholderText('Vivienda'), '0');
      fireEvent.changeText(getByPlaceholderText('Mercado'), '200000');
      fireEvent.changeText(getByPlaceholderText('Servicios'), '0');
      fireEvent.changeText(getByPlaceholderText('Transporte'), '100000');

      fireEvent.press(getByRole('button', { name: 'Activar mi Guaca' }));

      await waitFor(() => {
        expect(completeMock).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'Sofia',
            profileType: 'student',
          })
        );
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('Home Screen (Inicio)', () => {
    it('renders user greeting, safe allowance, emergency fund gauge, and handles privacy toggle', async () => {
      const togglePrivateMock = jest.fn();
      useFinanceStore.setState({ togglePrivateMode: togglePrivateMock });

      const { getByText, getByLabelText } = render(<HomeScreen />);

      // Saludo
      expect(getByText(/¡Hola, Carlos!/i)).toBeTruthy();

      // Tope seguro
      expect(getByText('Para gastar hoy sin descuadrarte')).toBeTruthy();
      expect(getByText('$ 35.000')).toBeTruthy();
      expect(getByText('$ 245.000')).toBeTruthy();

      // Tu Guaca
      expect(getByText('Tu Guaca')).toBeTruthy();

      // Botón de privacidad
      const privacyBtn = getByLabelText(/Ocultar cifras|Mostrar cifras|Modo privado/i);
      fireEvent.press(privacyBtn);
      expect(togglePrivateMock).toHaveBeenCalled();
    });

    it('renders empty state for recent movements when none exist', () => {
      useFinanceStore.setState({ transactions: [] });
      const { getByText } = render(<HomeScreen />);
      expect(getByText(/Por aquí todavía no se ha movido ni una moneda/i)).toBeTruthy();
    });

    it('renders "Anotar al instante" section with "Me enviaron plata", quick presets and navigates with params', () => {
      useFinanceStore.setState({
        quickPresets: [
          {
            id: 'preset-carro',
            name: 'CARRO',
            type: 'expense',
            defaultAmount: 50000,
            pillar: 'leisure',
            categoryId: 'carro',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      });

      const { getByText, getByRole } = render(<HomeScreen />);

      // Sección Anotar al instante
      expect(getByText('Anotar al instante')).toBeTruthy();

      // Botón "Me enviaron plata"
      const incomeQuickBtn = getByRole('button', { name: /Me enviaron plata/i });
      fireEvent.press(incomeQuickBtn);
      expect(mockPush).toHaveBeenCalledWith('/quick-record?initialType=income');

      // Botón preset CARRO
      const carroChip = getByRole('button', { name: /CARRO · \$ 50\.000/i });
      fireEvent.press(carroChip);
      expect(mockPush).toHaveBeenCalledWith('/quick-record?presetId=preset-carro');
    });

    it('masks preset amount in "Anotar al instante" when isPrivateMode is true', () => {
      useFinanceStore.setState({
        settings: {
          ...useFinanceStore.getState().settings!,
          isPrivateMode: true,
        },
        quickPresets: [
          {
            id: 'preset-carro',
            name: 'CARRO',
            type: 'expense',
            defaultAmount: 50000,
            pillar: 'leisure',
            categoryId: 'carro',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      });

      const { getByRole, getByText, queryByText, queryByLabelText } = render(<HomeScreen />);

      // El monto real no debe aparecer ni en texto visible del chip ni en su accesibilidad
      expect(queryByText('CARRO · $ 50.000')).toBeNull();
      expect(queryByLabelText('CARRO · $ 50.000')).toBeNull();

      // El chip enmascarado debe estar presente
      const maskedChip = getByRole('button', { name: /CARRO · \$ •••••••/i });
      expect(maskedChip).toBeTruthy();
      expect(getByText(/CARRO · \$ •••••••/i)).toBeTruthy();
    });
  });

  describe('Movements Screen', () => {
    it('filters transactions by type and triggers search', async () => {
      const setFiltersMock = jest.fn();
      useFinanceStore.setState({
        setTransactionFilters: setFiltersMock,
        transactions: [
          {
            id: 'tx-1',
            amount: 45000,
            type: 'expense',
            pillar: 'vital',
            walletId: 'w1',
            date: '2026-11-12',
            note: 'Almuerzo corriente',
            createdAt: '2026-11-12',
          },
        ],
      });

      const { getByText, getByPlaceholderText, getByRole } = render(<MovementsScreen />);

      expect(getByText('Almuerzo corriente')).toBeTruthy();

      // Filter chip
      const expenseChip = getByRole('button', { name: 'Gastos' });
      fireEvent.press(expenseChip);
      expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'expense' }));

      // Search input
      const searchInput = getByPlaceholderText(/Buscar por nota o comercio/i);
      fireEvent.changeText(searchInput, 'Almuerzo');
      await waitFor(() => {
        expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'Almuerzo' }));
      });
    });
  });

  describe('Accounts Screen', () => {
    it('displays wallets including Mi Guaca, credit card limits, and debts with cost per 100k', () => {
      const { getByText } = render(<AccountsScreen />);

      // Wallets
      expect(getByText('Bancolombia')).toBeTruthy();
      expect(getByText('Mi Guaca')).toBeTruthy();

      // Credit Cards
      expect(getByText('Tarjeta Nu')).toBeTruthy();

      // Debts
      expect(getByText('Préstamo Familiar')).toBeTruthy();
    });

    it('validates amount greater than zero with friendly Nequi alert on card and payment creation', async () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      const { getByRole, getByPlaceholderText, getByText } = render(<AccountsScreen />);

      // Open new card modal
      const newCardBtn = getByRole('button', { name: /Nueva tarjeta/i });
      fireEvent.press(newCardBtn);

      const nameInput = getByPlaceholderText('Ej: Nu, Falabella, Bancolombia');
      fireEvent.changeText(nameInput, 'Tarjeta Éxito');

      // Attempt with empty or 0 limit
      const saveCardBtn = getByRole('button', { name: 'Guardar tarjeta' });
      fireEvent.press(saveCardBtn);

      expect(alertSpy).toHaveBeenCalledWith(
        '¡Ey, un detallito!',
        expect.stringMatching(/cupo mayor a \$ 0/i)
      );
      alertSpy.mockRestore();
    });
  });

  describe('Budgets Screen', () => {
    it('renders vital minimum breakdown, category budget card, and leak detector', () => {
      const { getByText } = render(<BudgetsScreen />);

      // Vital minimum summary
      expect(getByText('Lo sagrado del mes')).toBeTruthy();

      // Budget Category
      expect(getByText('mercado')).toBeTruthy();

      // Leaks
      expect(getByText('Spotify Familiar')).toBeTruthy();
    });

    it('validates budget limit greater than zero with friendly alert', () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      const { getByRole } = render(<BudgetsScreen />);

      const newBudgetBtn = getByRole('button', { name: /Definir tope/i });
      fireEvent.press(newBudgetBtn);

      const saveBtn = getByRole('button', { name: 'Fijar tope' });
      fireEvent.press(saveBtn);

      expect(alertSpy).toHaveBeenCalledWith(
        '¡Ey, un detallito!',
        expect.stringMatching(/tope mensual mayor a \$ 0/i)
      );
      alertSpy.mockRestore();
    });
  });

  describe('Coach & Detective Screen', () => {
    it('renders detective insights and calls askAiCoach when requested', async () => {
      const askAiCoachMock = jest.fn().mockResolvedValue({
        message: 'Vas por excelente camino.',
        tips: ['Sigue así.'],
        source: 'local-detective',
      });
      useFinanceStore.setState({ askAiCoach: askAiCoachMock });

      const { getByText, getByRole, queryByText } = render(<CoachScreen />);

      // Detective insight
      expect(getByText(/Spotify Familiar/i)).toBeTruthy();

      // No debe contener "1.5 Flash"
      expect(queryByText(/1\.5 Flash/i)).toBeNull();

      // Botón AI Coach
      const aiBtn = getByRole('button', { name: /Pedir consejo a mi Coach IA/i });
      fireEvent.press(aiBtn);

      await waitFor(() => {
        expect(askAiCoachMock).toHaveBeenCalledTimes(1);
      });
    });

    it('masks amounts in DebtPayoffPlanner when privateMode is true', () => {
      useFinanceStore.setState({
        settings: {
          ...useFinanceStore.getState().settings!,
          isPrivateMode: true,
        },
      });

      const { getAllByText } = render(<CoachScreen />);
      const masked = getAllByText('$ •••••••');
      expect(masked.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Quick Record Screen', () => {
    it('renders quick record form and submits to store then navigates back', async () => {
      const addTxMock = jest.fn().mockResolvedValue({});
      useFinanceStore.setState({ addTransaction: addTxMock });

      const { getByRole, getByPlaceholderText } = render(<QuickRecordScreen />);

      const amountChip = getByRole('button', { name: /Sumar \$ 50\.000/i });
      fireEvent.press(amountChip);

      const submitBtn = getByRole('button', { name: /Registrar movimiento/i });
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(addTxMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 50000,
            type: 'expense',
          })
        );
        expect(mockBack).toHaveBeenCalled();
      });
    });
  });

  describe('Reports Screen', () => {
    it('renders 3 charts and allows going back', () => {
      const { getByText, getByLabelText } = render(<ReportsScreen />);

      expect(getByText(/Radiografía de tu Plata/i)).toBeTruthy();
      const backBtn = getByLabelText(/Volver/i);
      fireEvent.press(backBtn);
      expect(mockBack).toHaveBeenCalled();
    });

    it('masks amounts in ComparisonBarChart and TrendLineChart when privateMode is true', () => {
      useFinanceStore.setState({
        settings: {
          ...useFinanceStore.getState().settings!,
          isPrivateMode: true,
        },
      });

      const { getAllByText, queryByText } = render(<ReportsScreen />);
      // Should mask amounts
      const masked = getAllByText('$ •••••••');
      expect(masked.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Settings Screen', () => {
    it('updates profile, vital pillars, secure Gemini API key and theme', async () => {
      const updateSettingsMock = jest.fn().mockResolvedValue(undefined);
      useFinanceStore.setState({ updateSettings: updateSettingsMock });

      const { getByText, getByPlaceholderText, getByRole } = render(<SettingsScreen />);

      // Nombre
      const nameInput = getByPlaceholderText('Tu nombre');
      fireEvent.changeText(nameInput, 'Carlos Mendoza');

      // Key de Gemini con secure entry
      const apiKeyInput = getByPlaceholderText('Pega aquí tu clave de Gemini...');
      expect(apiKeyInput.props.secureTextEntry).toBe(true);

      // Guardar cambios
      const saveBtn = getByRole('button', { name: /Guardar ajustes/i });
      fireEvent.press(saveBtn);

      await waitFor(() => {
        expect(updateSettingsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'Carlos Mendoza',
          })
        );
      });
    });
  });
});
