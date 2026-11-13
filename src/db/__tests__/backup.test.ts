/**
 * Pruebas unitarias para el módulo de Respaldo y Restauración local JSON (Guaca v2).
 * Cubre: exportación fiel, serialización, importación atómica, protección contra
 * Prototype Pollution, límites de tamaño (10MB), y garantía de rollback sin pérdida de datos.
 */

import { exportBackupPayload, importBackupJson, MAX_BACKUP_SIZE_BYTES, serializeBackup } from '../backup';
import { createInMemoryDatabase } from '../client';
import { GuacaRepository } from '../repository';
import { initDatabase } from '../schema';
import { SQLiteExecutor } from '../types';

describe('Backup & Restore Local JSON (TDD)', () => {
  let db: SQLiteExecutor;
  let repo: GuacaRepository;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    await initDatabase(db);
    repo = new GuacaRepository(db);

    // Sembrar estado inicial
    await repo.completeOnboarding({
      userName: 'Camila',
      netMonthlyIncome: 3000000,
      vitalBreakdown: { housing: 900000, food: 400000, utilities: 200000, transport: 100000 },
      initialWalletName: 'Efectivo Personal',
      initialWalletBalance: 250000,
    });
    const wallets = await repo.listWallets();
    await repo.createTransaction({
      amount: 45000,
      type: 'expense',
      pillar: 'vital',
      walletId: wallets[0].id,
      date: '2026-11-12T10:00:00.000Z',
    });
  });

  it('exporta y serializa un BackupPayload válido', async () => {
    const payload = await exportBackupPayload(db, '1.0.0');

    expect(payload.metadata.version).toBe(1);
    expect(payload.metadata.appVersion).toBe('1.0.0');
    expect(payload.settings.userName).toBe('Camila');
    expect(payload.wallets.length).toBe(1);
    expect(payload.transactions.length).toBe(1);

    const json = serializeBackup(payload);
    expect(typeof json).toBe('string');
    expect(json).toContain('"userName": "Camila"');
  });

  it('SEGURIDAD: nunca incluye geminiApiKey en el JSON exportado ni lo restaura desde JSON externos', async () => {
    // Configurar API key en la base de datos
    const currentSettings = await repo.getSettings();
    if (currentSettings) {
      await repo.upsertSettings({
        ...currentSettings,
        geminiApiKey: 'AIzaSySuperSecret12345',
      });
    }

    const payload = await exportBackupPayload(db, '1.0.0');
    expect(payload.settings.geminiApiKey).toBeUndefined();

    const json = serializeBackup(payload);
    expect(json).not.toContain('AIzaSySuperSecret12345');
    expect(json).not.toContain('geminiApiKey');

    // Intentar importar un JSON que contenga una clave geminiApiKey inyectada
    const jsonWithApiKey = json.replace(
      '"userName": "Camila"',
      '"userName": "Camila", "geminiApiKey": "HackerApiKey67890"'
    );

    const importResult = await importBackupJson(db, jsonWithApiKey);
    expect(importResult.success).toBe(true);

    // Verificar que la base de datos NO guardó la clave inyectada
    const restoredSettings = await repo.getSettings();
    expect(restoredSettings?.geminiApiKey).toBeUndefined();
  });

  it('restaura un respaldo válido reemplazando las tablas atómicamente', async () => {
    const backup = await exportBackupPayload(db, '1.0.0');

    // Modificar datos actuales
    await repo.createWallet({ name: 'Cuenta Extra', type: 'digital', balance: 50000 });
    expect((await repo.listWallets()).length).toBe(2);

    // Importar el respaldo original
    const result = await importBackupJson(db, JSON.stringify(backup));
    expect(result.success).toBe(true);

    const restoredWallets = await repo.listWallets();
    expect(restoredWallets.length).toBe(1);
    expect(restoredWallets[0].name).toBe('Efectivo Personal');
  });

  it('rechaza archivos que superen el límite seguro de 10 MB', async () => {
    const hugeString = 'a'.repeat(MAX_BACKUP_SIZE_BYTES + 10);
    const result = await importBackupJson(db, hugeString);

    expect(result.success).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  it('exporta y restaura completamente respaldos con más de 100 movimientos sin truncarse a 100', async () => {
    const wallets = await repo.listWallets();
    const walletId = wallets[0].id;

    // Insertar 125 movimientos adicionales (total 126)
    for (let i = 1; i <= 125; i++) {
      await repo.createTransaction({
        amount: 10000 + i,
        type: 'expense',
        pillar: 'vital',
        walletId,
        date: `2026-11-12T${String(i % 24).padStart(2, '0')}:00:00.000Z`,
        note: `Gasto número ${i}`,
      });
    }

    const payload = await exportBackupPayload(db, '1.0.0');
    expect(payload.transactions.length).toBe(126);

    const restoreResult = await importBackupJson(db, JSON.stringify(payload));
    expect(restoreResult.success).toBe(true);

    const restoredAll = await repo.listTransactions({ limit: 100, offset: 0 });
    expect(restoredAll.totalCount).toBe(126);
  });

  it('acepta notas y textos legítimos con palabras como constructor o prototype pero rechaza claves maliciosas', async () => {
    const wallets = await repo.listWallets();
    await repo.createTransaction({
      amount: 150000,
      type: 'expense',
      pillar: 'vital',
      walletId: wallets[0].id,
      note: 'Pago al constructor de la cocina y compra de prototype',
    });

    const payload = await exportBackupPayload(db, '1.0.0');
    const jsonStr = JSON.stringify(payload);

    // Debe ser aceptado sin problemas porque "constructor" está en el valor de la nota, no como clave
    const importResult = await importBackupJson(db, jsonStr);
    expect(importResult.success).toBe(true);

    // Rechaza si "constructor" es una clave de objeto maliciosa
    const maliciousConstructorKey = jsonStr.replace(
      '"settings":',
      '"constructor": { "pwned": true }, "settings":'
    );
    const rejectedResult1 = await importBackupJson(db, maliciousConstructorKey);
    expect(rejectedResult1.success).toBe(false);
    expect(rejectedResult1.error).toContain('seguridad');

    // Rechaza si "prototype" es una clave de objeto maliciosa
    const maliciousPrototypeKey = jsonStr.replace(
      '"settings":',
      '"prototype": { "pwned": true }, "settings":'
    );
    const rejectedResult2 = await importBackupJson(db, maliciousPrototypeKey);
    expect(rejectedResult2.success).toBe(false);
    expect(rejectedResult2.error).toContain('seguridad');
  });

  it('rechaza payloads con Prototype Pollution sin alterar la base de datos', async () => {
    const maliciousJson = `{
      "metadata": { "version": 1, "exportedAt": "${new Date().toISOString()}", "appVersion": "1.0.0" },
      "settings": {
        "userName": "Hacker",
        "currency": "COP",
        "netMonthlyIncome": 1000000,
        "vitalMinimumBreakdown": { "housing": 100, "food": 100, "utilities": 100, "transport": 100 },
        "monthStartDay": 1,
        "isPrivateMode": false,
        "onboardingCompleted": true,
        "createdAt": "${new Date().toISOString()}",
        "updatedAt": "${new Date().toISOString()}"
      },
      "wallets": [],
      "creditCards": [],
      "debts": [],
      "transactions": [],
      "budgets": [],
      "subscriptions": [],
      "savingsGoals": [],
      "__proto__": { "isAdmin": true }
    }`;

    const result = await importBackupJson(db, maliciousJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('seguridad');

    // Verifica que los datos actuales siguen intactos
    const settings = await repo.getSettings();
    expect(settings?.userName).toBe('Camila');
  });

  it('rechaza JSON malformado y mantiene intacta la base de datos', async () => {
    const malformed = '{ "metadata": { version: 1, ';
    const result = await importBackupJson(db, malformed);

    expect(result.success).toBe(false);
    expect(result.error).toContain('formato');

    const settings = await repo.getSettings();
    expect(settings?.userName).toBe('Camila');
  });

  it('realiza rollback automático si falla la inserción de algún elemento durante la restauración', async () => {
    const invalidBackup = {
      metadata: { version: 1, exportedAt: new Date().toISOString(), appVersion: '1.0.0' },
      settings: {
        userName: 'Nuevo Usuario',
        currency: 'COP',
        netMonthlyIncome: 2000000,
        vitalMinimumBreakdown: { housing: 500000, food: 300000, utilities: 100000, transport: 50000 },
        monthStartDay: 1,
        isPrivateMode: false,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      wallets: [
        // Billetera con tipo inválido no permitido por SQLite CHECK
        { id: 'w_corrupt', name: 'Corrupta', type: 'INVALID_TYPE', balance: 100, isArchived: false, createdAt: 'x', updatedAt: 'x' },
      ],
      creditCards: [],
      debts: [],
      transactions: [],
      budgets: [],
      subscriptions: [],
      savingsGoals: [],
    };

    const result = await importBackupJson(db, JSON.stringify(invalidBackup));
    expect(result.success).toBe(false);

    // Los datos existentes de Camila deben mantenerse íntegros
    const settings = await repo.getSettings();
    expect(settings?.userName).toBe('Camila');
    const wallets = await repo.listWallets();
    expect(wallets[0].name).toBe('Efectivo Personal');
  });

  it('exporta y restaura quickPresets con compatibilidad hacia atrás', async () => {
    // Crear un preset personalizado
    await repo.createQuickPreset({
      name: 'CARRO',
      type: 'expense',
      defaultAmount: 50000,
      pillar: 'vital',
      categoryId: 'carro',
      icon: 'car',
    });

    // 1. Exportar payload y verificar que incluye quickPresets
    const payload = await exportBackupPayload(db, '1.0.0');
    expect(payload.quickPresets).toBeDefined();
    expect(payload.quickPresets!.length).toBeGreaterThanOrEqual(1);
    expect(payload.quickPresets!.some((p) => p.name === 'CARRO' && p.defaultAmount === 50000)).toBe(true);

    // 2. Restaurar en una base limpia
    const cleanDb = createInMemoryDatabase();
    await initDatabase(cleanDb);
    const cleanRepo = new GuacaRepository(cleanDb);

    const restoreResult = await importBackupJson(cleanDb, JSON.stringify(payload));
    expect(restoreResult.success).toBe(true);

    const restoredPresets = await cleanRepo.listQuickPresets();
    expect(restoredPresets.some((p) => p.name === 'CARRO' && p.defaultAmount === 50000)).toBe(true);

    // 3. Retrocompatibilidad: importar un backup antiguo SIN quickPresets no debe fallar
    const legacyPayload = { ...payload };
    delete (legacyPayload as any).quickPresets;

    const legacyDb = createInMemoryDatabase();
    await initDatabase(legacyDb);
    const legacyRepo = new GuacaRepository(legacyDb);

    const legacyRestoreResult = await importBackupJson(legacyDb, JSON.stringify(legacyPayload));
    expect(legacyRestoreResult.success).toBe(true);
    const legacyPresets = await legacyRepo.listQuickPresets();
    expect(legacyPresets).toEqual([]);
  });
});
