/**
 * Pruebas unitarias para el Repositorio SQLite (Guaca v2).
 * Cubre: CRUD de las 8 entidades, atomicidad transaccional, impacto en saldos,
 * transferencias seguras, deshacer (Undo), paginación, filtros con escape de LIKE,
 * onboarding guiado y agregaciones mensuales del Coach.
 */

import { createInMemoryDatabase } from '../client';
import { GuacaRepository } from '../repository';
import { initDatabase } from '../schema';
import { SQLiteExecutor } from '../types';

describe('GuacaRepository (TDD)', () => {
  let db: SQLiteExecutor;
  let repo: GuacaRepository;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    await initDatabase(db);
    repo = new GuacaRepository(db);
  });

  // ========================================================
  // 1. User Settings
  // ========================================================
  describe('User Settings CRUD', () => {
    it('retorna null si no se han configurado los ajustes', async () => {
      const settings = await repo.getSettings();
      expect(settings).toBeNull();
    });

    it('guarda y recupera los ajustes de usuario correctamente', async () => {
      const created = await repo.upsertSettings({
        userName: 'Carlos',
        currency: 'COP',
        netMonthlyIncome: 3500000,
        vitalMinimumBreakdown: {
          housing: 1200000,
          food: 600000,
          utilities: 250000,
          transport: 150000,
        },
        monthStartDay: 1,
        isPrivateMode: false,
        onboardingCompleted: true,
      });

      expect(created.userName).toBe('Carlos');
      expect(created.netMonthlyIncome).toBe(3500000);
      expect(created.vitalMinimumBreakdown.housing).toBe(1200000);
      expect(created.onboardingCompleted).toBe(true);

      const fetched = await repo.getSettings();
      expect(fetched?.userName).toBe('Carlos');
      expect(fetched?.isPrivateMode).toBe(false);
    });

    it('actualiza el modo privado de forma aislada', async () => {
      await repo.upsertSettings({
        userName: 'Carlos',
        currency: 'COP',
        netMonthlyIncome: 3500000,
        vitalMinimumBreakdown: { housing: 1000000, food: 500000, utilities: 200000, transport: 100000 },
        monthStartDay: 1,
        isPrivateMode: false,
        onboardingCompleted: true,
      });

      await repo.setPrivateMode(true);
      const updated = await repo.getSettings();
      expect(updated?.isPrivateMode).toBe(true);
    });
  });

  // ========================================================
  // 2. Wallets CRUD
  // ========================================================
  describe('Wallets CRUD', () => {
    it('crea, lista, actualiza y archiva billeteras', async () => {
      const wallet = await repo.createWallet({
        name: 'Bancolombia Principal',
        type: 'bank',
        balance: 1500000,
        icon: 'landmark',
        color: '#0B6B53',
      });

      expect(wallet.id).toBeDefined();
      expect(wallet.name).toBe('Bancolombia Principal');
      expect(wallet.balance).toBe(1500000);
      expect(wallet.isArchived).toBe(false);

      const all = await repo.listWallets();
      expect(all.length).toBe(1);

      const updated = await repo.updateWallet(wallet.id, {
        name: 'Bancolombia Ahorros',
        color: '#116B34',
      });
      expect(updated.name).toBe('Bancolombia Ahorros');

      await repo.archiveWallet(wallet.id, true);
      const activeWallets = await repo.listWallets();
      expect(activeWallets.length).toBe(0);

      const allIncludingArchived = await repo.listWallets({ includeArchived: true });
      expect(allIncludingArchived.length).toBe(1);
      expect(allIncludingArchived[0].isArchived).toBe(true);
    });

    it('rechaza la creación de una billetera con nombre vacío', async () => {
      await expect(
        repo.createWallet({
          name: '   ',
          type: 'cash',
          balance: 50000,
        })
      ).rejects.toThrow();
    });
  });

  // ========================================================
  // 3. Credit Cards CRUD
  // ========================================================
  describe('Credit Cards CRUD', () => {
    it('crea, lista, actualiza y archiva tarjetas de crédito', async () => {
      const card = await repo.createCreditCard({
        name: 'Visa Clásica',
        creditLimit: 3000000,
        currentBalance: 500000,
        cutoffDay: 18,
        dueDay: 5,
        monthlyRatePct: 2.1,
      });

      expect(card.id).toBeDefined();
      expect(card.creditLimit).toBe(3000000);
      expect(card.currentBalance).toBe(500000);
      expect(card.cutoffDay).toBe(18);

      const cards = await repo.listCreditCards();
      expect(cards.length).toBe(1);

      await repo.updateCreditCard(card.id, {
        currentBalance: 400000,
      });

      const updated = await repo.getCreditCardById(card.id);
      expect(updated?.currentBalance).toBe(400000);
    });
  });

  // ========================================================
  // 4. Debts CRUD
  // ========================================================
  describe('Debts CRUD', () => {
    it('crea, lista, actualiza y marca deudas como pagadas', async () => {
      const debt = await repo.createDebt({
        name: 'Préstamo Libre Inversión',
        creditor: 'Banco Caja Social',
        originalBalance: 5000000,
        remainingBalance: 3200000,
        minimumMonthlyPayment: 250000,
        estimatedMonthlyRatePct: 1.8,
      });

      expect(debt.id).toBeDefined();
      expect(debt.isPaid).toBe(false);

      const activeDebts = await repo.listDebts();
      expect(activeDebts.length).toBe(1);

      await repo.recordDebtPayment(debt.id, 250000);
      const afterPayment = await repo.getDebtById(debt.id);
      expect(afterPayment?.remainingBalance).toBe(2950000);

      await repo.markDebtAsPaid(debt.id, true);
      const paid = await repo.getDebtById(debt.id);
      expect(paid?.isPaid).toBe(true);
      expect(paid?.remainingBalance).toBe(0);
    });
  });

  // ========================================================
  // 5. Budgets, Subscriptions & Savings Goals CRUD
  // ========================================================
  describe('Budgets, Subscriptions and Savings Goals CRUD', () => {
    it('gestiona presupuestos por categoría', async () => {
      const b = await repo.upsertBudget({
        categoryId: 'mercado',
        monthlyLimit: 700000,
      });

      expect(b.monthlyLimit).toBe(700000);
      const budgets = await repo.listBudgets();
      expect(budgets.length).toBe(1);
    });

    it('gestiona suscripciones y fugas hormiga', async () => {
      const sub = await repo.createSubscription({
        name: 'Gimnasio',
        amount: 85000,
        frequency: 'monthly',
      });

      expect(sub.isActive).toBe(true);
      const subs = await repo.listSubscriptions();
      expect(subs.length).toBe(1);

      await repo.updateSubscription(sub.id, { isActive: false });
      const activeOnly = await repo.listSubscriptions({ activeOnly: true });
      expect(activeOnly.length).toBe(0);
    });

    it('calcula dinámicamente spentThisMonth en listBudgets según los movimientos del mes', async () => {
      const b = await repo.upsertBudget({
        categoryId: 'mercado',
        monthlyLimit: 600000,
      });

      const w = await repo.createWallet({ name: 'Efectivo', type: 'cash', balance: 500000 });
      const currentMonth = new Date().toISOString().substring(0, 7);

      // 1. Sin gastos, spentThisMonth es 0
      let budgets = await repo.listBudgets();
      expect(budgets[0].spentThisMonth).toBe(0);

      // 2. Registrar gasto de 150k en 'mercado'
      const tx = await repo.createTransaction({
        amount: 150000,
        type: 'expense',
        pillar: 'vital',
        walletId: w.id,
        categoryId: 'mercado',
        date: `${currentMonth}-05T12:00:00.000Z`,
      });

      budgets = await repo.listBudgets();
      expect(budgets[0].spentThisMonth).toBe(150000);

      // 3. Eliminar gasto, spentThisMonth vuelve a 0
      await repo.deleteTransaction(tx.id);
      budgets = await repo.listBudgets();
      expect(budgets[0].spentThisMonth).toBe(0);
    });

    it('rechaza abonos a deudas y aportes a metas menores o iguales a cero', async () => {
      const debt = await repo.createDebt({
        name: 'Préstamo',
        creditor: 'Banco',
        originalBalance: 1000000,
        minimumMonthlyPayment: 100000,
      });

      await expect(repo.recordDebtPayment(debt.id, 0)).rejects.toThrow();
      await expect(repo.recordDebtPayment(debt.id, -50000)).rejects.toThrow();

      const goal = await repo.createSavingsGoal({
        name: 'Ahorro',
        targetAmount: 500000,
      });

      await expect(repo.contributeToSavingsGoal(goal.id, 0)).rejects.toThrow();
      await expect(repo.contributeToSavingsGoal(goal.id, -20000)).rejects.toThrow();
    });
  });

  // ========================================================
  // 6. Transactions & Balance Atomicity
  // ========================================================
  describe('Transactions & Balance Atomicity', () => {
    let walletA: { id: string };
    let walletB: { id: string };
    let cardA: { id: string };

    beforeEach(async () => {
      walletA = await repo.createWallet({
        name: 'Efectivo',
        type: 'cash',
        balance: 500000,
      });
      walletB = await repo.createWallet({
        name: 'Nequi',
        type: 'digital',
        balance: 200000,
      });
      cardA = await repo.createCreditCard({
        name: 'Mastercard',
        creditLimit: 2000000,
        currentBalance: 100000,
        cutoffDay: 15,
        dueDay: 30,
        monthlyRatePct: 2.2,
      });
    });

    it('un gasto descuenta del saldo de la billetera atómicamente', async () => {
      const tx = await repo.createTransaction({
        amount: 50000,
        type: 'expense',
        pillar: 'vital',
        walletId: walletA.id,
        categoryId: 'mercado',
        date: '2026-11-12T14:00:00.000Z',
      });

      expect(tx.id).toBeDefined();

      const updatedWallet = await repo.getWalletById(walletA.id);
      expect(updatedWallet?.balance).toBe(450000);
    });

    it('un gasto asociado a tarjeta de crédito incrementa el saldo usado de la tarjeta', async () => {
      await repo.createTransaction({
        amount: 80000,
        type: 'expense',
        pillar: 'leisure',
        walletId: cardA.id,
        categoryId: 'cena',
        date: '2026-11-12T20:00:00.000Z',
      });

      const updatedCard = await repo.getCreditCardById(cardA.id);
      expect(updatedCard?.currentBalance).toBe(180000);
    });

    it('un ingreso suma al saldo de la billetera atómicamente', async () => {
      await repo.createTransaction({
        amount: 300000,
        type: 'income',
        pillar: 'income',
        walletId: walletB.id,
        date: '2026-11-12T09:00:00.000Z',
      });

      const updatedWallet = await repo.getWalletById(walletB.id);
      expect(updatedWallet?.balance).toBe(500000);
    });

    it('una transferencia resta de origen y suma a destino dentro de una sola transacción', async () => {
      const tx = await repo.createTransaction({
        amount: 100000,
        type: 'transfer',
        pillar: 'transfer',
        walletId: walletA.id,
        destinationWalletId: walletB.id,
        date: '2026-11-12T11:00:00.000Z',
      });

      expect(tx.destinationWalletId).toBe(walletB.id);

      const sourceW = await repo.getWalletById(walletA.id);
      const destW = await repo.getWalletById(walletB.id);

      expect(sourceW?.balance).toBe(400000); // 500k - 100k
      expect(destW?.balance).toBe(300000);   // 200k + 100k
    });

    it('rechaza una transferencia si el origen y el destino son la misma billetera', async () => {
      await expect(
        repo.createTransaction({
          amount: 50000,
          type: 'transfer',
          pillar: 'transfer',
          walletId: walletA.id,
          destinationWalletId: walletA.id,
          date: '2026-11-12T11:00:00.000Z',
        })
      ).rejects.toThrow('La cuenta de origen y destino no pueden ser la misma.');
    });

    it('rechaza una transferencia si la cuenta de origen o destino no existe', async () => {
      await expect(
        repo.createTransaction({
          amount: 50000,
          type: 'transfer',
          pillar: 'transfer',
          walletId: walletA.id,
          destinationWalletId: 'wal_inexistente_999',
          date: '2026-11-12T11:00:00.000Z',
        })
      ).rejects.toThrow('La cuenta de destino no existe');

      await expect(
        repo.createTransaction({
          amount: 50000,
          type: 'transfer',
          pillar: 'transfer',
          walletId: 'wal_inexistente_888',
          destinationWalletId: walletB.id,
          date: '2026-11-12T11:00:00.000Z',
        })
      ).rejects.toThrow('La cuenta de origen no existe');
    });

    it('rechaza editar un movimiento con monto menor o igual a cero', async () => {
      const tx = await repo.createTransaction({
        amount: 50000,
        type: 'expense',
        pillar: 'vital',
        walletId: walletA.id,
        date: '2026-11-12T12:00:00.000Z',
      });

      await expect(
        repo.updateTransaction(tx.id, {
          amount: 0,
        })
      ).rejects.toThrow();

      await expect(
        repo.updateTransaction(tx.id, {
          amount: -10000,
        })
      ).rejects.toThrow();
    });

    it('eliminar un movimiento revierte el saldo y genera un TransactionUndoRecord', async () => {
      const tx = await repo.createTransaction({
        amount: 50000,
        type: 'expense',
        pillar: 'vital',
        walletId: walletA.id,
        date: '2026-11-12T12:00:00.000Z',
      });

      expect((await repo.getWalletById(walletA.id))?.balance).toBe(450000);

      const undoRecord = await repo.deleteTransaction(tx.id);
      expect(undoRecord.transaction.id).toBe(tx.id);

      // Saldo revertido a 500k
      expect((await repo.getWalletById(walletA.id))?.balance).toBe(500000);

      // Deshacer (Undo) restaura la transacción y el saldo
      await repo.restoreTransactionSnapshot(undoRecord);
      expect((await repo.getWalletById(walletA.id))?.balance).toBe(450000);
      expect((await repo.getTransactionById(tx.id))?.id).toBe(tx.id);
    });

    it('editar un movimiento recalcula el impacto en saldo atómicamente', async () => {
      const tx = await repo.createTransaction({
        amount: 50000,
        type: 'expense',
        pillar: 'vital',
        walletId: walletA.id,
        date: '2026-11-12T12:00:00.000Z',
      });

      // Saldo actual 450k. Ahora editamos el monto de 50k a 70k.
      await repo.updateTransaction(tx.id, {
        amount: 70000,
      });

      expect((await repo.getWalletById(walletA.id))?.balance).toBe(430000);
      const updatedTx = await repo.getTransactionById(tx.id);
      expect(updatedTx?.amount).toBe(70000);
    });
  });

  // ========================================================
  // 7. Pagination and Escaped LIKE Search
  // ========================================================
  describe('Pagination and Search', () => {
    beforeEach(async () => {
      const w = await repo.createWallet({ name: 'Cuenta', type: 'bank', balance: 1000000 });
      for (let i = 1; i <= 35; i++) {
        await repo.createTransaction({
          amount: 1000 * i,
          type: 'expense',
          pillar: i % 2 === 0 ? 'vital' : 'leisure',
          walletId: w.id,
          note: i === 15 ? 'Compra con 50% de descuento_especial' : `Nota movimiento ${i}`,
          date: `2026-11-${String(i).padStart(2, '0')}T10:00:00.000Z`,
        });
      }
    });

    it('pagina correctamente con limit y offset por defecto', async () => {
      const page1 = await repo.listTransactions({ limit: 20, offset: 0 });
      expect(page1.items.length).toBe(20);
      expect(page1.totalCount).toBe(35);
      expect(page1.hasMore).toBe(true);

      const page2 = await repo.listTransactions({ limit: 20, offset: 20 });
      expect(page2.items.length).toBe(15);
      expect(page2.hasMore).toBe(false);
    });

    it('escapa de forma segura caracteres comodín % y _ en búsquedas de texto', async () => {
      // Búsqueda con literal '%' y '_'
      const resultsPercent = await repo.listTransactions({ search: '50%' });
      expect(resultsPercent.items.length).toBe(1);
      expect(resultsPercent.items[0].note).toContain('50%');

      const resultsUnderscore = await repo.listTransactions({ search: 'descuento_' });
      expect(resultsUnderscore.items.length).toBe(1);
    });
  });

  // ========================================================
  // 8. Onboarding & Coach Aggregations
  // ========================================================
  describe('Onboarding & Monthly Coach Aggregations', () => {
    it('ejecuta completeOnboarding atómicamente', async () => {
      const result = await repo.completeOnboarding({
        userName: 'Andrea',
        netMonthlyIncome: 4000000,
        vitalBreakdown: {
          housing: 1300000,
          food: 700000,
          utilities: 300000,
          transport: 200000,
        },
        initialWalletName: 'Bancolombia Nómina',
        initialWalletType: 'bank',
        initialWalletBalance: 500000,
        seedBudgets: true,
      });

      expect(result.settings.onboardingCompleted).toBe(true);
      expect(result.wallet?.name).toBe('Bancolombia Nómina');
      expect(result.wallet?.balance).toBe(500000);

      const budgets = await repo.listBudgets();
      expect(budgets.length).toBe(4);
    });

    it('calcula getMonthlyCoachSummary con agregaciones SQL y reglas de dominio', async () => {
      await repo.completeOnboarding({
        userName: 'Andrea',
        netMonthlyIncome: 4000000,
        vitalBreakdown: {
          housing: 1000000,
          food: 500000,
          utilities: 200000,
          transport: 100000,
        },
        initialWalletName: 'Principal',
        initialWalletBalance: 1500000,
      });

      const wallets = await repo.listWallets();
      const wId = wallets[0].id;

      // Movimientos de noviembre 2026
      await repo.createTransaction({
        amount: 4000000,
        type: 'income',
        pillar: 'income',
        walletId: wId,
        date: '2026-11-01T08:00:00.000Z',
      });
      await repo.createTransaction({
        amount: 1500000,
        type: 'expense',
        pillar: 'vital',
        walletId: wId,
        date: '2026-11-05T10:00:00.000Z',
      });
      await repo.createTransaction({
        amount: 300000,
        type: 'expense',
        pillar: 'leisure',
        walletId: wId,
        date: '2026-11-10T15:00:00.000Z',
      });

      const summary = await repo.getMonthlyCoachSummary('2026-11');

      expect(summary.monthKey).toBe('2026-11');
      expect(summary.totalIncome).toBe(4000000);
      expect(summary.vitalSpent).toBe(1500000);
      expect(summary.leisureSpent).toBe(300000);
      expect(summary.vitalMinimum).toBe(1800000); // 1000 + 500 + 200 + 100
      expect(summary.savingCapacity).toBe(2200000); // 4000000 - 1800000 - 0 deudas
      expect(summary.healthStatus.status).toBe('peace');
    });

    it('utiliza Math.max(netIncome, totalIncome) para no disparar falsa alarma de riesgo si entra un ingreso menor a inicio de mes', async () => {
      await repo.completeOnboarding({
        userName: 'Andrea',
        netMonthlyIncome: 3500000,
        vitalBreakdown: {
          housing: 1000000,
          food: 500000,
          utilities: 200000,
          transport: 100000,
        },
        initialWalletName: 'Principal',
        initialWalletBalance: 500000,
      });

      const wallets = await repo.listWallets();
      const wId = wallets[0].id;

      // El usuario recibe un ingreso esporádico pequeño de $50.000 el día 2
      await repo.createTransaction({
        amount: 50000,
        type: 'income',
        pillar: 'income',
        walletId: wId,
        date: '2026-11-02T10:00:00.000Z',
      });

      const summary = await repo.getMonthlyCoachSummary('2026-11');

      // effectiveIncome debe ser 3.500.000 (no 50.000), manteniendo el estado de paz
      expect(summary.totalIncome).toBe(3500000);
      expect(summary.savingCapacity).toBe(1700000); // 3.5M - 1.8M
      expect(summary.healthStatus.status).toBe('peace');
    });
  });
});
