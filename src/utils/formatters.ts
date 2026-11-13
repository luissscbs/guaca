/**
 * Guaca v2: Utilities for Currency and Metric Formatting (COP)
 * Regla: Moneda sin decimales en números enteros con separador de miles por punto.
 */

export const PRIVACY_MASK = '$ •••••••';

export interface FormatCOPOptions {
  isPrivate?: boolean;
  showSign?: boolean;
}

export interface ParseCOPOptions {
  allowNegative?: boolean;
}

/**
 * Safely rounds a numeric value to an integer to prevent floating point inaccuracies.
 * Returns 0 if value is NaN or infinite.
 */
export function roundCOP(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount);
}

/**
 * Formats a number to Colombian Pesos (COP) without decimals.
 * Examples:
 *   1250000 -> "$ 1.250.000"
 *   -45000  -> "- $ 45.000"
 *   0       -> "$ 0"
 *   isPrivate: true -> "$ •••••••"
 */
export function formatCOP(amount: number, options?: FormatCOPOptions): string {
  if (options?.isPrivate) {
    return PRIVACY_MASK;
  }

  if (!Number.isFinite(amount)) {
    return '$ 0';
  }

  const rounded = roundCOP(amount);
  if (rounded === 0) {
    return '$ 0';
  }

  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);
  const formattedAbs = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (isNegative) {
    return `- $ ${formattedAbs}`;
  }

  if (options?.showSign) {
    return `+ $ ${formattedAbs}`;
  }

  return `$ ${formattedAbs}`;
}

/**
 * Extracts and parses user text input into a safe COP integer.
 * Strips formatting symbols ($ . , spaces) and rejects non-numeric entries.
 */
export function parseCOPInput(input: string, options?: ParseCOPOptions): number {
  if (!input || typeof input !== 'string') {
    return 0;
  }

  const trimmed = input.trim();
  const isNegative = options?.allowNegative && trimmed.includes('-');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) {
    return 0;
  }

  const parsed = parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return isNegative ? -parsed : parsed;
}

/**
 * Strips all non-digit characters from string (for raw numeric input bindings).
 */
export function cleanNumericInput(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Formats month duration (e.g., Emergency Fund coverage) with Colombian comma decimal.
 * Examples:
 *   2.1 -> "2,1 meses"
 *   1.0 -> "1,0 mes"
 *   0   -> "0,0 meses"
 */
export function formatMonths(months: number): string {
  if (!Number.isFinite(months) || months < 0) {
    return '0,0 meses';
  }

  const rounded = Math.round(months * 10) / 10;
  const formatted = rounded.toFixed(1).replace('.', ',');

  if (rounded === 1.0) {
    return `${formatted} mes`;
  }

  return `${formatted} meses`;
}

/**
 * Formats percentage values with comma separator.
 * Examples:
 *   15.5 -> "15,5%"
 *   20   -> "20%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  if (Number.isInteger(value)) {
    return `${value}%`;
  }

  const formatted = value.toFixed(decimals).replace('.', ',');
  return `${formatted}%`;
}
