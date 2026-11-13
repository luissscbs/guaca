/**
 * Guaca v2: SQLite Database & Repository Types
 * Define la abstracción SQLiteExecutor compatible con expo-sqlite v15,
 * modelos de base de datos relacionales, tipos para paginación, filtros y deshacer.
 */

import {
  Debt,
  FinancialPillar,
  MonthHealthResult,
  EmergencyFundResult,
  Transaction,
  TransactionType,
  UserSettings,
  VitalBreakdown,
  Wallet,
  WalletType,
} from '../domain/types';

// ==========================================
// 1. Abstracción del Motor SQLite (expo-sqlite v15)
// ==========================================

export type SQLiteBindValue = string | number | null | boolean | Uint8Array;
export type SQLiteBindParams = SQLiteBindValue[];

export interface SQLiteRunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * Interfaz universal para el ejecutor de SQLite.
 * Compatible al 100% con SQLiteDatabase de expo-sqlite v15 y con el adaptador en memoria de pruebas.
 */
export interface SQLiteExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SQLiteBindParams): Promise<SQLiteRunResult>;
  getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

// ==========================================
// 2. Registro para Snackbar "Deshacer" (Undo)
// ==========================================

export interface TransactionUndoRecord {
  transaction: Transaction;
  affectedWalletId: string;
  previousWalletBalance: number;
  newWalletBalance: number;
  affectedDestinationWalletId?: string;
  previousDestinationWalletBalance?: number;
  newDestinationWalletBalance?: number;
  isCreditCard?: boolean;
}

// ==========================================
// 3. Paginación y Filtros de Movimientos
// ==========================================

export interface TransactionQueryOptions {
  type?: TransactionType;
  pillar?: FinancialPillar;
  walletId?: string;
  monthKey?: string; // Formato YYYY-MM
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number; // Por defecto 30, máx 100
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

// ==========================================
// 4. Onboarding
// ==========================================

export interface CompleteOnboardingInput {
  userName: string;
  netMonthlyIncome: number;
  vitalBreakdown: VitalBreakdown;
  initialWalletName?: string;
  initialWalletType?: WalletType;
  initialWalletBalance?: number;
  monthStartDay?: number;
  seedBudgets?: boolean;
}

export interface OnboardingResult {
  settings: UserSettings;
  wallet: Wallet | null;
}

// ==========================================
// 5. Agregaciones Mensuales del Coach
// ==========================================

export interface MonthlyCoachSummary {
  monthKey: string;
  totalIncome: number;
  vitalSpent: number;
  growthSpent: number;
  leisureSpent: number;
  debtSpent: number;
  totalExpenses: number;
  totalLiquidity: number;
  emergencyFundBalance: number;
  activeDebtsTotal: number;
  activeDebtsMinPayment: number;
  vitalMinimum: number;
  savingCapacity: number;
  guiltFreeAvailable: number;
  healthStatus: MonthHealthResult;
  emergencyFund: EmergencyFundResult;
}

// ==========================================
// 6. Respaldo
// ==========================================

export interface BackupImportResult {
  success: boolean;
  error?: string;
  recordsImported?: {
    wallets: number;
    creditCards: number;
    debts: number;
    transactions: number;
    budgets: number;
    subscriptions: number;
    savingsGoals: number;
  };
}
