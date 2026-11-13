/**
 * Guaca v2: Input Validation Domain Engine
 * Validaciones estrictas de entradas, traslados, días y respaldos JSON con protección contra Prototype Pollution.
 * Todo en español cotidiano para feedback directo al usuario.
 */

import { roundCOP } from '../utils/formatters';
import {
  BackupPayload,
  Budget,
  CreditCard,
  Debt,
  SavingsGoal,
  SubscriptionLeak,
  Transaction,
  UserProfileType,
  ValidationResult,
  Wallet,
} from './types';

// Límite superior seguro para montos en COP ($ 100 billones de pesos)
export const MAX_SAFE_COP_AMOUNT = 100_000_000_000_000;
// Límite máximo de registros por colección en respaldo local
export const MAX_COLLECTION_RECORDS = 50_000;
// Límite de profundidad máxima para detección de Prototype Pollution (protección contra desbordamiento de pila)
export const MAX_JSON_DEPTH = 20;

/**
 * Valida que un monto monetario sea un número entero finito estrictamente positivo (> 0).
 * Redondea valores de punto flotante a enteros de pesos COP y valida límites seguros.
 */
export function validatePositiveAmount(
  value: unknown,
  fieldName: string = 'El monto'
): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} debe ser un número entero mayor a cero.`,
    };
  }

  const rounded = roundCOP(value);

  if (rounded <= 0) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} debe ser un número mayor a cero.`,
    };
  }

  if (!Number.isSafeInteger(rounded) || rounded > MAX_SAFE_COP_AMOUNT) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} supera el límite máximo seguro permitido ($ 100 billones COP).`,
    };
  }

  return {
    isValid: true,
    value: rounded,
  };
}

/**
 * Sanitiza y valida nombres de cuentas, categorías o movimientos.
 * Elimina caracteres de control y valida longitud mínima y máxima.
 */
export function validateName(
  name: unknown,
  fieldName: string = 'Nombre',
  minLength: number = 1,
  maxLength: number = 100
): ValidationResult<string> {
  if (typeof name !== 'string') {
    return {
      isValid: false,
      value: '',
      error: `${fieldName} debe ser un texto válido.`,
    };
  }

  // Eliminar caracteres de control ASCII (0-31 y 127-159)
  const sanitized = name.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

  if (sanitized.length < minLength) {
    return {
      isValid: false,
      value: '',
      error: `${fieldName} no puede estar vacío.`,
    };
  }

  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      value: sanitized,
      error: `${fieldName} no puede superar los ${maxLength} caracteres.`,
    };
  }

  return {
    isValid: true,
    value: sanitized,
  };
}

/**
 * Valida que una transferencia entre cuentas tenga origen y destino distintos y válidos.
 */
export function validateTransferWallets(
  sourceWalletId: unknown,
  destinationWalletId: unknown
): ValidationResult<{ sourceWalletId: string; destinationWalletId: string }> {
  if (
    typeof sourceWalletId !== 'string' ||
    typeof destinationWalletId !== 'string' ||
    sourceWalletId.trim() === '' ||
    destinationWalletId.trim() === ''
  ) {
    return {
      isValid: false,
      error: 'Debes seleccionar una cuenta de origen y una cuenta de destino válidas.',
    };
  }

  const source = sourceWalletId.trim();
  const dest = destinationWalletId.trim();

  if (source === dest) {
    return {
      isValid: false,
      error: 'La cuenta de origen y destino no pueden ser la misma.',
    };
  }

  return {
    isValid: true,
    value: {
      sourceWalletId: source,
      destinationWalletId: dest,
    },
  };
}

/**
 * Valida días del mes para tarjetas de crédito (1..31) e inicio de mes contable (1..28).
 * Exige estrictamente números enteros primitivos.
 */
export function validateDays(options: {
  cutoffDay?: unknown;
  dueDay?: unknown;
  monthStartDay?: unknown;
}): ValidationResult<{ cutoffDay?: number; dueDay?: number; monthStartDay?: number }> {
  const resultValue: { cutoffDay?: number; dueDay?: number; monthStartDay?: number } = {};

  if (options.cutoffDay !== undefined) {
    if (typeof options.cutoffDay !== 'number' || !Number.isInteger(options.cutoffDay)) {
      return {
        isValid: false,
        error: 'El día de corte debe ser un número entero entre 1 y 31.',
      };
    }
    if (options.cutoffDay < 1 || options.cutoffDay > 31) {
      return {
        isValid: false,
        error: 'El día de corte debe ser un número entero entre 1 y 31.',
      };
    }
    resultValue.cutoffDay = options.cutoffDay;
  }

  if (options.dueDay !== undefined) {
    if (typeof options.dueDay !== 'number' || !Number.isInteger(options.dueDay)) {
      return {
        isValid: false,
        error: 'El día límite de pago debe ser un número entero entre 1 y 31.',
      };
    }
    if (options.dueDay < 1 || options.dueDay > 31) {
      return {
        isValid: false,
        error: 'El día límite de pago debe ser un número entero entre 1 y 31.',
      };
    }
    resultValue.dueDay = options.dueDay;
  }

  if (options.monthStartDay !== undefined) {
    if (typeof options.monthStartDay !== 'number' || !Number.isInteger(options.monthStartDay)) {
      return {
        isValid: false,
        error: 'El día de inicio de mes debe ser un número entero entre 1 y 28.',
      };
    }
    if (options.monthStartDay < 1 || options.monthStartDay > 28) {
      return {
        isValid: false,
        error: 'El día de inicio de mes debe ser un número entero entre 1 y 28.',
      };
    }
    resultValue.monthStartDay = options.monthStartDay;
  }

  return {
    isValid: true,
    value: resultValue,
  };
}

/**
 * Valida el tipo de perfil de ingresos del usuario ('salary' | 'student' | 'variable').
 * Por defecto asigna 'salary' si el valor es null o undefined.
 */
export function validateProfileType(type: unknown): ValidationResult<UserProfileType> {
  if (type === undefined || type === null) {
    return {
      isValid: true,
      value: 'salary',
    };
  }

  if (type === 'salary' || type === 'student' || type === 'variable') {
    return {
      isValid: true,
      value: type,
    };
  }

  return {
    isValid: false,
    error: 'El tipo de perfil de ingreso debe ser: sueldo fijo (salary), estudiante (student) o independiente (variable).',
  };
}

/**
 * Detecta recursivamente cualquier intento de Prototype Pollution (__proto__, constructor, prototype).
 * Corta recursión y retorna true si depth > MAX_JSON_DEPTH para evitar stack overflow.
 */
function containsPrototypePollution(target: unknown, depth: number = 0): boolean {
  if (depth > MAX_JSON_DEPTH) {
    return true; // Exceso de profundidad sospechoso o ataque de desbordamiento de pila
  }

  if (!target || typeof target !== 'object') {
    return false;
  }

  if (Array.isArray(target)) {
    return target.some((item) => containsPrototypePollution(item, depth + 1));
  }

  const record = target as Record<string, unknown>;
  const keys = Object.getOwnPropertyNames(record);

  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }

    if (containsPrototypePollution(record[key], depth + 1)) {
      return true;
    }
  }

  return false;
}

/**
 * Valida los elementos individuales de una colección del respaldo.
 */
function validateCollectionItems(payload: Partial<BackupPayload>): string | null {
  // 1. Wallets
  const wallets = payload.wallets as unknown[];
  for (const item of wallets) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró una cuenta inválida en la lista de cuentas.';
    }
    const w = item as Partial<Wallet>;
    if (
      typeof w.id !== 'string' ||
      w.id.trim() === '' ||
      typeof w.name !== 'string' ||
      w.name.trim() === '' ||
      !['bank', 'cash', 'digital', 'vault'].includes(w.type as string) ||
      typeof w.balance !== 'number' ||
      !Number.isFinite(w.balance)
    ) {
      return 'Una de las cuentas contiene campos obligatorios incompletos o corruptos.';
    }
  }

  // 2. Credit Cards
  const creditCards = payload.creditCards as unknown[];
  for (const item of creditCards) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró una tarjeta de crédito inválida.';
    }
    const c = item as Partial<CreditCard>;
    if (
      typeof c.id !== 'string' ||
      c.id.trim() === '' ||
      typeof c.name !== 'string' ||
      c.name.trim() === '' ||
      typeof c.creditLimit !== 'number' ||
      !Number.isFinite(c.creditLimit) ||
      typeof c.currentBalance !== 'number' ||
      !Number.isFinite(c.currentBalance)
    ) {
      return 'Una de las tarjetas de crédito contiene campos obligatorios incompletos.';
    }
  }

  // 3. Debts
  const debts = payload.debts as unknown[];
  for (const item of debts) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró una deuda inválida.';
    }
    const d = item as Partial<Debt>;
    if (
      typeof d.id !== 'string' ||
      d.id.trim() === '' ||
      typeof d.name !== 'string' ||
      d.name.trim() === '' ||
      typeof d.remainingBalance !== 'number' ||
      !Number.isFinite(d.remainingBalance) ||
      typeof d.minimumMonthlyPayment !== 'number' ||
      !Number.isFinite(d.minimumMonthlyPayment)
    ) {
      return 'Una de las deudas contiene campos obligatorios incompletos.';
    }
  }

  // 4. Transactions
  const transactions = payload.transactions as unknown[];
  for (const item of transactions) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró un movimiento inválido.';
    }
    const t = item as Partial<Transaction>;
    if (
      typeof t.id !== 'string' ||
      t.id.trim() === '' ||
      typeof t.amount !== 'number' ||
      !Number.isFinite(t.amount) ||
      !['expense', 'income', 'transfer'].includes(t.type as string) ||
      typeof t.walletId !== 'string' ||
      t.walletId.trim() === ''
    ) {
      return 'Uno de los movimientos contiene información incompleta o corrupta.';
    }
  }

  // 5. Budgets
  const budgets = payload.budgets as unknown[];
  for (const item of budgets) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró un presupuesto inválido.';
    }
    const b = item as Partial<Budget>;
    if (
      typeof b.id !== 'string' ||
      b.id.trim() === '' ||
      typeof b.categoryId !== 'string' ||
      b.categoryId.trim() === '' ||
      typeof b.monthlyLimit !== 'number' ||
      !Number.isFinite(b.monthlyLimit)
    ) {
      return 'Uno de los presupuestos contiene campos obligatorios incompletos.';
    }
  }

  // 6. Subscriptions
  const subscriptions = payload.subscriptions as unknown[];
  for (const item of subscriptions) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró una suscripción inválida.';
    }
    const s = item as Partial<SubscriptionLeak>;
    if (
      typeof s.id !== 'string' ||
      s.id.trim() === '' ||
      typeof s.name !== 'string' ||
      s.name.trim() === '' ||
      typeof s.amount !== 'number' ||
      !Number.isFinite(s.amount) ||
      !['monthly', 'annual'].includes(s.frequency as string)
    ) {
      return 'Una de las suscripciones contiene datos incompletos.';
    }
  }

  // 7. Savings Goals
  const savingsGoals = payload.savingsGoals as unknown[];
  for (const item of savingsGoals) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return 'Se encontró una meta de ahorro inválida.';
    }
    const g = item as Partial<SavingsGoal>;
    if (
      typeof g.id !== 'string' ||
      g.id.trim() === '' ||
      typeof g.name !== 'string' ||
      g.name.trim() === '' ||
      typeof g.targetAmount !== 'number' ||
      !Number.isFinite(g.targetAmount)
    ) {
      return 'Una de las metas de ahorro contiene datos incompletos.';
    }
  }

  return null;
}

/**
 * Valida exhaustivamente un archivo de respaldo local JSON.
 * Inspecciona estructura, tipos requeridos, formato de fechas, moneda COP, elementos individuales y seguridad.
 */
export function validateBackupPayload(rawJson: unknown): ValidationResult<BackupPayload> {
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    return {
      isValid: false,
      error: 'El archivo de respaldo no tiene un formato JSON válido.',
    };
  }

  // Protección estricta contra Prototype Pollution y desbordamiento de pila
  if (containsPrototypePollution(rawJson)) {
    return {
      isValid: false,
      error: 'Archivo rechazado por razones de seguridad: contiene propiedades o profundidad sospechosa.',
    };
  }

  const payload = rawJson as Partial<BackupPayload>;

  // Validar metadata
  if (
    !payload.metadata ||
    typeof payload.metadata !== 'object' ||
    typeof payload.metadata.version !== 'number' ||
    !Number.isInteger(payload.metadata.version) ||
    payload.metadata.version < 1 ||
    typeof payload.metadata.exportedAt !== 'string' ||
    isNaN(Date.parse(payload.metadata.exportedAt))
  ) {
    return {
      isValid: false,
      error: 'El respaldo no contiene metadatos de versión o fecha válidos.',
    };
  }

  // Validar settings
  if (!payload.settings || typeof payload.settings !== 'object') {
    return {
      isValid: false,
      error: 'El respaldo no contiene la configuración de usuario.',
    };
  }

  if (payload.settings.currency !== 'COP') {
    return {
      isValid: false,
      error: 'Moneda no soportada. Guaca opera exclusivamente con Pesos Colombianos (COP).',
    };
  }

  // Validar colecciones obligatorias
  const requiredArrays = [
    'wallets',
    'creditCards',
    'debts',
    'transactions',
    'budgets',
    'subscriptions',
    'savingsGoals',
  ] as const;

  for (const field of requiredArrays) {
    const arr = payload[field];
    if (!Array.isArray(arr)) {
      return {
        isValid: false,
        error: `El respaldo contiene un formato inválido en la lista de ${field}.`,
      };
    }

    if (arr.length > MAX_COLLECTION_RECORDS) {
      return {
        isValid: false,
        error: `La colección de ${field} supera el límite máximo de ${MAX_COLLECTION_RECORDS} registros permitidos.`,
      };
    }
  }

  // Validar elementos internos de cada colección
  const collectionItemError = validateCollectionItems(payload);
  if (collectionItemError) {
    return {
      isValid: false,
      error: collectionItemError,
    };
  }

  return {
    isValid: true,
    value: payload as BackupPayload,
  };
}
