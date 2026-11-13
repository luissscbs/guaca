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
});
