/**
 * Guaca v2: SQLite Schema & Migrations
 * Define la estructura de las 8 tablas principales, activación de WAL, foreign keys,
 * migración versionada mediante PRAGMA user_version e índices de alto rendimiento.
 */

import { SQLiteExecutor } from './types';

export const SCHEMA_VERSION = 1;

export const TABLE_NAMES = [
  'user_settings',
  'wallets',
  'credit_cards',
  'debts',
  'transactions',
  'budgets',
  'subscriptions',
  'savings_goals',
  'quick_presets',
] as const;

export const INDEX_NAMES = [
  'idx_transactions_date',
  'idx_transactions_date_created',
  'idx_transactions_wallet_id',
  'idx_transactions_dest_wallet_id',
  'idx_transactions_pillar',
  'idx_transactions_type',
  'idx_transactions_category',
  'idx_budgets_category',
  'idx_debts_is_paid',
  'idx_subscriptions_is_active',
  'idx_savings_goals_is_completed',
  'idx_quick_presets_type',
] as const;

/**
 * Script DDL de creación de tablas de la versión 1.
 */
const V1_SCHEMA_DDL = `
  -- 1. Configuración de Usuario (Fila Singleton id = 1)
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    user_name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    net_monthly_income INTEGER NOT NULL DEFAULT 0,
    vital_housing INTEGER NOT NULL DEFAULT 0,
    vital_food INTEGER NOT NULL DEFAULT 0,
    vital_utilities INTEGER NOT NULL DEFAULT 0,
    vital_transport INTEGER NOT NULL DEFAULT 0,
    month_start_day INTEGER NOT NULL DEFAULT 1 CHECK (month_start_day BETWEEN 1 AND 28),
    is_private_mode INTEGER NOT NULL DEFAULT 0 CHECK (is_private_mode IN (0, 1)),
    onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1)),
    profile_type TEXT NOT NULL DEFAULT 'salary',
    gemini_api_key TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 2. Cuentas y Billeteras (Efectivo, Banco, Digital, Bóveda)
  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'digital', 'vault')),
    balance INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    color TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 3. Tarjetas de Crédito
  CREATE TABLE IF NOT EXISTS credit_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credit_limit INTEGER NOT NULL DEFAULT 0,
    current_balance INTEGER NOT NULL DEFAULT 0,
    cutoff_day INTEGER NOT NULL DEFAULT 1 CHECK (cutoff_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL DEFAULT 15 CHECK (due_day BETWEEN 1 AND 31),
    monthly_rate_pct REAL NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 4. Deudas y Préstamos
  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    creditor TEXT NOT NULL,
    original_balance INTEGER NOT NULL DEFAULT 0,
    remaining_balance INTEGER NOT NULL DEFAULT 0,
    minimum_monthly_payment INTEGER NOT NULL DEFAULT 0,
    estimated_monthly_rate_pct REAL NOT NULL DEFAULT 0,
    is_paid INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0, 1)),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 5. Movimientos (Gastos, Ingresos, Traslados)
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    pillar TEXT NOT NULL CHECK (pillar IN ('vital', 'growth', 'leisure', 'debt', 'income', 'transfer')),
    wallet_id TEXT NOT NULL,
    destination_wallet_id TEXT,
    category_id TEXT,
    date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  -- 6. Presupuestos Mensuales por Categoría
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    monthly_limit INTEGER NOT NULL DEFAULT 0,
    spent_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 7. Suscripciones y Fugas Hormiga
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'annual')),
    wallet_id TEXT,
    category_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 8. Metas de Ahorro
  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL DEFAULT 0,
    current_amount INTEGER NOT NULL DEFAULT 0,
    target_date TEXT,
    icon TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 9. Botones Rápidos (Quick Presets)
  CREATE TABLE IF NOT EXISTS quick_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    default_amount INTEGER NOT NULL DEFAULT 0,
    pillar TEXT NOT NULL CHECK (pillar IN ('vital', 'growth', 'leisure', 'debt', 'income', 'transfer')),
    category_id TEXT NOT NULL,
    icon TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Índices de Rendimiento Obligatorios
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_date_created ON transactions (date DESC, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions (wallet_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_dest_wallet_id ON transactions (destination_wallet_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_pillar ON transactions (pillar);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets (category_id);
  CREATE INDEX IF NOT EXISTS idx_debts_is_paid ON debts (is_paid);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions (is_active);
  CREATE INDEX IF NOT EXISTS idx_savings_goals_is_completed ON savings_goals (is_completed);
  CREATE INDEX IF NOT EXISTS idx_quick_presets_type ON quick_presets (type);
`;

/**
 * Inicializa la base de datos activando WAL y foreign keys, y ejecutando migraciones pendientes.
 * Es completamente idempotente.
 */
export async function initDatabase(db: SQLiteExecutor): Promise<void> {
  // 1. Activar PRAGMAS de integridad y rendimiento
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // 2. Leer versión actual del esquema
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  // 3. Aplicar migraciones necesarias
  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(V1_SCHEMA_DDL);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    });
  }

  // 4. Migración idempotente para columnas profile_type y gemini_api_key si faltan en bases existentes
  const userSettingsCols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(user_settings);'
  );
  if (userSettingsCols && userSettingsCols.length > 0) {
    const existingColNames = new Set(userSettingsCols.map((c) => c.name));

    if (!existingColNames.has('profile_type')) {
      await db.execAsync(
        "ALTER TABLE user_settings ADD COLUMN profile_type TEXT NOT NULL DEFAULT 'salary';"
      );
    }
    if (!existingColNames.has('gemini_api_key')) {
      await db.execAsync('ALTER TABLE user_settings ADD COLUMN gemini_api_key TEXT;');
    }
  }

  // 5. Migración idempotente para tabla quick_presets si falta en bases existentes
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS quick_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      default_amount INTEGER NOT NULL DEFAULT 0,
      pillar TEXT NOT NULL CHECK (pillar IN ('vital', 'growth', 'leisure', 'debt', 'income', 'transfer')),
      category_id TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quick_presets_type ON quick_presets (type);
  `);
}
