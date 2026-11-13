/**
 * Guaca v2: SQLite Repository (Capa de Acceso a Datos)
 * Implementa CRUD completo para las 8 entidades de Guaca,
 * transacciones atómicas con impacto automático en saldos,
 * soporte para deshacer (Undo), paginación segura con escape de LIKE y agregaciones del Coach.
 */

import {
  calculateEmergencyMonths,
  calculateGuiltFreeAvailable,
  calculateSavingCapacity,
  calculateVitalMinimum,
  getMonthHealthStatus,
} from '../domain/coach';
import {
  Budget,
  CreditCard,
  Debt,
  FinancialPillar,
  LeakFrequency,
  QuickPreset,
  SavingsGoal,
  SubscriptionLeak,
  Transaction,
  TransactionType,
  UserProfileType,
  UserSettings,
  VitalBreakdown,
  Wallet,
  WalletType,
} from '../domain/types';
import {
  validateDays,
  validateName,
  validateNonNegativeAmount,
  validatePillar,
  validatePositiveAmount,
  validateTransferWallets,
} from '../domain/validation';
import { roundCOP } from '../utils/formatters';
import {
  BackupImportResult,
  CompleteOnboardingInput,
  CreateQuickPresetInput,
  MonthlyCoachSummary,
  OnboardingResult,
  PaginatedResult,
  SQLiteExecutor,
  TransactionQueryOptions,
  TransactionUndoRecord,
  UpdateQuickPresetInput,
} from './types';

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

export class GuacaRepository {
  constructor(private db: SQLiteExecutor) {}

  // ========================================================
  // 1. User Settings (Singleton id = 1)
  // ========================================================

  async getSettings(): Promise<UserSettings | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM user_settings WHERE id = 1;'
    );
    if (!row) {
      return null;
    }
    return this.mapRowToSettings(row);
  }

  async upsertSettings(
    input: Omit<UserSettings, 'createdAt' | 'updatedAt'>
  ): Promise<UserSettings> {
    const nameValidation = validateName(input.userName, 'El nombre de usuario');
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    const dayValidation = validateDays({ monthStartDay: input.monthStartDay });
    if (!dayValidation.isValid) {
      throw new Error(dayValidation.error);
    }

    const now = new Date().toISOString();
    const existing = await this.getSettings();
    const createdAt = existing?.createdAt ?? now;

    const profileType: UserProfileType =
      input.profileType === 'student' || input.profileType === 'variable'
        ? input.profileType
        : 'salary';

    const trimmedApiKey = input.geminiApiKey?.trim();
    const geminiApiKey = trimmedApiKey && trimmedApiKey.length > 0 ? trimmedApiKey : null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_settings (
        id, user_name, currency, net_monthly_income,
        vital_housing, vital_food, vital_utilities, vital_transport,
        month_start_day, is_private_mode, onboarding_completed,
        profile_type, gemini_api_key,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        1,
        input.userName.trim(),
        'COP',
        roundCOP(input.netMonthlyIncome),
        roundCOP(input.vitalMinimumBreakdown.housing),
        roundCOP(input.vitalMinimumBreakdown.food),
        roundCOP(input.vitalMinimumBreakdown.utilities),
        roundCOP(input.vitalMinimumBreakdown.transport),
        input.monthStartDay ?? 1,
        input.isPrivateMode ? 1 : 0,
        input.onboardingCompleted ? 1 : 0,
        profileType,
        geminiApiKey,
        createdAt,
        now,
      ]
    );

    const saved = await this.getSettings();
    if (!saved) {
      throw new Error('No se pudo guardar la configuración de usuario.');
    }
    return saved;
  }

  async setPrivateMode(isPrivate: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE user_settings SET is_private_mode = ?, updated_at = ? WHERE id = 1;',
      [isPrivate ? 1 : 0, now]
    );
  }

  // ========================================================
  // 2. Wallets (Cuentas y Billeteras)
  // ========================================================

  async createWallet(input: {
    name: string;
    type: WalletType;
    balance?: number;
    icon?: string;
    color?: string;
  }): Promise<Wallet> {
    const nameVal = validateName(input.name, 'El nombre de la cuenta');
    if (!nameVal.isValid) {
      throw new Error(nameVal.error);
    }

    const id = generateId('wal');
    const now = new Date().toISOString();
    const balance = roundCOP(input.balance ?? 0);

    await this.db.runAsync(
      `INSERT INTO wallets (id, name, type, balance, icon, color, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, nameVal.value!, input.type, balance, input.icon ?? null, input.color ?? null, 0, now, now]
    );

    const wallet = await this.getWalletById(id);
    if (!wallet) {
      throw new Error('Error al recuperar la cuenta recién creada.');
    }
    return wallet;
  }

  async listWallets(options?: { includeArchived?: boolean }): Promise<Wallet[]> {
    let sql = 'SELECT * FROM wallets';
    const params: (number | string)[] = [];

    if (!options?.includeArchived) {
      sql += ' WHERE is_archived = 0';
    }
    sql += ' ORDER BY created_at ASC;';

    const rows = await this.db.getAllAsync<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.mapRowToWallet(r));
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM wallets WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToWallet(row) : null;
  }

  async updateWallet(
    id: string,
    input: Partial<Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Wallet> {
    const existing = await this.getWalletById(id);
    if (!existing) {
      throw new Error(`Cuenta con ID ${id} no encontrada.`);
    }

    const name = input.name !== undefined ? validateName(input.name, 'Nombre').value! : existing.name;
    const type = input.type ?? existing.type;
    const balance = input.balance !== undefined ? roundCOP(input.balance) : existing.balance;
    const icon = input.icon !== undefined ? input.icon : existing.icon;
    const color = input.color !== undefined ? input.color : existing.color;
    const isArchived = input.isArchived !== undefined ? (input.isArchived ? 1 : 0) : existing.isArchived ? 1 : 0;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE wallets SET name = ?, type = ?, balance = ?, icon = ?, color = ?, is_archived = ?, updated_at = ?
       WHERE id = ?;`,
      [name, type, balance, icon ?? null, color ?? null, isArchived, now, id]
    );

    const updated = await this.getWalletById(id);
    return updated!;
  }

  async archiveWallet(id: string, isArchived: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE wallets SET is_archived = ?, updated_at = ? WHERE id = ?;',
      [isArchived ? 1 : 0, now, id]
    );
  }

  async deleteWallet(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM wallets WHERE id = ?;', [id]);
  }

  // ========================================================
  // 3. Credit Cards (Tarjetas de Crédito)
  // ========================================================

  async createCreditCard(input: {
    name: string;
    creditLimit: number;
    currentBalance?: number;
    cutoffDay?: number;
    dueDay?: number;
    monthlyRatePct?: number;
  }): Promise<CreditCard> {
    const nameVal = validateName(input.name, 'El nombre de la tarjeta');
    if (!nameVal.isValid) {
      throw new Error(nameVal.error);
    }

    const dayVal = validateDays({ cutoffDay: input.cutoffDay ?? 1, dueDay: input.dueDay ?? 15 });
    if (!dayVal.isValid) {
      throw new Error(dayVal.error);
    }

    const id = generateId('cc');
    const now = new Date().toISOString();
    const limit = roundCOP(input.creditLimit);
    const balance = roundCOP(input.currentBalance ?? 0);

    await this.db.runAsync(
      `INSERT INTO credit_cards (
        id, name, credit_limit, current_balance, cutoff_day, due_day, monthly_rate_pct, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        nameVal.value!,
        limit,
        balance,
        input.cutoffDay ?? 1,
        input.dueDay ?? 15,
        input.monthlyRatePct ?? 0,
        0,
        now,
        now,
      ]
    );

    const card = await this.getCreditCardById(id);
    return card!;
  }

  async listCreditCards(options?: { includeArchived?: boolean }): Promise<CreditCard[]> {
    let sql = 'SELECT * FROM credit_cards';
    if (!options?.includeArchived) {
      sql += ' WHERE is_archived = 0';
    }
    sql += ' ORDER BY created_at ASC;';

    const rows = await this.db.getAllAsync<Record<string, unknown>>(sql);
    return rows.map((r) => this.mapRowToCreditCard(r));
  }

  async getCreditCardById(id: string): Promise<CreditCard | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM credit_cards WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToCreditCard(row) : null;
  }

  async updateCreditCard(
    id: string,
    input: Partial<Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CreditCard> {
    const existing = await this.getCreditCardById(id);
    if (!existing) {
      throw new Error(`Tarjeta con ID ${id} no encontrada.`);
    }

    const name = input.name !== undefined ? validateName(input.name, 'Nombre').value! : existing.name;
    const creditLimit = input.creditLimit !== undefined ? roundCOP(input.creditLimit) : existing.creditLimit;
    const currentBalance = input.currentBalance !== undefined ? roundCOP(input.currentBalance) : existing.currentBalance;
    const cutoffDay = input.cutoffDay ?? existing.cutoffDay;
    const dueDay = input.dueDay ?? existing.dueDay;
    const monthlyRatePct = input.monthlyRatePct !== undefined ? input.monthlyRatePct : existing.monthlyRatePct;
    const isArchived = input.isArchived !== undefined ? (input.isArchived ? 1 : 0) : existing.isArchived ? 1 : 0;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE credit_cards SET
        name = ?, credit_limit = ?, current_balance = ?, cutoff_day = ?, due_day = ?,
        monthly_rate_pct = ?, is_archived = ?, updated_at = ?
       WHERE id = ?;`,
      [name, creditLimit, currentBalance, cutoffDay, dueDay, monthlyRatePct, isArchived, now, id]
    );

    return (await this.getCreditCardById(id))!;
  }

  async archiveCreditCard(id: string, isArchived: boolean): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE credit_cards SET is_archived = ?, updated_at = ? WHERE id = ?;',
      [isArchived ? 1 : 0, now, id]
    );
  }

  async deleteCreditCard(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM credit_cards WHERE id = ?;', [id]);
  }

  // ========================================================
  // 4. Debts (Deudas y Préstamos)
  // ========================================================

  async createDebt(input: {
    name: string;
    creditor: string;
    originalBalance: number;
    remainingBalance?: number;
    minimumMonthlyPayment: number;
    estimatedMonthlyRatePct?: number;
    notes?: string;
  }): Promise<Debt> {
    const nameVal = validateName(input.name, 'El nombre de la deuda');
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const creditorVal = validateName(input.creditor, 'El acreedor');
    if (!creditorVal.isValid) throw new Error(creditorVal.error);

    const id = generateId('debt');
    const now = new Date().toISOString();
    const orig = roundCOP(input.originalBalance);
    const rem = roundCOP(input.remainingBalance ?? input.originalBalance);
    const minPay = roundCOP(input.minimumMonthlyPayment);

    await this.db.runAsync(
      `INSERT INTO debts (
        id, name, creditor, original_balance, remaining_balance, minimum_monthly_payment,
        estimated_monthly_rate_pct, is_paid, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        nameVal.value!,
        creditorVal.value!,
        orig,
        rem,
        minPay,
        input.estimatedMonthlyRatePct ?? 0,
        0,
        input.notes ?? null,
        now,
        now,
      ]
    );

    return (await this.getDebtById(id))!;
  }

  async listDebts(options?: { includePaid?: boolean }): Promise<Debt[]> {
    let sql = 'SELECT * FROM debts';
    if (!options?.includePaid) {
      sql += ' WHERE is_paid = 0';
    }
    sql += ' ORDER BY remaining_balance ASC, created_at ASC;';

    const rows = await this.db.getAllAsync<Record<string, unknown>>(sql);
    return rows.map((r) => this.mapRowToDebt(r));
  }

  async getDebtById(id: string): Promise<Debt | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM debts WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToDebt(row) : null;
  }

  async updateDebt(
    id: string,
    input: Partial<Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Debt> {
    const existing = await this.getDebtById(id);
    if (!existing) throw new Error(`Deuda con ID ${id} no encontrada.`);

    const name = input.name !== undefined ? validateName(input.name, 'Nombre').value! : existing.name;
    const creditor = input.creditor !== undefined ? validateName(input.creditor, 'Acreedor').value! : existing.creditor;
    const originalBalance = input.originalBalance !== undefined ? roundCOP(input.originalBalance) : existing.originalBalance;
    const remainingBalance = input.remainingBalance !== undefined ? roundCOP(input.remainingBalance) : existing.remainingBalance;
    const minPay = input.minimumMonthlyPayment !== undefined ? roundCOP(input.minimumMonthlyPayment) : existing.minimumMonthlyPayment;
    const rate = input.estimatedMonthlyRatePct !== undefined ? input.estimatedMonthlyRatePct : existing.estimatedMonthlyRatePct;
    const isPaid = input.isPaid !== undefined ? (input.isPaid ? 1 : 0) : existing.isPaid ? 1 : 0;
    const notes = input.notes !== undefined ? input.notes : existing.notes;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE debts SET
        name = ?, creditor = ?, original_balance = ?, remaining_balance = ?,
        minimum_monthly_payment = ?, estimated_monthly_rate_pct = ?, is_paid = ?,
        notes = ?, updated_at = ?
       WHERE id = ?;`,
      [name, creditor, originalBalance, remainingBalance, minPay, rate, isPaid, notes ?? null, now, id]
    );

    return (await this.getDebtById(id))!;
  }

  async recordDebtPayment(id: string, paymentAmount: number): Promise<Debt> {
    const amtVal = validatePositiveAmount(paymentAmount, 'El monto del abono');
    if (!amtVal.isValid) throw new Error(amtVal.error);

    const debt = await this.getDebtById(id);
    if (!debt) throw new Error(`Deuda con ID ${id} no encontrada.`);

    const safePayment = amtVal.value!;
    const newRemaining = Math.max(0, debt.remainingBalance - safePayment);
    const isPaid = newRemaining === 0;

    return this.updateDebt(id, {
      remainingBalance: newRemaining,
      isPaid,
    });
  }

  async markDebtAsPaid(id: string, isPaid: boolean): Promise<void> {
    await this.updateDebt(id, {
      isPaid,
      remainingBalance: isPaid ? 0 : undefined,
    });
  }

  async deleteDebt(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM debts WHERE id = ?;', [id]);
  }

  // ========================================================
  // 5. Budgets, Subscriptions & Savings Goals
  // ========================================================

  async upsertBudget(input: {
    categoryId: string;
    monthlyLimit: number;
    spentThisMonth?: number;
  }): Promise<Budget> {
    const existing = await this.getBudgetByCategory(input.categoryId);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.runAsync(
        'UPDATE budgets SET monthly_limit = ?, spent_this_month = ?, updated_at = ? WHERE id = ?;',
        [
          roundCOP(input.monthlyLimit),
          roundCOP(input.spentThisMonth ?? existing.spentThisMonth),
          now,
          existing.id,
        ]
      );
      return (await this.getBudgetByCategory(input.categoryId))!;
    }

    const id = generateId('bud');
    await this.db.runAsync(
      'INSERT INTO budgets (id, category_id, monthly_limit, spent_this_month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
      [id, input.categoryId, roundCOP(input.monthlyLimit), roundCOP(input.spentThisMonth ?? 0), now, now]
    );

    return (await this.getBudgetByCategory(input.categoryId))!;
  }

  async listBudgets(monthKey?: string): Promise<Budget[]> {
    const targetMonth = monthKey || new Date().toISOString().substring(0, 7);
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM budgets ORDER BY category_id ASC;'
    );

    const spentRows = await this.db.getAllAsync<{ category_id: string; total: number }>(
      'SELECT category_id, COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ? GROUP BY category_id;',
      ['expense', `${targetMonth}-01`, `${targetMonth}-31T23:59:59.999Z`]
    );
    const spentMap = new Map<string, number>();
    for (const r of spentRows) {
      if (r.category_id) {
        spentMap.set(r.category_id, r.total);
      }
    }

    return rows.map((r) => {
      const b = this.mapRowToBudget(r);
      return {
        ...b,
        spentThisMonth: spentMap.get(b.categoryId) ?? 0,
      };
    });
  }

  async getBudgetByCategory(categoryId: string): Promise<Budget | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM budgets WHERE category_id = ?;',
      [categoryId]
    );
    return row ? this.mapRowToBudget(row) : null;
  }

  async deleteBudget(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
  }

  async createSubscription(input: {
    name: string;
    amount: number;
    frequency: LeakFrequency;
    walletId?: string;
    categoryId?: string;
  }): Promise<SubscriptionLeak> {
    const nameVal = validateName(input.name, 'El nombre de la suscripción');
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const id = generateId('sub');
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO subscriptions (
        id, name, amount, frequency, wallet_id, category_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, nameVal.value!, roundCOP(input.amount), input.frequency, input.walletId ?? null, input.categoryId ?? null, 1, now, now]
    );

    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM subscriptions WHERE id = ?;',
      [id]
    );
    return this.mapRowToSubscription(row!);
  }

  async listSubscriptions(options?: { activeOnly?: boolean }): Promise<SubscriptionLeak[]> {
    let sql = 'SELECT * FROM subscriptions';
    if (options?.activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY amount DESC, created_at ASC;';

    const rows = await this.db.getAllAsync<Record<string, unknown>>(sql);
    return rows.map((r) => this.mapRowToSubscription(r));
  }

  async updateSubscription(
    id: string,
    input: Partial<Omit<SubscriptionLeak, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<SubscriptionLeak> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM subscriptions WHERE id = ?;',
      [id]
    );
    if (!row) throw new Error(`Suscripción con ID ${id} no encontrada.`);
    const existing = this.mapRowToSubscription(row);

    const name = input.name !== undefined ? validateName(input.name, 'Nombre').value! : existing.name;
    const amount = input.amount !== undefined ? roundCOP(input.amount) : existing.amount;
    const frequency = input.frequency ?? existing.frequency;
    const walletId = input.walletId !== undefined ? input.walletId : existing.walletId;
    const categoryId = input.categoryId !== undefined ? input.categoryId : existing.categoryId;
    const isActive = input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive ? 1 : 0;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE subscriptions SET
        name = ?, amount = ?, frequency = ?, wallet_id = ?, category_id = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [name, amount, frequency, walletId ?? null, categoryId ?? null, isActive, now, id]
    );

    const updatedRow = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM subscriptions WHERE id = ?;',
      [id]
    );
    return this.mapRowToSubscription(updatedRow!);
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM subscriptions WHERE id = ?;', [id]);
  }

  async createSavingsGoal(input: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    icon?: string;
  }): Promise<SavingsGoal> {
    const nameVal = validateName(input.name, 'El nombre de la meta');
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const id = generateId('goal');
    const now = new Date().toISOString();
    const target = roundCOP(input.targetAmount);
    const current = roundCOP(input.currentAmount ?? 0);
    const isCompleted = current >= target ? 1 : 0;

    await this.db.runAsync(
      `INSERT INTO savings_goals (
        id, name, target_amount, current_amount, target_date, icon, is_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, nameVal.value!, target, current, input.targetDate ?? null, input.icon ?? null, isCompleted, now, now]
    );

    const goal = await this.getSavingsGoalById(id);
    return goal!;
  }

  async listSavingsGoals(): Promise<SavingsGoal[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM savings_goals ORDER BY is_completed ASC, created_at ASC;'
    );
    return rows.map((r) => this.mapRowToSavingsGoal(r));
  }

  async getSavingsGoalById(id: string): Promise<SavingsGoal | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM savings_goals WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToSavingsGoal(row) : null;
  }

  async contributeToSavingsGoal(id: string, amount: number): Promise<SavingsGoal> {
    const amtVal = validatePositiveAmount(amount, 'El monto del aporte');
    if (!amtVal.isValid) throw new Error(amtVal.error);

    const goal = await this.getSavingsGoalById(id);
    if (!goal) throw new Error(`Meta con ID ${id} no encontrada.`);

    const safeAmount = amtVal.value!;
    const newCurrent = goal.currentAmount + safeAmount;
    const isCompleted = newCurrent >= goal.targetAmount;

    return this.updateSavingsGoal(id, {
      currentAmount: newCurrent,
      isCompleted,
    });
  }

  async updateSavingsGoal(
    id: string,
    input: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<SavingsGoal> {
    const existing = await this.getSavingsGoalById(id);
    if (!existing) throw new Error(`Meta con ID ${id} no encontrada.`);

    const name = input.name !== undefined ? validateName(input.name, 'Nombre').value! : existing.name;
    const target = input.targetAmount !== undefined ? roundCOP(input.targetAmount) : existing.targetAmount;
    const current = input.currentAmount !== undefined ? roundCOP(input.currentAmount) : existing.currentAmount;
    const targetDate = input.targetDate !== undefined ? input.targetDate : existing.targetDate;
    const icon = input.icon !== undefined ? input.icon : existing.icon;
    const isCompleted = input.isCompleted !== undefined ? (input.isCompleted ? 1 : 0) : current >= target ? 1 : 0;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE savings_goals SET
        name = ?, target_amount = ?, current_amount = ?, target_date = ?, icon = ?, is_completed = ?, updated_at = ?
       WHERE id = ?;`,
      [name, target, current, targetDate ?? null, icon ?? null, isCompleted, now, id]
    );

    return (await this.getSavingsGoalById(id))!;
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM savings_goals WHERE id = ?;', [id]);
  }

  // ========================================================
  // 6. Transactions & Atomic Balance Handling
  // ========================================================

  async createTransaction(input: {
    amount: number;
    type: TransactionType;
    pillar: FinancialPillar;
    walletId: string;
    destinationWalletId?: string;
    categoryId?: string;
    date?: string;
    note?: string;
  }): Promise<Transaction> {
    const amtVal = validatePositiveAmount(input.amount, 'El monto');
    if (!amtVal.isValid) throw new Error(amtVal.error);

    if (input.type === 'transfer') {
      const transferVal = validateTransferWallets(input.walletId, input.destinationWalletId);
      if (!transferVal.isValid) throw new Error(transferVal.error);

      const sourceWallet = await this.getWalletById(input.walletId);
      if (!sourceWallet) throw new Error('La cuenta de origen no existe.');

      const destWallet = await this.getWalletById(input.destinationWalletId!);
      if (!destWallet) throw new Error('La cuenta de destino no existe.');
    }

    const id = generateId('tx');
    const now = new Date().toISOString();
    const date = input.date ?? now;
    const amount = amtVal.value!;

    await this.db.withTransactionAsync(async () => {
      // 1. Aplicar impacto en saldo
      if (input.type === 'expense') {
        const isCard = await this.isCreditCard(input.walletId);
        if (isCard) {
          await this.db.runAsync(
            'UPDATE credit_cards SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?;',
            [amount, now, input.walletId]
          );
        } else {
          await this.db.runAsync(
            'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
            [amount, now, input.walletId]
          );
        }
      } else if (input.type === 'income') {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
          [amount, now, input.walletId]
        );
      } else if (input.type === 'transfer') {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
          [amount, now, input.walletId]
        );
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
          [amount, now, input.destinationWalletId!]
        );
      }

      // 2. Insertar movimiento
      await this.db.runAsync(
        `INSERT INTO transactions (
          id, amount, type, pillar, wallet_id, destination_wallet_id, category_id, date, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          amount,
          input.type,
          input.pillar,
          input.walletId,
          input.destinationWalletId ?? null,
          input.categoryId ?? null,
          date,
          input.note ?? null,
          now,
        ]
      );
    });

    const tx = await this.getTransactionById(id);
    return tx!;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToTransaction(row) : null;
  }

  async deleteTransaction(id: string): Promise<TransactionUndoRecord> {
    const tx = await this.getTransactionById(id);
    if (!tx) throw new Error(`Movimiento con ID ${id} no encontrado.`);

    let undoRecord!: TransactionUndoRecord;
    const now = new Date().toISOString();

    await this.db.withTransactionAsync(async () => {
      const isCard = await this.isCreditCard(tx.walletId);

      let prevBalance = 0;
      let newBalance = 0;
      let prevDestBalance: number | undefined;
      let newDestBalance: number | undefined;

      // Revertir impacto
      if (tx.type === 'expense') {
        if (isCard) {
          const card = await this.getCreditCardById(tx.walletId);
          prevBalance = card?.currentBalance ?? 0;
          newBalance = Math.max(0, prevBalance - tx.amount);
          await this.db.runAsync(
            'UPDATE credit_cards SET current_balance = ?, updated_at = ? WHERE id = ?;',
            [newBalance, now, tx.walletId]
          );
        } else {
          const wallet = await this.getWalletById(tx.walletId);
          prevBalance = wallet?.balance ?? 0;
          newBalance = prevBalance + tx.amount;
          await this.db.runAsync(
            'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?;',
            [newBalance, now, tx.walletId]
          );
        }
      } else if (tx.type === 'income') {
        const wallet = await this.getWalletById(tx.walletId);
        prevBalance = wallet?.balance ?? 0;
        newBalance = prevBalance - tx.amount;
        await this.db.runAsync(
          'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?;',
          [newBalance, now, tx.walletId]
        );
      } else if (tx.type === 'transfer') {
        const source = await this.getWalletById(tx.walletId);
        const dest = tx.destinationWalletId ? await this.getWalletById(tx.destinationWalletId) : null;

        prevBalance = source?.balance ?? 0;
        newBalance = prevBalance + tx.amount;
        prevDestBalance = dest?.balance ?? 0;
        newDestBalance = prevDestBalance - tx.amount;

        await this.db.runAsync(
          'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?;',
          [newBalance, now, tx.walletId]
        );
        if (tx.destinationWalletId) {
          await this.db.runAsync(
            'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?;',
            [newDestBalance, now, tx.destinationWalletId]
          );
        }
      }

      await this.db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);

      undoRecord = {
        transaction: tx,
        affectedWalletId: tx.walletId,
        previousWalletBalance: prevBalance,
        newWalletBalance: newBalance,
        affectedDestinationWalletId: tx.destinationWalletId,
        previousDestinationWalletBalance: prevDestBalance,
        newDestinationWalletBalance: newDestBalance,
        isCreditCard: isCard,
      };
    });

    return undoRecord;
  }

  async restoreTransactionSnapshot(undo: TransactionUndoRecord): Promise<void> {
    const tx = undo.transaction;
    const now = new Date().toISOString();

    await this.db.withTransactionAsync(async () => {
      // 1. Re-insertar transacción
      await this.db.runAsync(
        `INSERT INTO transactions (
          id, amount, type, pillar, wallet_id, destination_wallet_id, category_id, date, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          tx.id,
          tx.amount,
          tx.type,
          tx.pillar,
          tx.walletId,
          tx.destinationWalletId ?? null,
          tx.categoryId ?? null,
          tx.date,
          tx.note ?? null,
          tx.createdAt,
        ]
      );

      // 2. Re-aplicar saldo
      if (tx.type === 'expense') {
        if (undo.isCreditCard) {
          await this.db.runAsync(
            'UPDATE credit_cards SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?;',
            [tx.amount, now, tx.walletId]
          );
        } else {
          await this.db.runAsync(
            'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
            [tx.amount, now, tx.walletId]
          );
        }
      } else if (tx.type === 'income') {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
          [tx.amount, now, tx.walletId]
        );
      } else if (tx.type === 'transfer') {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
          [tx.amount, now, tx.walletId]
        );
        if (tx.destinationWalletId) {
          await this.db.runAsync(
            'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
            [tx.amount, now, tx.destinationWalletId]
          );
        }
      }
    });
  }

  async updateTransaction(
    id: string,
    updates: Partial<Pick<Transaction, 'amount' | 'type' | 'pillar' | 'walletId' | 'destinationWalletId' | 'categoryId' | 'date' | 'note'>>
  ): Promise<Transaction> {
    const existing = await this.getTransactionById(id);
    if (!existing) throw new Error(`Movimiento con ID ${id} no encontrado.`);

    if (updates.amount !== undefined) {
      const amtVal = validatePositiveAmount(updates.amount, 'El monto');
      if (!amtVal.isValid) throw new Error(amtVal.error);
    }

    const newAmount = updates.amount !== undefined ? roundCOP(updates.amount) : existing.amount;
    const newType = updates.type ?? existing.type;
    const newPillar = updates.pillar ?? existing.pillar;
    const newWalletId = updates.walletId ?? existing.walletId;
    const newDestId = updates.destinationWalletId !== undefined ? updates.destinationWalletId : existing.destinationWalletId;
    const newCategoryId = updates.categoryId !== undefined ? updates.categoryId : existing.categoryId;
    const newDate = updates.date ?? existing.date;
    const newNote = updates.note !== undefined ? updates.note : existing.note;

    if (newType === 'transfer') {
      const val = validateTransferWallets(newWalletId, newDestId);
      if (!val.isValid) throw new Error(val.error);

      const sourceWallet = await this.getWalletById(newWalletId);
      if (!sourceWallet) throw new Error('La cuenta de origen no existe.');

      const destWallet = await this.getWalletById(newDestId!);
      if (!destWallet) throw new Error('La cuenta de destino no existe.');
    }

    await this.db.withTransactionAsync(async () => {
      // Revertir impacto anterior
      await this.revertBalanceImpact(existing);
      // Aplicar nuevo impacto
      await this.applyBalanceImpact({
        amount: newAmount,
        type: newType,
        walletId: newWalletId,
        destinationWalletId: newDestId,
      });

      // Actualizar registro
      await this.db.runAsync(
        `UPDATE transactions SET
          amount = ?, type = ?, pillar = ?, wallet_id = ?, destination_wallet_id = ?,
          category_id = ?, date = ?, note = ?
         WHERE id = ?;`,
        [newAmount, newType, newPillar, newWalletId, newDestId ?? null, newCategoryId ?? null, newDate, newNote ?? null, id]
      );
    });

    return (await this.getTransactionById(id))!;
  }

  async listAllTransactions(): Promise<Transaction[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM transactions ORDER BY date DESC, created_at DESC;'
    );
    return rows.map((r) => this.mapRowToTransaction(r));
  }

  async listTransactions(options?: TransactionQueryOptions): Promise<PaginatedResult<Transaction>> {
    const limit = Math.min(100, Math.max(1, options?.limit ?? 30));
    const offset = Math.max(0, options?.offset ?? 0);

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options?.type) {
      conditions.push('type = ?');
      params.push(options.type);
    }
    if (options?.pillar) {
      conditions.push('pillar = ?');
      params.push(options.pillar);
    }
    if (options?.walletId) {
      conditions.push('wallet_id = ?');
      params.push(options.walletId);
    }
    if (options?.monthKey) {
      conditions.push('date LIKE ? ESCAPE \'\\\'');
      params.push(`${options.monthKey}%`);
    }
    if (options?.startDate) {
      conditions.push('date >= ?');
      params.push(options.startDate);
    }
    if (options?.endDate) {
      conditions.push('date <= ?');
      params.push(options.endDate);
    }
    if (options?.search && options.search.trim() !== '') {
      // Escape seguro de caracteres comodín SQL % y _
      const escaped = options.search.trim().replace(/[%_\\]/g, '\\$&');
      conditions.push('(note LIKE ? ESCAPE \'\\\' OR category_id LIKE ? ESCAPE \'\\\')');
      params.push(`%${escaped}%`);
      params.push(`%${escaped}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) as total FROM transactions ${whereClause};`;
    const countRow = await this.db.getFirstAsync<{ total: number }>(countSql, [...params]);
    const totalCount = countRow?.total ?? 0;

    // Paginated items
    const querySql = `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?;`;
    const rows = await this.db.getAllAsync<Record<string, unknown>>(querySql, [...params, limit, offset]);

    const items = rows.map((r) => this.mapRowToTransaction(r));

    return {
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
      limit,
      offset,
    };
  }

  // ========================================================
  // 7. Onboarding & Monthly Coach Aggregations
  // ========================================================

  async completeOnboarding(input: CompleteOnboardingInput): Promise<OnboardingResult> {
    let createdWallet: Wallet | null = null;
    let savedSettings!: UserSettings;

    await this.db.withTransactionAsync(async () => {
      // 1. Guardar settings con onboardingCompleted: true
      savedSettings = await this.upsertSettings({
        userName: input.userName,
        currency: 'COP',
        netMonthlyIncome: input.netMonthlyIncome,
        vitalMinimumBreakdown: input.vitalBreakdown,
        monthStartDay: input.monthStartDay ?? 1,
        isPrivateMode: false,
        onboardingCompleted: true,
        profileType: input.profileType ?? 'salary',
      });

      // 2. Crear billetera inicial si se proporciona
      if (input.initialWalletName && input.initialWalletName.trim() !== '') {
        const id = generateId('wal');
        const now = new Date().toISOString();
        const balance = roundCOP(input.initialWalletBalance ?? 0);
        const type = input.initialWalletType ?? 'bank';

        await this.db.runAsync(
          `INSERT INTO wallets (id, name, type, balance, icon, color, is_archived, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [id, input.initialWalletName.trim(), type, balance, 'wallet', '#0B6B53', 0, now, now]
        );

        createdWallet = await this.getWalletById(id);
      }

      // 3. Crear presupuestos semilla si se solicita
      if (input.seedBudgets) {
        const pillars = [
          { categoryId: 'vivienda', limit: input.vitalBreakdown.housing },
          { categoryId: 'mercado', limit: input.vitalBreakdown.food },
          { categoryId: 'servicios', limit: input.vitalBreakdown.utilities },
          { categoryId: 'transporte', limit: input.vitalBreakdown.transport },
        ];

        for (const p of pillars) {
          if (p.limit > 0) {
            await this.upsertBudget({
              categoryId: p.categoryId,
              monthlyLimit: p.limit,
            });
          }
        }
      }

      // 4. Crear presets iniciales
      if (input.initialPresets && input.initialPresets.length > 0) {
        for (const preset of input.initialPresets) {
          await this.createQuickPreset(preset);
        }
        // Asegurar que exista al menos un atajo de ingreso sin duplicar
        const hasIncomePreset = input.initialPresets.some((p) => p.type === 'income');
        if (!hasIncomePreset) {
          await this.createQuickPreset({
            name: 'Me enviaron plata',
            type: 'income',
            defaultAmount: 0,
            pillar: 'income',
            categoryId: 'me_enviaron',
            icon: 'ArrowDownLeft',
          });
        }
      } else {
        // Presets base útiles por defecto
        const defaultPresets: CreateQuickPresetInput[] = [
          { name: 'Comidas', type: 'expense', defaultAmount: 0, pillar: 'leisure', categoryId: 'comidas', icon: 'Coffee' },
          { name: 'Transporte', type: 'expense', defaultAmount: 0, pillar: 'vital', categoryId: 'transporte', icon: 'Bus' },
          { name: 'Me enviaron plata', type: 'income', defaultAmount: 0, pillar: 'income', categoryId: 'me_enviaron', icon: 'ArrowDownLeft' },
          { name: 'Mercado', type: 'expense', defaultAmount: 0, pillar: 'vital', categoryId: 'mercado', icon: 'ShoppingCart' },
        ];
        for (const preset of defaultPresets) {
          await this.createQuickPreset(preset);
        }
      }
    });

    return {
      settings: savedSettings,
      wallet: createdWallet,
    };
  }

  async getMonthlyCoachSummary(monthKey: string): Promise<MonthlyCoachSummary> {
    const settings = await this.getSettings();
    const netIncome = settings?.netMonthlyIncome ?? 0;
    const vitalMin = settings ? calculateVitalMinimum(settings.vitalMinimumBreakdown) : 0;

    // 1. Ingresos del mes
    const incomeRow = await this.db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?;',
      ['income', `${monthKey}-01`, `${monthKey}-31T23:59:59.999Z`]
    );
    const totalIncome = incomeRow?.total ?? 0;

    // 2. Gastos por pilar
    const expenseRows = await this.db.getAllAsync<{ pillar: string; total: number }>(
      'SELECT pillar, COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ? GROUP BY pillar;',
      ['expense', `${monthKey}-01`, `${monthKey}-31T23:59:59.999Z`]
    );

    let vitalSpent = 0;
    let growthSpent = 0;
    let leisureSpent = 0;
    let debtSpent = 0;

    for (const r of expenseRows) {
      if (r.pillar === 'vital') vitalSpent = r.total;
      else if (r.pillar === 'growth') growthSpent = r.total;
      else if (r.pillar === 'leisure') leisureSpent = r.total;
      else if (r.pillar === 'debt') debtSpent = r.total;
    }
    const totalExpenses = vitalSpent + growthSpent + leisureSpent + debtSpent;

    // 3. Liquidez total y Fondo de Emergencia (bóveda)
    const wallets = await this.listWallets();
    let totalLiquidity = 0;
    let emergencyFundBalance = 0;

    for (const w of wallets) {
      if (!w.isArchived) {
        totalLiquidity += w.balance;
        if (w.type === 'vault') {
          emergencyFundBalance += w.balance;
        }
      }
    }

    // 4. Deudas activas y cuotas mínimas
    const debtSummaryRow = await this.db.getFirstAsync<{ totalDebt: number; totalMinPayment: number }>(
      'SELECT COALESCE(SUM(remaining_balance), 0) as totalDebt, COALESCE(SUM(minimum_monthly_payment), 0) as totalMinPayment FROM debts WHERE is_paid = 0;'
    );
    const activeDebtsTotal = debtSummaryRow?.totalDebt ?? 0;
    const activeDebtsMinPayment = debtSummaryRow?.totalMinPayment ?? 0;

    // 5. Cálculos del Coach de Dominio
    const effectiveIncome = Math.max(netIncome, totalIncome);
    const savingCapacity = calculateSavingCapacity({
      netIncome: effectiveIncome,
      vitalMinimum: vitalMin,
      debtObligations: activeDebtsMinPayment,
    });

    const nonVitalSpent = growthSpent + leisureSpent;
    const guiltFreeAvailable = calculateGuiltFreeAvailable({
      netIncome: effectiveIncome,
      vitalMinimum: vitalMin,
      debtObligations: activeDebtsMinPayment,
      nonVitalSpentThisMonth: nonVitalSpent,
    });

    const healthStatus = getMonthHealthStatus({
      netIncome: effectiveIncome,
      vitalMinimum: vitalMin,
      savingCapacity,
      debtObligations: activeDebtsMinPayment,
    });

    const emergencyFund = calculateEmergencyMonths({
      emergencyFundBalance,
      vitalMinimum: vitalMin,
    });

    return {
      monthKey,
      totalIncome: effectiveIncome,
      vitalSpent,
      growthSpent,
      leisureSpent,
      debtSpent,
      totalExpenses,
      totalLiquidity,
      emergencyFundBalance,
      activeDebtsTotal,
      activeDebtsMinPayment,
      vitalMinimum: vitalMin,
      savingCapacity,
      guiltFreeAvailable,
      healthStatus,
      emergencyFund,
    };
  }

  // ========================================================
  // 8. Quick Presets (Botones Rápidos)
  // ========================================================

  async listQuickPresets(): Promise<QuickPreset[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM quick_presets ORDER BY created_at ASC;'
    );
    return rows.map((r) => this.mapRowToQuickPreset(r));
  }

  async getQuickPresetById(id: string): Promise<QuickPreset | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM quick_presets WHERE id = ?;',
      [id]
    );
    return row ? this.mapRowToQuickPreset(row) : null;
  }

  async createQuickPreset(input: CreateQuickPresetInput): Promise<QuickPreset> {
    const nameVal = validateName(input.name, 'El nombre del botón rápido');
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const amountVal = validateNonNegativeAmount(
      input.defaultAmount ?? 0,
      'El monto predeterminado'
    );
    if (!amountVal.isValid) throw new Error(amountVal.error);

    const pillarVal = validatePillar(input.pillar);
    if (!pillarVal.isValid) throw new Error(pillarVal.error);

    if (input.type !== 'expense' && input.type !== 'income') {
      throw new Error('El tipo debe ser "expense" o "income".');
    }

    if (!input.categoryId || input.categoryId.trim() === '') {
      throw new Error('Debes asociar una categoría válida al botón rápido.');
    }

    const id = input.id || generateId('preset');
    const now = new Date().toISOString();
    const defaultAmount = amountVal.value ?? 0;

    await this.db.runAsync(
      `INSERT INTO quick_presets (
        id, name, type, default_amount, pillar, category_id, icon, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        nameVal.value!,
        input.type,
        defaultAmount,
        pillarVal.value!,
        input.categoryId.trim(),
        input.icon ?? null,
        now,
        now,
      ]
    );

    const created = await this.getQuickPresetById(id);
    if (!created) throw new Error('No se pudo crear el botón rápido.');
    return created;
  }

  async updateQuickPreset(
    id: string,
    partial: UpdateQuickPresetInput
  ): Promise<QuickPreset> {
    const existing = await this.getQuickPresetById(id);
    if (!existing) throw new Error('El botón rápido no existe.');

    const name = partial.name !== undefined ? partial.name : existing.name;
    const nameVal = validateName(name, 'El nombre del botón rápido');
    if (!nameVal.isValid) throw new Error(nameVal.error);

    const defaultAmount =
      partial.defaultAmount !== undefined ? partial.defaultAmount : existing.defaultAmount;
    const amountVal = validateNonNegativeAmount(defaultAmount, 'El monto predeterminado');
    if (!amountVal.isValid) throw new Error(amountVal.error);

    const pillar = partial.pillar !== undefined ? partial.pillar : existing.pillar;
    const pillarVal = validatePillar(pillar);
    if (!pillarVal.isValid) throw new Error(pillarVal.error);

    const type = partial.type !== undefined ? partial.type : existing.type;
    if (type !== 'expense' && type !== 'income') {
      throw new Error('El tipo debe ser "expense" o "income".');
    }

    const categoryId =
      partial.categoryId !== undefined ? partial.categoryId.trim() : existing.categoryId;
    if (!categoryId) {
      throw new Error('Debes asociar una categoría válida al botón rápido.');
    }

    const icon = partial.icon !== undefined ? partial.icon : existing.icon;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `UPDATE quick_presets SET
        name = ?, type = ?, default_amount = ?, pillar = ?, category_id = ?, icon = ?, updated_at = ?
      WHERE id = ?;`,
      [
        nameVal.value!,
        type,
        amountVal.value!,
        pillarVal.value!,
        categoryId,
        icon ?? null,
        now,
        id,
      ]
    );

    const updated = await this.getQuickPresetById(id);
    if (!updated) throw new Error('No se pudo actualizar el botón rápido.');
    return updated;
  }

  async deleteQuickPreset(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM quick_presets WHERE id = ?;', [id]);
  }

  // ========================================================
  // Helpers Privados de Mapeo y Balance
  // ========================================================

  private async isCreditCard(id: string): Promise<boolean> {
    const card = await this.getCreditCardById(id);
    return card !== null;
  }

  private async revertBalanceImpact(tx: Transaction): Promise<void> {
    const now = new Date().toISOString();
    const isCard = await this.isCreditCard(tx.walletId);

    if (tx.type === 'expense') {
      if (isCard) {
        await this.db.runAsync(
          'UPDATE credit_cards SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?;',
          [tx.amount, now, tx.walletId]
        );
      } else {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
          [tx.amount, now, tx.walletId]
        );
      }
    } else if (tx.type === 'income') {
      await this.db.runAsync(
        'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
        [tx.amount, now, tx.walletId]
      );
    } else if (tx.type === 'transfer') {
      await this.db.runAsync(
        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
        [tx.amount, now, tx.walletId]
      );
      if (tx.destinationWalletId) {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
          [tx.amount, now, tx.destinationWalletId]
        );
      }
    }
  }

  private async applyBalanceImpact(params: {
    amount: number;
    type: TransactionType;
    walletId: string;
    destinationWalletId?: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    const isCard = await this.isCreditCard(params.walletId);

    if (params.type === 'expense') {
      if (isCard) {
        await this.db.runAsync(
          'UPDATE credit_cards SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?;',
          [params.amount, now, params.walletId]
        );
      } else {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
          [params.amount, now, params.walletId]
        );
      }
    } else if (params.type === 'income') {
      await this.db.runAsync(
        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
        [params.amount, now, params.walletId]
      );
    } else if (params.type === 'transfer') {
      await this.db.runAsync(
        'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE id = ?;',
        [params.amount, now, params.walletId]
      );
      if (params.destinationWalletId) {
        await this.db.runAsync(
          'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE id = ?;',
          [params.amount, now, params.destinationWalletId]
        );
      }
    }
  }

  private mapRowToSettings(row: Record<string, unknown>): UserSettings {
    const breakdown: VitalBreakdown = {
      housing: (row['vital_housing'] as number) || 0,
      food: (row['vital_food'] as number) || 0,
      utilities: (row['vital_utilities'] as number) || 0,
      transport: (row['vital_transport'] as number) || 0,
    };

    const apiKeyVal = row['gemini_api_key'];
    const geminiApiKey =
      typeof apiKeyVal === 'string' && apiKeyVal.trim().length > 0
        ? apiKeyVal.trim()
        : undefined;

    return {
      userName: (row['user_name'] as string) || '',
      currency: 'COP',
      netMonthlyIncome: (row['net_monthly_income'] as number) || 0,
      vitalMinimumBreakdown: breakdown,
      monthStartDay: (row['month_start_day'] as number) || 1,
      isPrivateMode: row['is_private_mode'] === 1,
      onboardingCompleted: row['onboarding_completed'] === 1,
      profileType: ((row['profile_type'] as UserProfileType) || 'salary'),
      geminiApiKey,
      createdAt: (row['created_at'] as string) || '',
      updatedAt: (row['updated_at'] as string) || '',
    };
  }

  private mapRowToWallet(row: Record<string, unknown>): Wallet {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      type: row['type'] as WalletType,
      balance: (row['balance'] as number) || 0,
      icon: (row['icon'] as string) || undefined,
      color: (row['color'] as string) || undefined,
      isArchived: row['is_archived'] === 1,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToCreditCard(row: Record<string, unknown>): CreditCard {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      creditLimit: (row['credit_limit'] as number) || 0,
      currentBalance: (row['current_balance'] as number) || 0,
      cutoffDay: (row['cutoff_day'] as number) || 1,
      dueDay: (row['due_day'] as number) || 15,
      monthlyRatePct: (row['monthly_rate_pct'] as number) || 0,
      isArchived: row['is_archived'] === 1,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToDebt(row: Record<string, unknown>): Debt {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      creditor: row['creditor'] as string,
      originalBalance: (row['original_balance'] as number) || 0,
      remainingBalance: (row['remaining_balance'] as number) || 0,
      minimumMonthlyPayment: (row['minimum_monthly_payment'] as number) || 0,
      estimatedMonthlyRatePct: (row['estimated_monthly_rate_pct'] as number) || 0,
      isPaid: row['is_paid'] === 1,
      notes: (row['notes'] as string) || undefined,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToTransaction(row: Record<string, unknown>): Transaction {
    return {
      id: row['id'] as string,
      amount: row['amount'] as number,
      type: row['type'] as TransactionType,
      pillar: row['pillar'] as FinancialPillar,
      walletId: row['wallet_id'] as string,
      destinationWalletId: (row['destination_wallet_id'] as string) || undefined,
      categoryId: (row['category_id'] as string) || undefined,
      date: row['date'] as string,
      note: (row['note'] as string) || undefined,
      createdAt: row['created_at'] as string,
    };
  }

  private mapRowToBudget(row: Record<string, unknown>): Budget {
    return {
      id: row['id'] as string,
      categoryId: row['category_id'] as string,
      monthlyLimit: (row['monthly_limit'] as number) || 0,
      spentThisMonth: (row['spent_this_month'] as number) || 0,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToSubscription(row: Record<string, unknown>): SubscriptionLeak {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      amount: (row['amount'] as number) || 0,
      frequency: row['frequency'] as LeakFrequency,
      walletId: (row['wallet_id'] as string) || undefined,
      categoryId: (row['category_id'] as string) || undefined,
      isActive: row['is_active'] === 1,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToSavingsGoal(row: Record<string, unknown>): SavingsGoal {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      targetAmount: (row['target_amount'] as number) || 0,
      currentAmount: (row['current_amount'] as number) || 0,
      targetDate: (row['target_date'] as string) || undefined,
      icon: (row['icon'] as string) || undefined,
      isCompleted: row['is_completed'] === 1,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }

  private mapRowToQuickPreset(row: Record<string, unknown>): QuickPreset {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      type: row['type'] as 'expense' | 'income',
      defaultAmount: (row['default_amount'] as number) || 0,
      pillar: row['pillar'] as FinancialPillar,
      categoryId: row['category_id'] as string,
      icon: (row['icon'] as string) || undefined,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
    };
  }
}
