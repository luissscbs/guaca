import {
  calculateVitalMinimum,
  calculateSavingCapacity,
  calculateGuiltFreeAvailable,
  getMonthHealthStatus,
  calculateEmergencyMonths,
  calculateAnnualizedLeak,
  simulatePurchase,
  getDailyCoachTip,
  evaluateCoachRules,
  calculateSafeAllowance,
  analyzeSpendingDetective,
} from '../coach';
import {
  VitalBreakdown,
  CoachSnapshot,
  Transaction,
  SubscriptionLeak,
  Debt,
} from '../types';

describe('Coach Domain Engine', () => {
  describe('calculateVitalMinimum', () => {
    it('sums the 4 essential pillars correctly', () => {
      const breakdown: VitalBreakdown = {
        housing: 1200000,
        food: 800000,
        utilities: 300000,
        transport: 200000,
      };
      expect(calculateVitalMinimum(breakdown)).toBe(2500000);
    });

    it('clamps negative values to 0', () => {
      const breakdown: VitalBreakdown = {
        housing: 1000000,
        food: -200000,
        utilities: 300000,
        transport: 0,
      };
      expect(calculateVitalMinimum(breakdown)).toBe(1300000);
    });

    it('rounds floating point numbers to COP integers', () => {
      const breakdown: VitalBreakdown = {
        housing: 1200000.4,
        food: 800000.8,
        utilities: 300000,
        transport: 200000,
      };
      expect(calculateVitalMinimum(breakdown)).toBe(2500001);
    });

    it('safely handles non-finite numbers (NaN/Infinity) as 0', () => {
      const breakdown: VitalBreakdown = {
        housing: NaN,
        food: Infinity,
        utilities: 150000,
        transport: 50000,
      };
      expect(calculateVitalMinimum(breakdown)).toBe(200000);
    });

    it('returns 0 when all pillars are 0', () => {
      const breakdown: VitalBreakdown = {
        housing: 0,
        food: 0,
        utilities: 0,
        transport: 0,
      };
      expect(calculateVitalMinimum(breakdown)).toBe(0);
    });
  });

  describe('calculateSavingCapacity', () => {
    it('calculates positive saving capacity after vital minimum and debts', () => {
      const result = calculateSavingCapacity({
        netIncome: 5000000,
        vitalMinimum: 2500000,
        debtObligations: 1000000,
      });
      expect(result).toBe(1500000);
    });

    it('clamps to 0 when obligations and vital minimum exceed net income', () => {
      const result = calculateSavingCapacity({
        netIncome: 3000000,
        vitalMinimum: 2500000,
        debtObligations: 1000000,
      });
      expect(result).toBe(0);
    });

    it('returns 0 when net income is 0 or negative', () => {
      expect(
        calculateSavingCapacity({
          netIncome: 0,
          vitalMinimum: 1500000,
          debtObligations: 200000,
        })
      ).toBe(0);

      expect(
        calculateSavingCapacity({
          netIncome: -500000,
          vitalMinimum: 1000000,
          debtObligations: 0,
        })
      ).toBe(0);
    });

    it('safely handles NaN and Infinity', () => {
      expect(
        calculateSavingCapacity({
          netIncome: NaN,
          vitalMinimum: 1000000,
          debtObligations: 200000,
        })
      ).toBe(0);
    });
  });

  describe('calculateGuiltFreeAvailable', () => {
    it('calculates guilt-free money available for leisure', () => {
      const result = calculateGuiltFreeAvailable({
        netIncome: 4000000,
        vitalMinimum: 2000000,
        debtObligations: 500000,
        nonVitalSpentThisMonth: 300000,
        shieldedThisMonth: 200000,
      });
      // 4M - 2M - 500k = 1.5M capacity; 1.5M - 300k - 200k = 1.000.000
      expect(result).toBe(1000000);
    });

    it('defaults shieldedThisMonth to 0 if omitted', () => {
      const result = calculateGuiltFreeAvailable({
        netIncome: 3000000,
        vitalMinimum: 1500000,
        debtObligations: 500000,
        nonVitalSpentThisMonth: 200000,
      });
      // 3M - 1.5M - 500k - 200k = 800.000
      expect(result).toBe(800000);
    });

    it('clamps to 0 when non-vital spending exceeds saving capacity', () => {
      const result = calculateGuiltFreeAvailable({
        netIncome: 3000000,
        vitalMinimum: 2000000,
        debtObligations: 500000,
        nonVitalSpentThisMonth: 800000,
      });
      // Capacity is 500k, spent 800k -> 0
      expect(result).toBe(0);
    });
  });

  describe('getMonthHealthStatus', () => {
    it('returns "peace" (Paz) when saving capacity is >= 20% of net income', () => {
      const health = getMonthHealthStatus({
        netIncome: 5000000,
        vitalMinimum: 2500000,
        savingCapacity: 1500000, // 30%
      });
      expect(health.status).toBe('peace');
      expect(health.savingCapacity).toBe(1500000);
      expect(health.savingCapacityPct).toBe(30);
      expect(health.explanation).toContain('Paz');
    });

    it('computes savingCapacity automatically if debtObligations is passed instead', () => {
      const health = getMonthHealthStatus({
        netIncome: 4000000,
        vitalMinimum: 2000000,
        debtObligations: 1000000, // saving capacity = 1M (25%)
      });
      expect(health.status).toBe('peace');
      expect(health.savingCapacity).toBe(1000000);
      expect(health.savingCapacityPct).toBe(25);
    });

    it('returns "alert" (Alerta) when saving capacity is between 1% and 19%', () => {
      const health = getMonthHealthStatus({
        netIncome: 4000000,
        vitalMinimum: 2500000,
        savingCapacity: 400000, // 10%
      });
      expect(health.status).toBe('alert');
      expect(health.savingCapacityPct).toBe(10);
      expect(health.explanation).toContain('Alerta');
    });

    it('returns "risk" (Riesgo) when saving capacity is 0 or negative', () => {
      const health = getMonthHealthStatus({
        netIncome: 3000000,
        vitalMinimum: 2500000,
        savingCapacity: 0,
      });
      expect(health.status).toBe('risk');
      expect(health.savingCapacityPct).toBe(0);
      expect(health.explanation).toContain('Riesgo');
    });

    it('returns "risk" when vital minimum exceeds net income', () => {
      const health = getMonthHealthStatus({
        netIncome: 2000000,
        vitalMinimum: 2500000,
        savingCapacity: 0,
      });
      expect(health.status).toBe('risk');
      expect(health.explanation).toMatch(/Mínimo Vital|supera/i);
    });

    it('handles zero or negative income safely', () => {
      const health = getMonthHealthStatus({
        netIncome: 0,
        vitalMinimum: 1500000,
        savingCapacity: 0,
      });
      expect(health.status).toBe('risk');
      expect(health.savingCapacityPct).toBe(0);
    });
  });

  describe('calculateEmergencyMonths', () => {
    it('calculates coverage correctly when vital minimum is positive', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: 5000000,
        vitalMinimum: 2500000,
      });
      expect(result.monthsCovered).toBe(2);
      expect(result.daysCovered).toBe(60);
      expect(result.nextMilestoneMonths).toBe(3);
      expect(result.goalAmount).toBe(7500000);
      expect(result.progressPct).toBe(67);
      expect(result.explanation).toBeDefined();
    });

    it('sets milestone to 1 month when covered < 1 month', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: 1000000,
        vitalMinimum: 2000000,
      });
      expect(result.monthsCovered).toBe(0.5);
      expect(result.daysCovered).toBe(15);
      expect(result.nextMilestoneMonths).toBe(1);
      expect(result.goalAmount).toBe(2000000);
      expect(result.progressPct).toBe(50);
    });

    it('sets milestone to 6 months when covered >= 3 months', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: 9000000,
        vitalMinimum: 2000000,
      });
      expect(result.monthsCovered).toBe(4.5);
      expect(result.daysCovered).toBe(135);
      expect(result.nextMilestoneMonths).toBe(6);
      expect(result.goalAmount).toBe(12000000);
      expect(result.progressPct).toBe(75);
    });

    it('celebrates total financial peace when coverage is >= 6.0 months', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: 15000000,
        vitalMinimum: 2000000,
      });
      expect(result.monthsCovered).toBe(7.5);
      expect(result.daysCovered).toBe(225);
      expect(result.nextMilestoneMonths).toBe(6);
      expect(result.progressPct).toBe(100);
      expect(result.explanation).toMatch(/Paz financiera total/i);
    });

    it('safely handles vitalMinimum === 0 without NaN or Infinity', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: 3000000,
        vitalMinimum: 0,
      });
      expect(result.monthsCovered).toBe(0);
      expect(result.daysCovered).toBe(0);
      expect(result.nextMilestoneMonths).toBe(1);
      expect(result.goalAmount).toBe(0);
      expect(result.progressPct).toBe(0);
      expect(Number.isNaN(result.monthsCovered)).toBe(false);
      expect(Number.isFinite(result.monthsCovered)).toBe(true);
      expect(result.explanation).toContain('Mínimo Vital');
    });

    it('safely handles negative balance by clamping to 0', () => {
      const result = calculateEmergencyMonths({
        emergencyFundBalance: -500000,
        vitalMinimum: 2000000,
      });
      expect(result.monthsCovered).toBe(0);
      expect(result.daysCovered).toBe(0);
      expect(result.progressPct).toBe(0);
    });
  });

  describe('calculateAnnualizedLeak', () => {
    it('calculates monthly subscription leak and annual cost', () => {
      const leak = calculateAnnualizedLeak(35000, 'monthly');
      expect(leak.monthlyEquivalent).toBe(35000);
      expect(leak.annualCost).toBe(420000);
      expect(leak.explanation).toContain('420.000');
    });

    it('calculates annual subscription leak and monthly equivalent', () => {
      const leak = calculateAnnualizedLeak(120000, 'annual');
      expect(leak.monthlyEquivalent).toBe(10000);
      expect(leak.annualCost).toBe(120000);
      expect(leak.explanation).toContain('120.000');
    });

    it('handles 0 and negative amounts safely', () => {
      const leakZero = calculateAnnualizedLeak(0, 'monthly');
      expect(leakZero.monthlyEquivalent).toBe(0);
      expect(leakZero.annualCost).toBe(0);

      const leakNegative = calculateAnnualizedLeak(-15000, 'monthly');
      expect(leakNegative.monthlyEquivalent).toBe(0);
      expect(leakNegative.annualCost).toBe(0);
    });
  });

  describe('simulatePurchase', () => {
    it('returns "safe" when quota <= 50% of saving capacity', () => {
      const result = simulatePurchase({
        amount: 600000,
        months: 6, // quota: 100.000
        savingCapacity: 1000000, // 100k <= 500k
      });
      expect(result.verdict).toBe('safe');
      expect(result.monthlyQuota).toBe(100000);
      expect(result.remainingSavingCapacity).toBe(900000);
      expect(result.explanation).toMatch(/segura/i);
    });

    it('returns "warning" when quota takes more than 50% of saving capacity', () => {
      const result = simulatePurchase({
        amount: 1800000,
        months: 3, // quota: 600.000
        savingCapacity: 1000000, // remaining: 400.000 < 500.000
      });
      expect(result.verdict).toBe('warning');
      expect(result.monthlyQuota).toBe(600000);
      expect(result.remainingSavingCapacity).toBe(400000);
      expect(result.explanation).toMatch(/cuidado|alerta/i);
    });

    it('returns "danger" when quota exceeds saving capacity', () => {
      const result = simulatePurchase({
        amount: 1200000,
        months: 1, // quota: 1.200.000
        savingCapacity: 1000000,
      });
      expect(result.verdict).toBe('danger');
      expect(result.monthlyQuota).toBe(1200000);
      expect(result.remainingSavingCapacity).toBe(-200000);
      expect(result.explanation).toMatch(/peligro|mínimo vital/i);
    });

    it('handles 1 month purchase as cash purchase', () => {
      const result = simulatePurchase({
        amount: 300000,
        months: 1,
        savingCapacity: 800000,
      });
      expect(result.verdict).toBe('safe');
      expect(result.monthlyQuota).toBe(300000);
    });

    it('safely handles 0 or negative months by treating as 1 month', () => {
      const result = simulatePurchase({
        amount: 200000,
        months: 0,
        savingCapacity: 500000,
      });
      expect(result.monthlyQuota).toBe(200000);
    });

    it('handles amount: 0 as safe purchase without cost', () => {
      const result = simulatePurchase({
        amount: 0,
        months: 3,
        savingCapacity: 500000,
      });
      expect(result.verdict).toBe('safe');
      expect(result.monthlyQuota).toBe(0);
      expect(result.remainingSavingCapacity).toBe(500000);
      expect(result.explanation).toMatch(/sin costo/i);
    });
  });

  describe('getDailyCoachTip', () => {
    it('warns when vitalMinimum is 0', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 3000000,
        vitalMinimum: 0,
        debtObligations: 0,
        emergencyFundBalance: 0,
        spentThisMonth: 0,
        totalLeaksAnnual: 0,
        dayOfMonth: 5,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/Mínimo Vital/i);
    });

    it('warns when income is 0', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 0,
        vitalMinimum: 1500000,
        debtObligations: 0,
        emergencyFundBalance: 0,
        spentThisMonth: 0,
        totalLeaksAnnual: 0,
        dayOfMonth: 5,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/ingreso/i);
    });

    it('alerts when vital minimum exceeds net income', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 1800000,
        vitalMinimum: 2200000,
        debtObligations: 0,
        emergencyFundBalance: 500000,
        spentThisMonth: 0,
        totalLeaksAnnual: 0,
        dayOfMonth: 10,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/supera|atención|prioriza/i);
    });

    it('alerts when debts consume more than 40% of income', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 4000000,
        vitalMinimum: 1500000,
        debtObligations: 2000000, // 50% of income
        emergencyFundBalance: 1500000,
        spentThisMonth: 100000,
        totalLeaksAnnual: 0,
        dayOfMonth: 12,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/deudas/i);
    });

    it('encourages emergency fund when less than 1 month covered', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 4000000,
        vitalMinimum: 2000000,
        debtObligations: 300000,
        emergencyFundBalance: 500000, // < 2M
        spentThisMonth: 200000,
        totalLeaksAnnual: 0,
        dayOfMonth: 15,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/Colchón|Tranquilidad|1 mes/i);
    });

    it('warns about high subscription leaks', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 5000000,
        vitalMinimum: 2000000,
        debtObligations: 200000,
        emergencyFundBalance: 4000000,
        spentThisMonth: 500000,
        totalLeaksAnnual: 840000,
        dayOfMonth: 15,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/suscripciones|fugas/i);
    });

    it('gives positive peace tip when finances are healthy', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 5000000,
        vitalMinimum: 2000000,
        debtObligations: 200000,
        emergencyFundBalance: 6000000,
        spentThisMonth: 500000,
        totalLeaksAnnual: 100000,
        dayOfMonth: 20,
      };
      const tip = getDailyCoachTip(snapshot);
      expect(tip).toMatch(/Paz|paso firme|protegido|tranquilidad/i);
    });

    it('uses empathetic no-guilt tone and mentions Tu Guaca in evaluateCoachRules', () => {
      const snapshot: CoachSnapshot = {
        netIncome: 1500000,
        vitalMinimum: 2000000,
        debtObligations: 0,
        emergencyFundBalance: 100000,
        spentThisMonth: 0,
        totalLeaksAnnual: 0,
        dayOfMonth: 10,
      };
      const tip = evaluateCoachRules(snapshot);
      expect(tip).toMatch(/Ey, este mes estuvo movido/i);
      expect(tip).toMatch(/tranqui|sagrado/i);

      const snapshotGuaca: CoachSnapshot = {
        netIncome: 3000000,
        vitalMinimum: 1500000,
        debtObligations: 0,
        emergencyFundBalance: 500000,
        spentThisMonth: 0,
        totalLeaksAnnual: 0,
        dayOfMonth: 5,
      };
      const tipGuaca = evaluateCoachRules(snapshotGuaca);
      expect(tipGuaca).toContain('Tu Guaca');
    });
  });

  describe('calculateSafeAllowance', () => {
    it('calculates daily and weekly allowance for fixed salary profile', () => {
      const result = calculateSafeAllowance({
        guiltFreeAvailable: 300000,
        daysRemainingInMonth: 10,
        profileType: 'salary',
      });
      expect(result.profileType).toBe('salary');
      expect(result.profileLabel).toBe('Sueldo fijo');
      expect(result.dailyAllowance).toBe(30000); // 300.000 / 10
      expect(result.weeklyAllowance).toBe(210000); // 30.000 * 7
      expect(result.daysRemaining).toBe(10);
      expect(result.headlineMessage).toMatch(/luz verde|30\.000/i);
    });

    it('adapts headline message for student / allowance profile', () => {
      const result = calculateSafeAllowance({
        guiltFreeAvailable: 150000,
        daysRemainingInMonth: 15,
        profileType: 'student',
      });
      expect(result.profileType).toBe('student');
      expect(result.profileLabel).toBe('Estudiante / Mesada');
      expect(result.dailyAllowance).toBe(10000);
      expect(result.weeklyAllowance).toBe(70000);
      expect(result.headlineMessage).toMatch(/Con tu mesada te alcanza para/i);
    });

    it('adapts headline message for variable / independent income profile', () => {
      const result = calculateSafeAllowance({
        guiltFreeAvailable: 400000,
        daysRemainingInMonth: 20,
        profileType: 'variable',
      });
      expect(result.profileType).toBe('variable');
      expect(result.profileLabel).toBe('Independiente / Variable');
      expect(result.dailyAllowance).toBe(20000);
      expect(result.weeklyAllowance).toBe(140000);
      expect(result.headlineMessage).toMatch(/Para que la plata te rinda parejo este mes/i);
    });

    it('defaults to salary profile when profileType is omitted', () => {
      const result = calculateSafeAllowance({
        guiltFreeAvailable: 200000,
        daysRemainingInMonth: 10,
      });
      expect(result.profileType).toBe('salary');
      expect(result.profileLabel).toBe('Sueldo fijo');
    });

    it('handles zero or negative guiltFreeAvailable with warm empathetic no-guilt message', () => {
      const resultZero = calculateSafeAllowance({
        guiltFreeAvailable: 0,
        daysRemainingInMonth: 12,
        profileType: 'salary',
      });
      expect(resultZero.dailyAllowance).toBe(0);
      expect(resultZero.weeklyAllowance).toBe(0);
      expect(resultZero.daysRemaining).toBe(12);
      expect(resultZero.headlineMessage).toBe(
        'Este mes ya cubriste lo tuyo al ras, tranqui: vamos paso a paso cuidando lo esencial.'
      );

      const resultNegative = calculateSafeAllowance({
        guiltFreeAvailable: -50000,
        daysRemainingInMonth: 8,
      });
      expect(resultNegative.dailyAllowance).toBe(0);
      expect(resultNegative.weeklyAllowance).toBe(0);
      expect(resultNegative.headlineMessage).toContain('tranqui: vamos paso a paso');
    });

    it('clamps days remaining safely between 1 and 31', () => {
      const resultLow = calculateSafeAllowance({
        guiltFreeAvailable: 100000,
        daysRemainingInMonth: 0,
      });
      expect(resultLow.daysRemaining).toBe(1);
      expect(resultLow.dailyAllowance).toBe(100000);

      const resultHigh = calculateSafeAllowance({
        guiltFreeAvailable: 310000,
        daysRemainingInMonth: 45,
      });
      expect(resultHigh.daysRemaining).toBe(31);
      expect(resultHigh.dailyAllowance).toBe(10000);
    });

    it('caps weekly allowance to available funds when remaining days < 7', () => {
      const result = calculateSafeAllowance({
        guiltFreeAvailable: 60000,
        daysRemainingInMonth: 3,
      });
      expect(result.dailyAllowance).toBe(20000); // 60k / 3
      expect(result.weeklyAllowance).toBe(60000); // Min(60k, 20k * 3) = 60k, not 140k
    });
  });

  describe('analyzeSpendingDetective', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx1',
        amount: 200000,
        type: 'expense',
        pillar: 'leisure',
        walletId: 'w1',
        categoryId: 'Restaurantes y Ocio',
        date: '2026-11-05T12:00:00.000Z',
        createdAt: '2026-11-05T12:00:00.000Z',
      },
      {
        id: 'tx2',
        amount: 100000,
        type: 'expense',
        pillar: 'leisure',
        walletId: 'w1',
        categoryId: 'Restaurantes y Ocio',
        date: '2026-11-08T12:00:00.000Z',
        createdAt: '2026-11-08T12:00:00.000Z',
      },
      {
        id: 'tx3',
        amount: 80000,
        type: 'expense',
        pillar: 'leisure',
        walletId: 'w1',
        categoryId: 'Café y Domicilios',
        date: '2026-11-10T12:00:00.000Z',
        createdAt: '2026-11-10T12:00:00.000Z',
      },
      {
        id: 'tx_vital',
        amount: 500000,
        type: 'expense',
        pillar: 'vital',
        walletId: 'w1',
        categoryId: 'Mercado',
        date: '2026-11-02T12:00:00.000Z',
        createdAt: '2026-11-02T12:00:00.000Z',
      },
      {
        id: 'tx_old_month',
        amount: 300000,
        type: 'expense',
        pillar: 'leisure',
        walletId: 'w1',
        categoryId: 'Ropa',
        date: '2026-10-15T12:00:00.000Z',
        createdAt: '2026-10-15T12:00:00.000Z',
      },
    ];

    const mockSubscriptions: SubscriptionLeak[] = [
      {
        id: 'sub1',
        name: 'Streaming Premium',
        amount: 40000,
        frequency: 'monthly',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'sub_inactive',
        name: 'Gimnasio Inactivo',
        amount: 80000,
        frequency: 'monthly',
        isActive: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const mockDebts: Debt[] = [
      {
        id: 'd1',
        name: 'Tarjeta Bancaria',
        creditor: 'Banco',
        originalBalance: 2000000,
        remainingBalance: 1200000,
        minimumMonthlyPayment: 100000,
        estimatedMonthlyRatePct: 2.1,
        isPaid: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    it('identifies top discretionary spending and subscriptions with annual savings', () => {
      const insights = analyzeSpendingDetective({
        transactions: mockTransactions,
        subscriptions: mockSubscriptions,
        vitalMinimum: 1500000, // $ 50.000 / day
        emergencyFundBalance: 500000,
        debts: mockDebts,
        now: new Date('2026-11-15T00:00:00.000Z'),
      });

      expect(insights.length).toBeGreaterThan(0);
      expect(insights.length).toBeLessThanOrEqual(3);

      // Verify sorted by annual savings descending
      for (let i = 0; i < insights.length - 1; i++) {
        expect(insights[i].annualSavings).toBeGreaterThanOrEqual(insights[i + 1].annualSavings);
      }

      // Check category insight
      const restInsight = insights.find((i) => i.categoryOrLeakName === 'Restaurantes y Ocio');
      expect(restInsight).toBeDefined();
      expect(restInsight?.monthlySpend).toBe(300000);
      expect(restInsight?.suggestedCutAmount).toBe(105000); // 35% of 300.000
      expect(restInsight?.annualSavings).toBe(1260000); // 105.000 * 12
      expect(restInsight?.daysOfGuacaGained).toBeGreaterThanOrEqual(1);
      expect(restInsight?.nequiMessage).toMatch(/Tu Guaca|Restaurantes/i);

      // Check subscription insight
      const subInsight = insights.find((i) => i.categoryOrLeakName === 'Streaming Premium');
      expect(subInsight).toBeDefined();
      expect(subInsight?.sourceType).toBe('subscription');
      expect(subInsight?.monthlySpend).toBe(40000);
      expect(subInsight?.annualSavings).toBe(480000); // 40.000 * 12
      expect(subInsight?.nequiMessage).toMatch(/Streaming Premium/i);
    });

    it('returns empty array when there are no transactions or subscriptions', () => {
      const insights = analyzeSpendingDetective({
        transactions: [],
        subscriptions: [],
        vitalMinimum: 1500000,
        now: new Date('2026-11-15T00:00:00.000Z'),
      });
      expect(insights).toEqual([]);
    });

    it('calculates days of Guaca gained correctly based on daily vital minimum', () => {
      const insights = analyzeSpendingDetective({
        transactions: [
          {
            id: 'tx_bar',
            amount: 200000,
            type: 'expense',
            pillar: 'leisure',
            walletId: 'w1',
            categoryId: 'Salidas',
            date: '2026-11-02T10:00:00.000Z',
            createdAt: '2026-11-02T10:00:00.000Z',
          },
        ],
        subscriptions: [],
        vitalMinimum: 1500000, // 50.000/day
        now: new Date('2026-11-15T00:00:00.000Z'),
      });

      expect(insights.length).toBe(1);
      // Cut is 35% of 200k = 70k. Annual savings = 840k. Daily vital = 50k. Days = 840k / 50k = 17 days.
      expect(insights[0].daysOfGuacaGained).toBe(17);
    });
  });
});
