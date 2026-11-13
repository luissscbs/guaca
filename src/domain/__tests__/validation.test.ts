import {
  validatePositiveAmount,
  validateNonNegativeAmount,
  validateName,
  validateTransferWallets,
  validateDays,
  validateBackupPayload,
  validateProfileType,
  validatePillar,
} from '../validation';
import { BackupPayload } from '../types';

describe('Validation Domain Engine', () => {
  describe('validatePositiveAmount', () => {
    it('accepts positive integer COP amounts', () => {
      const result = validatePositiveAmount(50000);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(50000);
      expect(result.error).toBeUndefined();
    });

    it('rejects 0 with clear message', () => {
      const result = validatePositiveAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/mayor a cero/i);
    });

    it('rejects negative amounts', () => {
      const result = validatePositiveAmount(-10000);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/mayor a cero/i);
    });

    it('rejects NaN, Infinity, strings, and null', () => {
      expect(validatePositiveAmount(NaN).isValid).toBe(false);
      expect(validatePositiveAmount(Infinity).isValid).toBe(false);
      expect(validatePositiveAmount('50000').isValid).toBe(false);
      expect(validatePositiveAmount(null).isValid).toBe(false);
      expect(validatePositiveAmount(undefined).isValid).toBe(false);
    });

    it('rounds or rejects non-integer floats according to integer COP rule', () => {
      const result = validatePositiveAmount(1500.75);
      // Integers required: should round to integer or validate
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(1501);
    });

    it('rejects amounts exceeding the maximum safe limit (100 billones COP)', () => {
      const resultExcessive = validatePositiveAmount(100_000_000_000_001);
      expect(resultExcessive.isValid).toBe(false);
      expect(resultExcessive.error).toMatch(/límite|máximo/i);
    });

    it('rejects non-safe integers', () => {
      const unsafe = Number.MAX_SAFE_INTEGER + 100;
      const result = validatePositiveAmount(unsafe);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/seguro|límite/i);
    });
  });

  describe('validateName', () => {
    it('accepts valid sanitized names', () => {
      const result = validateName('Bancolombia Ahorros');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('Bancolombia Ahorros');
    });

    it('trims leading and trailing whitespace', () => {
      const result = validateName('   Mercado Mensual   ');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('Mercado Mensual');
    });

    it('strips dangerous control characters', () => {
      const result = validateName('Nequi\x00\x1F\x7F Personal');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('Nequi Personal');
    });

    it('rejects empty string or whitespace-only string', () => {
      const resultEmpty = validateName('');
      expect(resultEmpty.isValid).toBe(false);
      expect(resultEmpty.error).toMatch(/no puede estar vacío/i);

      const resultSpaces = validateName('     ');
      expect(resultSpaces.isValid).toBe(false);
    });

    it('rejects names exceeding max length', () => {
      const longName = 'A'.repeat(101);
      const result = validateName(longName, 'Nombre', 1, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/100 caracteres/i);
    });

    it('rejects non-string values', () => {
      expect(validateName(null).isValid).toBe(false);
      expect(validateName(123).isValid).toBe(false);
      expect(validateName({}).isValid).toBe(false);
    });
  });

  describe('validateTransferWallets', () => {
    it('accepts distinct source and destination wallet IDs', () => {
      const result = validateTransferWallets('wallet-bancolombia', 'wallet-nequi');
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual({
        sourceWalletId: 'wallet-bancolombia',
        destinationWalletId: 'wallet-nequi',
      });
    });

    it('rejects transfer when source and destination are the exact same account', () => {
      const result = validateTransferWallets('wallet-bancolombia', 'wallet-bancolombia');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/no pueden ser la misma/i);
    });

    it('rejects empty or missing wallet IDs', () => {
      expect(validateTransferWallets('', 'wallet-nequi').isValid).toBe(false);
      expect(validateTransferWallets('wallet-1', '').isValid).toBe(false);
      expect(validateTransferWallets(null as unknown as string, 'wallet-1').isValid).toBe(false);
    });
  });

  describe('validateDays', () => {
    it('accepts valid cutoffDay and dueDay (1..31)', () => {
      const result = validateDays({ cutoffDay: 15, dueDay: 30 });
      expect(result.isValid).toBe(true);
      expect(result.value?.cutoffDay).toBe(15);
      expect(result.value?.dueDay).toBe(30);
    });

    it('rejects cutoffDay or dueDay outside 1..31', () => {
      expect(validateDays({ cutoffDay: 0 }).isValid).toBe(false);
      expect(validateDays({ cutoffDay: 32 }).isValid).toBe(false);
      expect(validateDays({ dueDay: -1 }).isValid).toBe(false);
      expect(validateDays({ dueDay: 35 }).isValid).toBe(false);
    });

    it('accepts valid monthStartDay (1..28)', () => {
      const result = validateDays({ monthStartDay: 15 });
      expect(result.isValid).toBe(true);
      expect(result.value?.monthStartDay).toBe(15);
    });

    it('rejects monthStartDay outside 1..28 (e.g. 29, 30, 31)', () => {
      const result29 = validateDays({ monthStartDay: 29 });
      expect(result29.isValid).toBe(false);
      expect(result29.error).toMatch(/entre 1 y 28/i);

      const result0 = validateDays({ monthStartDay: 0 });
      expect(result0.isValid).toBe(false);
    });

    it('rejects non-numeric types (boolean, strings, arrays, objects)', () => {
      expect(validateDays({ cutoffDay: true as unknown as number }).isValid).toBe(false);
      expect(validateDays({ cutoffDay: false as unknown as number }).isValid).toBe(false);
      expect(validateDays({ dueDay: '15' as unknown as number }).isValid).toBe(false);
      expect(validateDays({ monthStartDay: [15] as unknown as number }).isValid).toBe(false);
      expect(validateDays({ cutoffDay: { day: 15 } as unknown as number }).isValid).toBe(false);
    });
  });

  describe('validateBackupPayload', () => {
    const validPayload: BackupPayload = {
      metadata: {
        version: 2,
        exportedAt: '2026-11-12T12:00:00.000Z',
        appVersion: '2.0.0',
      },
      settings: {
        userName: 'Carlos',
        currency: 'COP',
        netMonthlyIncome: 4500000,
        vitalMinimumBreakdown: {
          housing: 1200000,
          food: 800000,
          utilities: 300000,
          transport: 200000,
        },
        monthStartDay: 1,
        isPrivateMode: false,
        onboardingCompleted: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      wallets: [
        {
          id: 'w-1',
          name: 'Bancolombia',
          type: 'bank',
          balance: 2500000,
          isArchived: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      creditCards: [],
      debts: [],
      transactions: [],
      budgets: [],
      subscriptions: [],
      savingsGoals: [],
    };

    it('accepts a complete, valid backup payload', () => {
      const result = validateBackupPayload(validPayload);
      expect(result.isValid).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value?.settings.userName).toBe('Carlos');
    });

    it('rejects non-object inputs', () => {
      expect(validateBackupPayload(null).isValid).toBe(false);
      expect(validateBackupPayload('string').isValid).toBe(false);
      expect(validateBackupPayload([]).isValid).toBe(false);
    });

    it('rejects when metadata is missing or version < 1', () => {
      const invalid = { ...validPayload, metadata: { ...validPayload.metadata, version: 0 } };
      expect(validateBackupPayload(invalid).isValid).toBe(false);
    });

    it('rejects invalid metadata version (NaN, Infinity, float, negative)', () => {
      expect(
        validateBackupPayload({
          ...validPayload,
          metadata: { ...validPayload.metadata, version: NaN },
        }).isValid
      ).toBe(false);

      expect(
        validateBackupPayload({
          ...validPayload,
          metadata: { ...validPayload.metadata, version: Infinity },
        }).isValid
      ).toBe(false);

      expect(
        validateBackupPayload({
          ...validPayload,
          metadata: { ...validPayload.metadata, version: 1.5 },
        }).isValid
      ).toBe(false);

      expect(
        validateBackupPayload({
          ...validPayload,
          metadata: { ...validPayload.metadata, version: -2 },
        }).isValid
      ).toBe(false);
    });

    it('rejects deeply nested JSON exceeding max depth (depth > 20 stack guard)', () => {
      // Build 25 levels of nesting
      let deepObj: Record<string, unknown> = { key: 'deep' };
      for (let i = 0; i < 25; i++) {
        deepObj = { nested: deepObj };
      }
      const maliciousPayload = {
        ...validPayload,
        settings: {
          ...validPayload.settings,
          customData: deepObj,
        },
      };

      const result = validateBackupPayload(maliciousPayload);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/seguridad|profundidad|sospechoso/i);
    });

    it('rejects invalid elements inside collections (null, primitives, incomplete objects)', () => {
      // Wallets with null or invalid
      expect(
        validateBackupPayload({
          ...validPayload,
          wallets: [null as unknown as object],
        }).isValid
      ).toBe(false);

      expect(
        validateBackupPayload({
          ...validPayload,
          wallets: [123 as unknown as object],
        }).isValid
      ).toBe(false);

      expect(
        validateBackupPayload({
          ...validPayload,
          wallets: [{ id: 'w-1' } as unknown as object], // missing name/balance/type
        }).isValid
      ).toBe(false);

      // Debts with invalid element
      expect(
        validateBackupPayload({
          ...validPayload,
          debts: ['invalid' as unknown as object],
        }).isValid
      ).toBe(false);

      // Credit cards with invalid element
      expect(
        validateBackupPayload({
          ...validPayload,
          creditCards: [{ id: 'cc-1' } as unknown as object],
        }).isValid
      ).toBe(false);

      // Transactions with invalid amount
      expect(
        validateBackupPayload({
          ...validPayload,
          transactions: [{ id: 't-1', amount: NaN } as unknown as object],
        }).isValid
      ).toBe(false);

      // Subscriptions with invalid frequency
      expect(
        validateBackupPayload({
          ...validPayload,
          subscriptions: [{ id: 's-1', name: 'Netflix', amount: 30000, frequency: 'weekly' } as unknown as object],
        }).isValid
      ).toBe(false);
    });

    it('rejects collections exceeding the maximum size limit (50.000 items)', () => {
      const hugeArray = new Array(50001).fill(validPayload.wallets[0]);
      const invalid = { ...validPayload, wallets: hugeArray };
      const result = validateBackupPayload(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/límite|50\.000|tamaño/i);
    });

    it('rejects invalid currency', () => {
      const invalid = {
        ...validPayload,
        settings: { ...validPayload.settings, currency: 'USD' },
      };
      expect(validateBackupPayload(invalid).isValid).toBe(false);
      expect(validateBackupPayload(invalid).error).toMatch(/COP/i);
    });

    it('rejects prototype pollution attempts containing __proto__', () => {
      const maliciousJson = JSON.parse(
        '{"metadata":{"version":2,"exportedAt":"2026-11-12T12:00:00.000Z","appVersion":"2.0.0"},"__proto__":{"polluted":true}}'
      );
      const result = validateBackupPayload(maliciousJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/seguridad|inválida|sospechoso/i);
    });

    it('rejects prototype pollution attempts containing constructor or prototype', () => {
      const maliciousObj = {
        ...validPayload,
        settings: {
          ...validPayload.settings,
          constructor: { polluted: true },
        },
      };
      const result = validateBackupPayload(maliciousObj);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/seguridad|inválida|sospechoso/i);
    });

    it('rejects when wallets or other collections are not arrays', () => {
      const invalid = { ...validPayload, wallets: 'not-an-array' };
      expect(validateBackupPayload(invalid).isValid).toBe(false);
    });
  });

  describe('validateProfileType', () => {
    it('accepts valid profile types: salary, student, variable', () => {
      expect(validateProfileType('salary')).toEqual({ isValid: true, value: 'salary' });
      expect(validateProfileType('student')).toEqual({ isValid: true, value: 'student' });
      expect(validateProfileType('variable')).toEqual({ isValid: true, value: 'variable' });
    });

    it('defaults to salary when undefined or null is provided', () => {
      expect(validateProfileType(undefined)).toEqual({ isValid: true, value: 'salary' });
      expect(validateProfileType(null)).toEqual({ isValid: true, value: 'salary' });
    });

    it('rejects invalid profile types with a friendly message', () => {
      const result = validateProfileType('invalid_type');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/perfil de ingreso/i);
    });

    it('rejects non-string values that are not null/undefined', () => {
      expect(validateProfileType(123).isValid).toBe(false);
      expect(validateProfileType({}).isValid).toBe(false);
    });
  });

  describe('validateNonNegativeAmount', () => {
    it('accepts zero (0)', () => {
      const result = validateNonNegativeAmount(0);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('accepts positive integer COP amounts', () => {
      const result = validateNonNegativeAmount(50000);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(50000);
    });

    it('rounds floating numbers to nearest integer', () => {
      const result = validateNonNegativeAmount(12500.4);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(12500);
    });

    it('rejects negative numbers', () => {
      const result = validateNonNegativeAmount(-500);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/no puede ser negativo/i);
    });

    it('rejects NaN, Infinity, strings, null and undefined', () => {
      expect(validateNonNegativeAmount(NaN).isValid).toBe(false);
      expect(validateNonNegativeAmount(Infinity).isValid).toBe(false);
      expect(validateNonNegativeAmount('0').isValid).toBe(false);
      expect(validateNonNegativeAmount(null).isValid).toBe(false);
      expect(validateNonNegativeAmount(undefined).isValid).toBe(false);
    });

    it('rejects amounts exceeding MAX_SAFE_COP_AMOUNT', () => {
      const result = validateNonNegativeAmount(100_000_000_000_001);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/límite máximo/i);
    });
  });

  describe('validatePillar', () => {
    it('accepts all 6 valid financial pillars', () => {
      const pillars = ['vital', 'growth', 'leisure', 'debt', 'income', 'transfer'] as const;
      for (const p of pillars) {
        const result = validatePillar(p);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(p);
      }
    });

    it('rejects invalid or unknown pillars', () => {
      expect(validatePillar('unknown').isValid).toBe(false);
      expect(validatePillar('').isValid).toBe(false);
      expect(validatePillar(null).isValid).toBe(false);
      expect(validatePillar(undefined).isValid).toBe(false);
      expect(validatePillar(123).isValid).toBe(false);
    });
  });
});
