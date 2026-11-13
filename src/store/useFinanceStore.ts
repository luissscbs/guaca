/**
 * Guaca v2: Central Reactive State Store (Zustand v5)
 * Conecta UI <-> GuacaRepository <-> Domain Engines (Coach Financiero & Debt Planner).
 * 100% tipado estricto (cero any), sincronización atómica con SQLite,
 * manejo de errores en español amigable para no técnicos ("Para Dummies")
 * y soporte instantáneo para Deshacer (Undo) vía Snackbar.
 */

import { create } from 'zustand';
import { exportBackupPayload, importBackupJson, serializeBackup } from '../db/backup';
import { openGuacaDatabase } from '../db/client';
import { GuacaRepository } from '../db/repository';
import { initDatabase } from '../db/schema';
import {
  BackupImportResult,
  CompleteOnboardingInput,
  CreateQuickPresetInput,
  MonthlyCoachSummary,
  SQLiteExecutor,
  TransactionQueryOptions,
  TransactionUndoRecord,
  UpdateQuickPresetInput,
} from '../db/types';
import { calculateSafeAllowance, analyzeSpendingDetective } from '../domain/coach';
import { planDebtPayoff } from '../domain/debtPlanner';
import {
  Budget,
  CreditCard,
  Debt,
  DebtPayoffPlan,
  FinancialPillar,
  LeakFrequency,
  QuickPreset,
  SafeAllowanceSummary,
  SavingsGoal,
  SpendingDetectiveInsight,
  SubscriptionLeak,
  Transaction,
  TransactionType,
  UserProfileType,
  UserSettings,
  Wallet,
  WalletType,
} from '../domain/types';
import { askParceCoachAI, ParceCoachAIResult } from '../services/geminiCoach';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SnackbarState {
  visible: boolean;
  message: string;
  canUndo: boolean;
  onUndo?: () => Promise<void> | void;
}

export interface FinanceState {
  // Estado base
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  themeMode: ThemeMode;

  // Entidades principales de dominio
  settings: UserSettings | null;
  wallets: Wallet[];
  creditCards: CreditCard[];
  debts: Debt[];
  transactions: Transaction[];
  hasMoreTransactions: boolean;
  transactionFilters: TransactionQueryOptions;
  budgets: Budget[];
  subscriptions: SubscriptionLeak[];
  savingsGoals: SavingsGoal[];
  quickPresets: QuickPreset[];

  // Inteligencia de Coach y Deudas
  coachSummary: MonthlyCoachSummary | null;
  safeAllowance: SafeAllowanceSummary | null;
  detectiveInsights: SpendingDetectiveInsight[];
  debtPlan: {
    snowball: DebtPayoffPlan;
    avalanche: DebtPayoffPlan;
  } | null;
  aiCoachAdvice: ParceCoachAIResult | null;
  isAiLoading: boolean;

  // Notificación accesible Snackbar
  snackbar: SnackbarState;

  // Acciones globales
  initStore: (customDb?: SQLiteExecutor) => Promise<void>;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>;
  updateSettings: (partial: Partial<Omit<UserSettings, 'createdAt' | 'updatedAt'>>) => Promise<void>;
  togglePrivateMode: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  dismissSnackbar: () => void;
  askAiCoach: () => Promise<ParceCoachAIResult>;

  // Acciones de Billeteras
  addWallet: (input: { name: string; type: WalletType; balance?: number; icon?: string; color?: string }) => Promise<Wallet>;
  updateWallet: (id: string, input: Partial<Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  archiveWallet: (id: string, isArchived: boolean) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  // Acciones de Tarjetas de Crédito
  addCreditCard: (input: { name: string; creditLimit: number; currentBalance?: number; cutoffDay?: number; dueDay?: number; monthlyRatePct?: number }) => Promise<CreditCard>;
  updateCreditCard: (id: string, input: Partial<Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  archiveCreditCard: (id: string, isArchived: boolean) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Acciones de Deudas
  addDebt: (input: { name: string; creditor: string; originalBalance: number; remainingBalance?: number; minimumMonthlyPayment: number; estimatedMonthlyRatePct?: number; notes?: string }) => Promise<Debt>;
  updateDebt: (id: string, input: Partial<Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  makeDebtPayment: (id: string, paymentAmount: number) => Promise<void>;
  markDebtAsPaid: (id: string, isPaid: boolean) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Acciones de Movimientos
  addTransaction: (input: { amount: number; type: TransactionType; pillar: FinancialPillar; walletId: string; destinationWalletId?: string; categoryId?: string; date?: string; note?: string }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Pick<Transaction, 'amount' | 'type' | 'pillar' | 'walletId' | 'destinationWalletId' | 'categoryId' | 'date' | 'note'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  undoLastTransaction: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactionFilters: (filters: TransactionQueryOptions) => Promise<void>;

  // Acciones de Presupuestos
  setBudget: (input: { categoryId: string; monthlyLimit: number; spentThisMonth?: number }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Acciones de Suscripciones (Fugas)
  addSubscription: (input: { name: string; amount: number; frequency: LeakFrequency; walletId?: string; categoryId?: string }) => Promise<SubscriptionLeak>;
  updateSubscription: (id: string, input: Partial<Omit<SubscriptionLeak, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  // Acciones de Metas de Ahorro
  addSavingsGoal: (input: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string; icon?: string }) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, input: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  contributeSavingsGoal: (id: string, amount: number) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  // Acciones de Botones Rápidos (Quick Presets)
  addQuickPreset: (input: CreateQuickPresetInput) => Promise<QuickPreset>;
  updateQuickPreset: (id: string, partial: UpdateQuickPresetInput) => Promise<void>;
  deleteQuickPreset: (id: string) => Promise<void>;

  // Respaldo y Restauración
  exportBackup: (appVersion?: string) => Promise<string>;
  importBackup: (rawJson: string | object) => Promise<BackupImportResult>;

  // Refrescos
  refreshAll: () => Promise<void>;
  refreshCoachSummary: (monthKey?: string) => Promise<void>;
  refreshDebtPlan: (extraPayment?: number) => void;
}

// Variables internas no reactivas para motor y undo
let activeDb: SQLiteExecutor | null = null;
let activeRepo: GuacaRepository | null = null;
let lastUndoRecord: TransactionUndoRecord | null = null;

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isReady: false,
  isLoading: false,
  error: null,
  themeMode: 'system',

  settings: null,
  wallets: [],
  creditCards: [],
  debts: [],
  transactions: [],
  hasMoreTransactions: false,
  transactionFilters: {},
  budgets: [],
  subscriptions: [],
  savingsGoals: [],
  quickPresets: [],

  coachSummary: null,
  safeAllowance: null,
  detectiveInsights: [],
  debtPlan: null,
  aiCoachAdvice: null,
  isAiLoading: false,

  snackbar: {
    visible: false,
    message: '',
    canUndo: false,
  },

  initStore: async (customDb?: SQLiteExecutor) => {
    try {
      set({ isLoading: true, error: null });

      const db = customDb || (await openGuacaDatabase('guaca.db'));
      await initDatabase(db);

      activeDb = db;
      activeRepo = new GuacaRepository(db);

      await get().refreshAll();
      set({ isReady: true, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar la base de datos.';
      set({ isReady: true, isLoading: false, error: msg });
    }
  },

  completeOnboarding: async (input: CompleteOnboardingInput) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    try {
      set({ isLoading: true });
      await activeRepo.completeOnboarding(input);
      await get().refreshAll();
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateSettings: async (partial) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const current = get().settings;
    if (!current) throw new Error('Ajustes no inicializados.');

    const updated = await activeRepo.upsertSettings({
      ...current,
      ...partial,
      vitalMinimumBreakdown: {
        ...current.vitalMinimumBreakdown,
        ...(partial.vitalMinimumBreakdown || {}),
      },
    });

    set({ settings: updated });
    await get().refreshCoachSummary();
  },

  togglePrivateMode: async () => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const current = get().settings;
    if (!current) return;

    const newMode = !current.isPrivateMode;
    await activeRepo.setPrivateMode(newMode);
    set({ settings: { ...current, isPrivateMode: newMode } });
  },

  setThemeMode: (mode: ThemeMode) => {
    set({ themeMode: mode });
  },

  dismissSnackbar: () => {
    set({ snackbar: { visible: false, message: '', canUndo: false } });
  },

  // ==========================================
  // Wallets
  // ==========================================

  addWallet: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createWallet(input);
    const wallets = await activeRepo.listWallets();
    set({ wallets });
    await get().refreshCoachSummary();
    return created;
  },

  updateWallet: async (id, input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateWallet(id, input);
    const wallets = await activeRepo.listWallets();
    set({ wallets });
    await get().refreshCoachSummary();
  },

  archiveWallet: async (id, isArchived) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.archiveWallet(id, isArchived);
    const wallets = await activeRepo.listWallets();
    set({ wallets });
    await get().refreshCoachSummary();
  },

  deleteWallet: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteWallet(id);
    const wallets = await activeRepo.listWallets();
    set({ wallets });
    await get().refreshCoachSummary();
  },

  // ==========================================
  // Credit Cards
  // ==========================================

  addCreditCard: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createCreditCard(input);
    const creditCards = await activeRepo.listCreditCards();
    set({ creditCards });
    return created;
  },

  updateCreditCard: async (id, input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateCreditCard(id, input);
    const creditCards = await activeRepo.listCreditCards();
    set({ creditCards });
  },

  archiveCreditCard: async (id, isArchived) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.archiveCreditCard(id, isArchived);
    const creditCards = await activeRepo.listCreditCards();
    set({ creditCards });
  },

  deleteCreditCard: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteCreditCard(id);
    const creditCards = await activeRepo.listCreditCards();
    set({ creditCards });
  },

  // ==========================================
  // Debts
  // ==========================================

  addDebt: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createDebt(input);
    const debts = await activeRepo.listDebts();
    set({ debts });
    get().refreshDebtPlan();
    await get().refreshCoachSummary();
    return created;
  },

  updateDebt: async (id, input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateDebt(id, input);
    const debts = await activeRepo.listDebts();
    set({ debts });
    get().refreshDebtPlan();
    await get().refreshCoachSummary();
  },

  makeDebtPayment: async (id, paymentAmount) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.recordDebtPayment(id, paymentAmount);
    const debts = await activeRepo.listDebts();
    set({ debts });
    get().refreshDebtPlan();
    await get().refreshCoachSummary();
  },

  markDebtAsPaid: async (id, isPaid) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.markDebtAsPaid(id, isPaid);
    const debts = await activeRepo.listDebts();
    set({ debts });
    get().refreshDebtPlan();
    await get().refreshCoachSummary();
  },

  deleteDebt: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteDebt(id);
    const debts = await activeRepo.listDebts();
    set({ debts });
    get().refreshDebtPlan();
    await get().refreshCoachSummary();
  },

  // ==========================================
  // Transactions
  // ==========================================

  addTransaction: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createTransaction(input);

    const [wallets, creditCards, txResult, budgets] = await Promise.all([
      activeRepo.listWallets(),
      activeRepo.listCreditCards(),
      activeRepo.listTransactions({ ...get().transactionFilters, limit: 30, offset: 0 }),
      activeRepo.listBudgets(),
    ]);

    set({
      wallets,
      creditCards,
      transactions: txResult.items,
      hasMoreTransactions: txResult.hasMore,
      budgets,
    });

    await get().refreshCoachSummary();
    return created;
  },

  updateTransaction: async (id, updates) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateTransaction(id, updates);

    const [wallets, creditCards, txResult, budgets] = await Promise.all([
      activeRepo.listWallets(),
      activeRepo.listCreditCards(),
      activeRepo.listTransactions({ ...get().transactionFilters, limit: 30, offset: 0 }),
      activeRepo.listBudgets(),
    ]);

    set({
      wallets,
      creditCards,
      transactions: txResult.items,
      hasMoreTransactions: txResult.hasMore,
      budgets,
    });

    await get().refreshCoachSummary();
  },

  deleteTransaction: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const undoRecord = await activeRepo.deleteTransaction(id);
    lastUndoRecord = undoRecord;

    const [wallets, creditCards, txResult, budgets] = await Promise.all([
      activeRepo.listWallets(),
      activeRepo.listCreditCards(),
      activeRepo.listTransactions({ ...get().transactionFilters, limit: 30, offset: 0 }),
      activeRepo.listBudgets(),
    ]);

    set({
      wallets,
      creditCards,
      transactions: txResult.items,
      hasMoreTransactions: txResult.hasMore,
      budgets,
      snackbar: {
        visible: true,
        message: 'Movimiento eliminado',
        canUndo: true,
        onUndo: () => get().undoLastTransaction(),
      },
    });

    await get().refreshCoachSummary();
  },

  undoLastTransaction: async () => {
    if (!activeRepo || !lastUndoRecord) return;
    const undo = lastUndoRecord;
    lastUndoRecord = null;

    await activeRepo.restoreTransactionSnapshot(undo);

    const [wallets, creditCards, txResult, budgets] = await Promise.all([
      activeRepo.listWallets(),
      activeRepo.listCreditCards(),
      activeRepo.listTransactions({ ...get().transactionFilters, limit: 30, offset: 0 }),
      activeRepo.listBudgets(),
    ]);

    set({
      wallets,
      creditCards,
      transactions: txResult.items,
      hasMoreTransactions: txResult.hasMore,
      budgets,
      snackbar: {
        visible: false,
        message: 'Movimiento restaurado',
        canUndo: false,
      },
    });

    await get().refreshCoachSummary();
  },

  loadMoreTransactions: async () => {
    if (!activeRepo || !get().hasMoreTransactions) return;

    const currentOffset = get().transactions.length;
    const result = await activeRepo.listTransactions({
      ...get().transactionFilters,
      limit: 30,
      offset: currentOffset,
    });

    set({
      transactions: [...get().transactions, ...result.items],
      hasMoreTransactions: result.hasMore,
    });
  },

  setTransactionFilters: async (filters) => {
    if (!activeRepo) return;
    set({ transactionFilters: filters });

    const result = await activeRepo.listTransactions({
      ...filters,
      limit: 30,
      offset: 0,
    });

    set({
      transactions: result.items,
      hasMoreTransactions: result.hasMore,
    });
  },

  // ==========================================
  // Budgets
  // ==========================================

  setBudget: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.upsertBudget(input);
    const budgets = await activeRepo.listBudgets();
    set({ budgets });
  },

  deleteBudget: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteBudget(id);
    const budgets = await activeRepo.listBudgets();
    set({ budgets });
  },

  // ==========================================
  // Subscriptions
  // ==========================================

  addSubscription: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createSubscription(input);
    const subscriptions = await activeRepo.listSubscriptions();
    set({ subscriptions });
    await get().refreshCoachSummary();
    return created;
  },

  updateSubscription: async (id, input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateSubscription(id, input);
    const subscriptions = await activeRepo.listSubscriptions();
    set({ subscriptions });
    await get().refreshCoachSummary();
  },

  deleteSubscription: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteSubscription(id);
    const subscriptions = await activeRepo.listSubscriptions();
    set({ subscriptions });
    await get().refreshCoachSummary();
  },

  // ==========================================
  // Savings Goals
  // ==========================================

  addSavingsGoal: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const created = await activeRepo.createSavingsGoal(input);
    const savingsGoals = await activeRepo.listSavingsGoals();
    set({ savingsGoals });
    return created;
  },

  updateSavingsGoal: async (id, input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateSavingsGoal(id, input);
    const savingsGoals = await activeRepo.listSavingsGoals();
    set({ savingsGoals });
  },

  contributeSavingsGoal: async (id, amount) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.contributeToSavingsGoal(id, amount);
    const savingsGoals = await activeRepo.listSavingsGoals();
    set({ savingsGoals });
  },

  deleteSavingsGoal: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteSavingsGoal(id);
    const savingsGoals = await activeRepo.listSavingsGoals();
    set({ savingsGoals });
  },

  // ==========================================
  // Botones Rápidos (Quick Presets)
  // ==========================================

  addQuickPreset: async (input) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    const preset = await activeRepo.createQuickPreset(input);
    const quickPresets = await activeRepo.listQuickPresets();
    set({
      quickPresets,
      snackbar: {
        visible: true,
        message: '¡Listo! Guardamos tu botón rápido',
        canUndo: false,
      },
    });
    return preset;
  },

  updateQuickPreset: async (id, partial) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.updateQuickPreset(id, partial);
    const quickPresets = await activeRepo.listQuickPresets();
    set({
      quickPresets,
      snackbar: {
        visible: true,
        message: '¡Listo! Actualizamos tu botón rápido',
        canUndo: false,
      },
    });
  },

  deleteQuickPreset: async (id) => {
    if (!activeRepo) throw new Error('Base de datos no inicializada.');
    await activeRepo.deleteQuickPreset(id);
    const quickPresets = await activeRepo.listQuickPresets();
    set({
      quickPresets,
      snackbar: {
        visible: true,
        message: 'Eliminamos el botón rápido',
        canUndo: false,
      },
    });
  },

  // ==========================================
  // Backup & Restore
  // ==========================================

  exportBackup: async (appVersion = '1.0.0') => {
    if (!activeDb) throw new Error('Base de datos no inicializada.');
    const payload = await exportBackupPayload(activeDb, appVersion);
    return serializeBackup(payload);
  },

  importBackup: async (rawJson) => {
    if (!activeDb) throw new Error('Base de datos no inicializada.');
    const result = await importBackupJson(activeDb, rawJson);
    if (result.success) {
      await get().refreshAll();
    }
    return result;
  },

  // ==========================================
  // Refrescos
  // ==========================================

  refreshAll: async () => {
    if (!activeRepo) return;

    const [settings, wallets, creditCards, debts, txResult, budgets, subscriptions, savingsGoals, quickPresets] =
      await Promise.all([
        activeRepo.getSettings(),
        activeRepo.listWallets(),
        activeRepo.listCreditCards(),
        activeRepo.listDebts(),
        activeRepo.listTransactions({ ...get().transactionFilters, limit: 30, offset: 0 }),
        activeRepo.listBudgets(),
        activeRepo.listSubscriptions(),
        activeRepo.listSavingsGoals(),
        activeRepo.listQuickPresets(),
      ]);

    set({
      settings,
      wallets,
      creditCards,
      debts,
      transactions: txResult.items,
      hasMoreTransactions: txResult.hasMore,
      budgets,
      subscriptions,
      savingsGoals,
      quickPresets,
    });

    get().refreshDebtPlan();
    await get().refreshCoachSummary();
  },

  refreshCoachSummary: async (monthKey) => {
    if (!activeRepo) return;
    const key = monthKey || getCurrentMonthKey();
    const summary = await activeRepo.getMonthlyCoachSummary(key);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

    const profileType: UserProfileType = get().settings?.profileType || 'salary';

    const safeAllowance = calculateSafeAllowance({
      guiltFreeAvailable: summary.guiltFreeAvailable,
      daysRemainingInMonth: daysRemaining,
      profileType,
    });

    const detectiveInsights = analyzeSpendingDetective({
      transactions: get().transactions,
      subscriptions: get().subscriptions,
      vitalMinimum: summary.vitalMinimum,
      emergencyFundBalance: summary.emergencyFundBalance,
      debts: get().debts,
      now,
    });

    set({ coachSummary: summary, safeAllowance, detectiveInsights });
  },

  askAiCoach: async () => {
    const state = get();
    set({ isAiLoading: true });
    try {
      const settings = state.settings;
      const coach = state.coachSummary;
      const profileType: UserProfileType = settings?.profileType || 'salary';
      const vitalMin = coach?.vitalMinimum || 0;
      const netInc = settings?.netMonthlyIncome || coach?.totalIncome || 0;
      const guiltFree = coach?.guiltFreeAvailable || 0;
      const efBalance = coach?.emergencyFundBalance || 0;
      const efMonths = coach?.emergencyFund?.monthsCovered || 0;

      const catMap = new Map<string, number>();
      for (const tx of state.transactions) {
        if (tx.type === 'expense') {
          const name = tx.categoryId || 'Varios';
          catMap.set(name, (catMap.get(name) || 0) + tx.amount);
        }
      }
      const topCategories = Array.from(catMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const activeLeaksTotal = state.subscriptions
        .filter((s) => s.isActive)
        .reduce(
          (sum, s) => sum + (s.frequency === 'annual' ? s.amount : s.amount * 12),
          0
        );

      const unpaidDebts = state.debts.filter((d) => !d.isPaid);
      const totalDebt = unpaidDebts.reduce((sum, d) => sum + d.remainingBalance, 0);

      const result = await askParceCoachAI({
        apiKey: settings?.geminiApiKey,
        profileType,
        vitalMinimum: vitalMin,
        monthlyIncome: netInc,
        guiltFreeAvailable: guiltFree,
        emergencyFundBalance: efBalance,
        emergencyMonths: efMonths,
        topCategories,
        activeLeaksTotal,
        totalDebt,
        detectiveInsights: state.detectiveInsights,
      });

      set({ aiCoachAdvice: result, isAiLoading: false });
      return result;
    } catch (err: unknown) {
      set({ isAiLoading: false });
      throw err;
    }
  },

  refreshDebtPlan: (extraPayment = 0) => {
    const debts = get().debts.filter((d) => !d.isPaid);
    if (debts.length === 0) {
      set({ debtPlan: null });
      return;
    }

    const snowball = planDebtPayoff(debts, extraPayment, 'snowball');
    const avalanche = planDebtPayoff(debts, extraPayment, 'avalanche');

    set({
      debtPlan: {
        snowball,
        avalanche,
      },
    });
  },
}));
