import {
  formatCOP,
  roundCOP,
  parseCOPInput,
  formatMonths,
  formatPercentage,
  cleanNumericInput,
  formatInterestPer100k,
  PRIVACY_MASK,
} from '../formatters';

describe('formatCOP', () => {
  it('formats positive COP numbers without decimals using Colombian thousands separator', () => {
    expect(formatCOP(1250000)).toBe('$ 1.250.000');
    expect(formatCOP(50000)).toBe('$ 50.000');
    expect(formatCOP(100)).toBe('$ 100');
  });

  it('formats zero correctly', () => {
    expect(formatCOP(0)).toBe('$ 0');
  });

  it('formats negative numbers with explicit negative sign format "- $ 45.000"', () => {
    expect(formatCOP(-45000)).toBe('- $ 45.000');
    expect(formatCOP(-1250000)).toBe('- $ 1.250.000');
  });

  it('formats with positive sign when showSign is enabled', () => {
    expect(formatCOP(45000, { showSign: true })).toBe('+ $ 45.000');
    expect(formatCOP(-45000, { showSign: true })).toBe('- $ 45.000');
    expect(formatCOP(0, { showSign: true })).toBe('$ 0');
  });

  it('returns privacy mask when isPrivate is true', () => {
    expect(formatCOP(1250000, { isPrivate: true })).toBe(PRIVACY_MASK);
    expect(formatCOP(-45000, { isPrivate: true })).toBe(PRIVACY_MASK);
    expect(formatCOP(0, { isPrivate: true })).toBe(PRIVACY_MASK);
    expect(PRIVACY_MASK).toBe('$ •••••••');
  });

  it('safely rounds decimal amounts to integers to avoid floating point issues', () => {
    expect(formatCOP(1250000.75)).toBe('$ 1.250.001');
    expect(formatCOP(1250000.25)).toBe('$ 1.250.000');
    expect(formatCOP(-45000.6)).toBe('- $ 45.001');
  });

  it('handles invalid numbers by returning "$ 0"', () => {
    expect(formatCOP(NaN)).toBe('$ 0');
    expect(formatCOP(Infinity)).toBe('$ 0');
    expect(formatCOP(-Infinity)).toBe('$ 0');
  });
});

describe('roundCOP', () => {
  it('rounds standard numbers to nearest integer', () => {
    expect(roundCOP(1250000.49)).toBe(1250000);
    expect(roundCOP(1250000.5)).toBe(1250001);
    expect(roundCOP(-45000.4)).toBe(-45000);
    expect(roundCOP(-45000.6)).toBe(-45001);
  });

  it('returns 0 for NaN and non-finite values', () => {
    expect(roundCOP(NaN)).toBe(0);
    expect(roundCOP(Infinity)).toBe(0);
    expect(roundCOP(-Infinity)).toBe(0);
  });
});

describe('parseCOPInput', () => {
  it('parses formatted COP string to integer', () => {
    expect(parseCOPInput('$ 1.250.000')).toBe(1250000);
    expect(parseCOPInput('1250000')).toBe(1250000);
    expect(parseCOPInput('1.250.000')).toBe(1250000);
    expect(parseCOPInput('  $ 45.000  ')).toBe(45000);
  });

  it('rejects letters and non-numeric characters', () => {
    expect(parseCOPInput('abc')).toBe(0);
    expect(parseCOPInput('')).toBe(0);
    expect(parseCOPInput('   ')).toBe(0);
    expect(parseCOPInput('$$$')).toBe(0);
  });

  it('strips non-digit chars from mixed strings', () => {
    expect(parseCOPInput('abc1250xyz')).toBe(1250);
  });

  it('handles negative numbers based on allowNegative option', () => {
    expect(parseCOPInput('- $ 45.000', { allowNegative: true })).toBe(-45000);
    expect(parseCOPInput('-45000', { allowNegative: true })).toBe(-45000);
    expect(parseCOPInput('-45000', { allowNegative: false })).toBe(45000);
    expect(parseCOPInput('- $ 45.000')).toBe(45000); // default is false
  });
});

describe('formatMonths', () => {
  it('formats month numbers with comma decimal separator and pluralization', () => {
    expect(formatMonths(2.1)).toBe('2,1 meses');
    expect(formatMonths(3.0)).toBe('3,0 meses');
    expect(formatMonths(1.0)).toBe('1,0 mes');
    expect(formatMonths(1)).toBe('1,0 mes');
    expect(formatMonths(0)).toBe('0,0 meses');
  });

  it('handles negative or invalid values gracefully', () => {
    expect(formatMonths(NaN)).toBe('0,0 meses');
    expect(formatMonths(-1)).toBe('0,0 meses');
  });
});

describe('formatPercentage', () => {
  it('formats percentages with comma separator', () => {
    expect(formatPercentage(15.5)).toBe('15,5%');
    expect(formatPercentage(20)).toBe('20%');
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(100)).toBe('100%');
  });

  it('handles invalid numbers', () => {
    expect(formatPercentage(NaN)).toBe('0%');
  });
});

describe('cleanNumericInput', () => {
  it('strips all non-digit characters from string', () => {
    expect(cleanNumericInput('$ 1.250.000')).toBe('1250000');
    expect(cleanNumericInput('abc123xyz')).toBe('123');
    expect(cleanNumericInput('45000')).toBe('45000');
  });

  it('returns empty string if input is not a string (defensive guard)', () => {
    expect(cleanNumericInput(null as unknown as string)).toBe('');
    expect(cleanNumericInput(undefined as unknown as string)).toBe('');
    expect(cleanNumericInput(12345 as unknown as string)).toBe('');
    expect(cleanNumericInput({} as unknown as string)).toBe('');
  });
});

describe('formatInterestPer100k', () => {
  it('formats monthly interest rate per 100k in COP', () => {
    expect(formatInterestPer100k(2.1)).toBe('$ 2.100 por cada $ 100.000');
    expect(formatInterestPer100k(1.5)).toBe('$ 1.500 por cada $ 100.000');
    expect(formatInterestPer100k(0)).toBe('$ 0 por cada $ 100.000');
    expect(formatInterestPer100k(-1)).toBe('$ 0 por cada $ 100.000');
    expect(formatInterestPer100k(NaN)).toBe('$ 0 por cada $ 100.000');
  });
});

