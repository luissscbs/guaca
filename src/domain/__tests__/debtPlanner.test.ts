import {
  calculateInterestPer100k,
  estimateMonthlyInterestCOP,
  planDebtPayoff,
} from '../debtPlanner';
import { Debt } from '../types';

describe('Debt Planner Domain Engine', () => {
  describe('calculateInterestPer100k', () => {
    it('translates 2.1% monthly rate to $2.100 COP per 100k', () => {
      expect(calculateInterestPer100k(2.1)).toBe(2100);
    });

    it('translates 1.85% monthly rate rounded to integer COP', () => {
      expect(calculateInterestPer100k(1.85)).toBe(1850);
    });

    it('handles 0% and negative rates safely', () => {
      expect(calculateInterestPer100k(0)).toBe(0);
      expect(calculateInterestPer100k(-2.5)).toBe(0);
    });

    it('handles NaN and non-finite numbers', () => {
      expect(calculateInterestPer100k(NaN)).toBe(0);
      expect(calculateInterestPer100k(Infinity)).toBe(0);
    });
  });

  describe('estimateMonthlyInterestCOP', () => {
    it('calculates monthly interest in COP for a given balance and rate', () => {
      // 2.000.000 COP at 2.5% monthly = 50.000 COP
      expect(estimateMonthlyInterestCOP(2000000, 2.5)).toBe(50000);
    });

    it('handles 0 balance or 0 rate', () => {
      expect(estimateMonthlyInterestCOP(0, 2.5)).toBe(0);
      expect(estimateMonthlyInterestCOP(1500000, 0)).toBe(0);
    });

    it('rounds results to integer COP', () => {
      // 100.350 * 2.1% = 2107.35 -> 2107
      expect(estimateMonthlyInterestCOP(100350, 2.1)).toBe(2107);
    });
  });

  describe('planDebtPayoff', () => {
    const sampleDebts: Debt[] = [
      {
        id: 'debt-small',
        name: 'Tarjeta Éxito',
        creditor: 'Tuya',
        originalBalance: 1000000,
        remainingBalance: 500000,
        minimumMonthlyPayment: 60000,
        estimatedMonthlyRatePct: 2.1,
        isPaid: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'debt-large-high-rate',
        name: 'Tarjeta Bancolombia',
        creditor: 'Bancolombia',
        originalBalance: 4000000,
        remainingBalance: 3000000,
        minimumMonthlyPayment: 150000,
        estimatedMonthlyRatePct: 2.5,
        isPaid: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    it('returns 0 months and celebrates when there are no active debts', () => {
      const plan = planDebtPayoff([], 200000, 'snowball');
      expect(plan.monthsToFreedom).toBe(0);
      expect(plan.monthsSaved).toBe(0);
      expect(plan.totalInterestPaid).toBe(0);
      expect(plan.interestSaved).toBe(0);
      expect(plan.priorityDebt).toBeNull();
      expect(plan.unpayableWarning).toBe(false);
      expect(plan.explanation).toContain('Felicidades');
    });

    it('ignores already paid debts (isPaid = true or remainingBalance <= 0)', () => {
      const paidDebts: Debt[] = [
        {
          id: 'paid-1',
          name: 'Deuda Vieja',
          creditor: 'Amigo',
          originalBalance: 500000,
          remainingBalance: 0,
          minimumMonthlyPayment: 50000,
          estimatedMonthlyRatePct: 1.0,
          isPaid: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];
      const plan = planDebtPayoff(paidDebts, 100000, 'snowball');
      expect(plan.monthsToFreedom).toBe(0);
      expect(plan.priorityDebt).toBeNull();
    });

    it('prioritizes lowest balance first in "snowball" (Victorias Rápidas)', () => {
      const plan = planDebtPayoff(sampleDebts, 100000, 'snowball');
      expect(plan.strategy).toBe('snowball');
      expect(plan.priorityDebt?.id).toBe('debt-small');
      expect(plan.priorityDebt?.name).toBe('Tarjeta Éxito');
      expect(plan.monthsToFreedom).toBeGreaterThan(0);
    });

    it('prioritizes highest monthly interest rate first in "avalanche" (Ahorra Más Intereses)', () => {
      const plan = planDebtPayoff(sampleDebts, 100000, 'avalanche');
      expect(plan.strategy).toBe('avalanche');
      expect(plan.priorityDebt?.id).toBe('debt-large-high-rate');
      expect(plan.priorityDebt?.name).toBe('Tarjeta Bancolombia');
      expect(plan.monthsToFreedom).toBeGreaterThan(0);
    });

    it('accelerates debt freedom when an extra monthly payment is provided', () => {
      const planNoExtra = planDebtPayoff(sampleDebts, 0, 'snowball');
      const planWithExtra = planDebtPayoff(sampleDebts, 200000, 'snowball');

      expect(planWithExtra.monthsToFreedom).toBeLessThan(planNoExtra.monthsToFreedom);
      expect(planWithExtra.monthsSaved).toBeGreaterThan(0);
      expect(planWithExtra.interestSaved).toBeGreaterThan(0);
      expect(planWithExtra.totalInterestPaid).toBeLessThan(planNoExtra.totalInterestPaid);
    });

    it('detects unpayable debt when minimum payment does not cover monthly interest', () => {
      const predatoryDebt: Debt[] = [
        {
          id: 'predatory-loan',
          name: 'Gota a Gota / Tarjeta Tóxica',
          creditor: 'Prestamista',
          originalBalance: 10000000,
          remainingBalance: 10000000,
          minimumMonthlyPayment: 200000, // Monthly interest at 3% is 300.000 COP (> 200.000 cuota!)
          estimatedMonthlyRatePct: 3.0,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const plan = planDebtPayoff(predatoryDebt, 0, 'snowball');
      expect(plan.unpayableWarning).toBe(true);
      expect(plan.monthsToFreedom).toBe(600); // Capped at 600 months (50 years)
      expect(plan.explanation).toMatch(/no cubre los intereses|impagable|alerta/i);
    });

    it('cures unpayable debt when extra payment is enough to cover interest and amortize', () => {
      const predatoryDebt: Debt[] = [
        {
          id: 'predatory-loan',
          name: 'Gota a Gota / Tarjeta Tóxica',
          creditor: 'Prestamista',
          originalBalance: 10000000,
          remainingBalance: 10000000,
          minimumMonthlyPayment: 200000, // interest is 300k
          estimatedMonthlyRatePct: 3.0,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      // With 500k extra, total payment is 700k > 300k interest!
      const plan = planDebtPayoff(predatoryDebt, 500000, 'snowball');
      expect(plan.unpayableWarning).toBe(false);
      expect(plan.monthsToFreedom).toBeLessThan(600);
    });

    it('avalanche saves at least as much or more interest than snowball for different rates', () => {
      const planSnowball = planDebtPayoff(sampleDebts, 150000, 'snowball');
      const planAvalanche = planDebtPayoff(sampleDebts, 150000, 'avalanche');

      expect(planAvalanche.totalInterestPaid).toBeLessThanOrEqual(planSnowball.totalInterestPaid);
    });

    it('breaks ties in snowball by prioritizing higher interest rate first', () => {
      const tiedDebts: Debt[] = [
        {
          id: 'tied-lower-rate',
          name: 'Deuda A',
          creditor: 'Banco A',
          originalBalance: 1000000,
          remainingBalance: 1000000,
          minimumMonthlyPayment: 50000,
          estimatedMonthlyRatePct: 1.5,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'tied-higher-rate',
          name: 'Deuda B',
          creditor: 'Banco B',
          originalBalance: 1000000,
          remainingBalance: 1000000,
          minimumMonthlyPayment: 50000,
          estimatedMonthlyRatePct: 3.2,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const plan = planDebtPayoff(tiedDebts, 50000, 'snowball');
      expect(plan.priorityDebt?.id).toBe('tied-higher-rate');
    });

    it('breaks ties in avalanche by prioritizing lower balance first', () => {
      const tiedDebts: Debt[] = [
        {
          id: 'tied-larger-balance',
          name: 'Deuda Grande',
          creditor: 'Banco A',
          originalBalance: 5000000,
          remainingBalance: 5000000,
          minimumMonthlyPayment: 150000,
          estimatedMonthlyRatePct: 2.5,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'tied-smaller-balance',
          name: 'Deuda Pequeña',
          creditor: 'Banco B',
          originalBalance: 800000,
          remainingBalance: 800000,
          minimumMonthlyPayment: 40000,
          estimatedMonthlyRatePct: 2.5,
          isPaid: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const plan = planDebtPayoff(tiedDebts, 50000, 'avalanche');
      expect(plan.priorityDebt?.id).toBe('tied-smaller-balance');
    });

    it('caps active debts safely when exceeding extreme threshold (e.g. > 200 debts)', () => {
      const excessiveDebts: Debt[] = Array.from({ length: 250 }, (_, i) => ({
        id: `debt-${i}`,
        name: `Deuda ${i}`,
        creditor: `Acreedor ${i}`,
        originalBalance: 100000,
        remainingBalance: 100000,
        minimumMonthlyPayment: 10000,
        estimatedMonthlyRatePct: 1.0,
        isPaid: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }));

      const plan = planDebtPayoff(excessiveDebts, 100000, 'snowball');
      expect(plan.priorityDebt).toBeDefined();
      expect(plan.explanation).toMatch(/límite|200 deudas|máximo/i);
    });
  });
});
