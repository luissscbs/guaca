/**
 * Pruebas unitarias para el esquema e inicialización de la base de datos SQLite (Guaca v2).
 * Cubre: activación de WAL, foreign keys, versionado de esquema con user_version,
 * creación idempotente de las 8 tablas e índices obligatorios de rendimiento.
 */

import { createInMemoryDatabase } from '../client';
import { initDatabase, SCHEMA_VERSION, TABLE_NAMES } from '../schema';
import { SQLiteExecutor } from '../types';

describe('Database Schema & Initialization (TDD)', () => {
  let db: SQLiteExecutor;

  beforeEach(() => {
    db = createInMemoryDatabase();
  });

  it('activa journal_mode=WAL y foreign_keys=ON al inicializar', async () => {
    await initDatabase(db);

    const fkResult = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
    expect(fkResult?.foreign_keys).toBe(1);

    const walResult = await db.getFirstAsync<{ journal_mode: string }>('PRAGMA journal_mode;');
    expect(walResult?.journal_mode?.toUpperCase()).toBe('WAL');
  });

  it('establece PRAGMA user_version en SCHEMA_VERSION (v1)', async () => {
    await initDatabase(db);

    const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    expect(versionResult?.user_version).toBe(SCHEMA_VERSION);
  });

  it('es idempotente: ejecutar initDatabase múltiples veces no falla ni duplica tablas', async () => {
    await initDatabase(db);
    await initDatabase(db);
    await initDatabase(db);

    const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    expect(versionResult?.user_version).toBe(SCHEMA_VERSION);
  });

  it('crea las 8 tablas de las entidades principales de Guaca', async () => {
    await initDatabase(db);

    for (const tableName of TABLE_NAMES) {
      const tableCheck = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [tableName]
      );
      expect(tableCheck?.name).toBe(tableName);
    }
  });

  it('crea los índices de rendimiento requeridos para transacciones, presupuestos, deudas y suscripciones', async () => {
    await initDatabase(db);

    const requiredIndexes = [
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
    ];

    for (const indexName of requiredIndexes) {
      const idxCheck = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='index' AND name=?;`,
        [indexName]
      );
      expect(idxCheck?.name).toBe(indexName);
    }
  });

  it('incluye las columnas profile_type y gemini_api_key en user_settings', async () => {
    await initDatabase(db);

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain('profile_type');
    expect(columnNames).toContain('gemini_api_key');
  });

  it('migra de forma segura e idempotente una tabla user_settings existente que carezca de profile_type o gemini_api_key', async () => {
    // Simular tabla previa de versión 1 sin las nuevas columnas
    await db.execAsync(`
      PRAGMA user_version = 1;
      CREATE TABLE user_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_name TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'COP',
        net_monthly_income INTEGER NOT NULL DEFAULT 0,
        vital_housing INTEGER NOT NULL DEFAULT 0,
        vital_food INTEGER NOT NULL DEFAULT 0,
        vital_utilities INTEGER NOT NULL DEFAULT 0,
        vital_transport INTEGER NOT NULL DEFAULT 0,
        month_start_day INTEGER NOT NULL DEFAULT 1,
        is_private_mode INTEGER NOT NULL DEFAULT 0,
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO user_settings (id, user_name, created_at, updated_at) VALUES (1, 'Carlos', '2026-01-01', '2026-01-01');
    `);

    // Ejecutar initDatabase para probar la migración
    await initDatabase(db);

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings);');
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain('profile_type');
    expect(columnNames).toContain('gemini_api_key');

    // Verificar que los datos existentes no se perdieron
    const row = await db.getFirstAsync<{ user_name: string; profile_type: string }>('SELECT user_name, profile_type FROM user_settings WHERE id = 1;');
    expect(row?.user_name).toBe('Carlos');
    expect(row?.profile_type).toBe('salary');
  });

  it('crea la tabla quick_presets con todas sus columnas e índices requeridos', async () => {
    await initDatabase(db);

    const tableCheck = await db.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='quick_presets';`
    );
    expect(tableCheck?.name).toBe('quick_presets');

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(quick_presets);');
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('type');
    expect(colNames).toContain('default_amount');
    expect(colNames).toContain('pillar');
    expect(colNames).toContain('category_id');
    expect(colNames).toContain('icon');
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');

    const indexCheck = await db.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='idx_quick_presets_type';`
    );
    expect(indexCheck?.name).toBe('idx_quick_presets_type');
  });
});
