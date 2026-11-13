/**
 * Guaca v2: Core Domain Types
 * Definición estricta de tipos de entidades, cálculos y resultados del Coach Financiero.
 * 100% libre de dependencias de UI, SQLite o librerías externas.
 */

// ==========================================
// 1. Pilares Financieros y Mínimo Vital
// ==========================================

export type FinancialPillar =
  | 'vital'     // Mínimo Vital (Vivienda, Mercado, Servicios, Transporte)
  | 'growth'    // Ahorro e Inversión (Capacidad de Ahorro, Metas)
  | 'leisure'   // Gastos Libres y Ocio Consciente
  | 'debt'      // Pago de Deudas y Créditos
  | 'income'    // Entradas de Dinero
  | 'transfer'; // Movimiento entre Cuentas Propias

export interface VitalBreakdown {
  housing: number;    // Vivienda (arriendo, hipoteca, administración)
  food: number;       // Mercado (comida básica del hogar)
  utilities: number;  // Servicios públicos e internet esencial
  transport: number;  // Transporte esencial (pasajes, combustible diario)
}

// ==========================================
// 2. Cuentas, Billeteras y Tarjetas
// ==========================================

export type WalletType = 'bank' | 'cash' | 'digital' | 'vault';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  icon?: string;
  color?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
  cutoffDay: number; // 1..31
  dueDay: number;    // 1..31
  monthlyRatePct: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. Deudas y Planificador de Amortización
// ==========================================

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  originalBalance: number;
  remainingBalance: number;
  minimumMonthlyPayment: number;
  estimatedMonthlyRatePct: number;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DebtPayoffStrategy = 'snowball' | 'avalanche';

export interface DebtPayoffPlan {
  strategy: DebtPayoffStrategy;
  monthsToFreedom: number;
  monthsSaved: number;
  totalInterestPaid: number;
  interestSaved: number;
  priorityDebt: Debt | null;
  unpayableWarning: boolean;
  explanation: string;
}

// ==========================================
// 4. Movimientos y Presupuestos
// ==========================================

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  pillar: FinancialPillar;
  walletId: string;
  destinationWalletId?: string; // Requerido para transferencias
  categoryId?: string;
  date: string; // ISO 8601
  note?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  spentThisMonth: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. Suscripciones (Fugas) y Metas
// ==========================================

export type LeakFrequency = 'monthly' | 'annual';

export interface SubscriptionLeak {
  id: string;
  name: string;
  amount: number;
  frequency: LeakFrequency;
  walletId?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickPreset {
  id: string;
  name: string;
  type: 'expense' | 'income';
  defaultAmount: number;
  pillar: FinancialPillar;
  categoryId: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. Ajustes de Usuario y Respaldo
// ==========================================

export type UserProfileType = 'salary' | 'student' | 'variable';

export interface UserSettings {
  userName: string;
  currency: 'COP';
  netMonthlyIncome: number;
  vitalMinimumBreakdown: VitalBreakdown;
  monthStartDay: number; // 1..28
  isPrivateMode: boolean;
  onboardingCompleted: boolean;
  profileType?: UserProfileType;
  geminiApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupMetadata {
  version: number;
  exportedAt: string;
  appVersion: string;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  settings: UserSettings;
  wallets: Wallet[];
  creditCards: CreditCard[];
  debts: Debt[];
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: SubscriptionLeak[];
  savingsGoals: SavingsGoal[];
  quickPresets?: QuickPreset[];
}

// ==========================================
// 7. Resultados del Coach Financiero
// ==========================================

export type MonthHealthStatus = 'peace' | 'alert' | 'risk';

export interface MonthHealthResult {
  status: MonthHealthStatus;
  savingCapacity: number;
  savingCapacityPct: number;
  explanation: string;
}

export interface EmergencyFundResult {
  monthsCovered: number;
  daysCovered: number;
  nextMilestoneMonths: 1 | 3 | 6;
  goalAmount: number;
  progressPct: number;
  explanation: string;
}

export interface AnnualizedLeakResult {
  monthlyEquivalent: number;
  annualCost: number;
  explanation: string;
}

export type PurchaseVerdict = 'safe' | 'warning' | 'danger';

export interface PurchaseSimulationResult {
  verdict: PurchaseVerdict;
  monthlyQuota: number;
  remainingSavingCapacity: number;
  explanation: string;
}

export interface CoachSnapshot {
  netIncome: number;
  vitalMinimum: number;
  debtObligations: number;
  emergencyFundBalance: number;
  spentThisMonth: number;
  totalLeaksAnnual: number;
  dayOfMonth: number;
  daysInMonth?: number;
}

export interface SafeAllowanceSummary {
  profileType: UserProfileType;
  profileLabel: string;
  dailyAllowance: number;
  weeklyAllowance: number;
  daysRemaining: number;
  headlineMessage: string;
}

export interface SpendingDetectiveInsight {
  id: string;
  sourceType: 'category' | 'subscription';
  categoryOrLeakName: string;
  monthlySpend: number;
  suggestedCutAmount: number;
  annualSavings: number;
  daysOfGuacaGained: number;
  debtMonthsSaved: number;
  nequiMessage: string;
}

// ==========================================
// 8. Validación
// ==========================================

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  value?: T;
  error?: string;
}
