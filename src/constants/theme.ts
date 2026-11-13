/**
 * Guaca v2: Design Tokens & Theme Contract (DESIGN.md)
 * Paleta: Esmeralda Bóveda & Piedra Fría (Verificada WCAG AA >= 4.5:1)
 * Tipografía: Manrope (UI) + JetBrains Mono (Cifras COP)
 */

export const PALETTE = {
  light: {
    bgCanvas: '#F6F8F7',
    bgSurface: '#FFFFFF',
    bgElevated: '#EDF2F0',
    bgSubtle: '#E3ECE8',
    textPrimary: '#0F1D18',
    textSecondary: '#384B44',
    textMuted: '#485A53',
    textOnBrand: '#FFFFFF',
    borderSubtle: '#DCE5E1',
    borderStrong: '#B8C9C1',
    brandPrimary: '#0B6B53',
    brandPrimaryPressed: '#08523F',
    brandSoft: '#DDF3EC',
    financeVital: '#1D4ED8',
    financeVitalSoft: '#DBEAFE',
    financeGrowth: '#116B34',
    financeGrowthSoft: '#DCFCE7',
    financeWarning: '#9A4306',
    financeWarningSoft: '#FEF3C7',
    financeDanger: '#BE123C',
    financeDangerSoft: '#FFE4E6',
  },
  dark: {
    bgCanvas: '#090F0D',
    bgSurface: '#121C18',
    bgElevated: '#1A2823',
    bgSubtle: '#21322C',
    textPrimary: '#ECF3F0',
    textSecondary: '#95A8A0',
    textMuted: '#859E94',
    textOnBrand: '#06231B',
    borderSubtle: '#273D35',
    borderStrong: '#3D5C50',
    brandPrimary: '#2DD4A8',
    brandPrimaryPressed: '#14B88E',
    brandSoft: '#113229',
    financeVital: '#60A5FA',
    financeVitalSoft: '#172554',
    financeGrowth: '#4ADE80',
    financeGrowthSoft: '#052E16',
    financeWarning: '#FBBF24',
    financeWarningSoft: '#3B2106',
    financeDanger: '#FB7185',
    financeDangerSoft: '#3F0B19',
  },
} as const;

export const THEME_COLORS = PALETTE;

export type ThemeMode = 'light' | 'dark';
export type ThemeTokens = typeof PALETTE.light;

export const RADII = {
  xs: 8,
  sm: 12, // Tarjetas estándar
  md: 16, // Tarjetas destacadas
  lg: 20, // Hojas modales / Bottom sheets
  xl: 24,
  full: 9999, // Pills y botones circulares
} as const;

export const SPACING = {
  touch: 48, // Mínimo táctil ergonómico Android
  fab: 56,   // FAB Material Design 3
} as const;

export const FONT_FAMILIES = {
  sans: {
    family: 'Manrope',
    weights: {
      regular: 'Manrope_400Regular',
      medium: 'Manrope_500Medium',
      semiBold: 'Manrope_600SemiBold',
      bold: 'Manrope_700Bold',
      extraBold: 'Manrope_800ExtraBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      regular: 'JetBrainsMono_500Medium',
      semiBold: 'JetBrainsMono_600SemiBold',
      bold: 'JetBrainsMono_700Bold',
    },
  },
} as const;
