import { THEME_COLORS, PALETTE, RADII, SPACING, FONT_FAMILIES } from '../theme';

describe('Theme Constants (Esmeralda Bóveda & Piedra Fría)', () => {
  it('exports PALETTE and THEME_COLORS with both light and dark themes matching DESIGN.md', () => {
    expect(THEME_COLORS).toBeDefined();
    expect(THEME_COLORS.light).toBeDefined();
    expect(THEME_COLORS.dark).toBeDefined();
    expect(PALETTE).toBe(THEME_COLORS);
  });

  describe('Light Theme Tokens (WCAG AA Certified)', () => {
    const light = THEME_COLORS.light;

    it('has exact surface and background tokens', () => {
      expect(light.bgCanvas).toBe('#F6F8F7');
      expect(light.bgSurface).toBe('#FFFFFF');
      expect(light.bgElevated).toBe('#EDF2F0');
      expect(light.bgSubtle).toBe('#E3ECE8');
    });

    it('has exact text tokens', () => {
      expect(light.textPrimary).toBe('#0F1D18');
      expect(light.textSecondary).toBe('#384B44');
      expect(light.textMuted).toBe('#485A53');
      expect(light.textOnBrand).toBe('#FFFFFF');
    });

    it('has exact brand tokens', () => {
      expect(light.brandPrimary).toBe('#0B6B53');
      expect(light.brandPrimaryPressed).toBe('#08523F');
      expect(light.brandSoft).toBe('#DDF3EC');
    });

    it('has exact border tokens', () => {
      expect(light.borderSubtle).toBe('#DCE5E1');
      expect(light.borderStrong).toBe('#B8C9C1');
    });

    it('has exact financial traffic light tokens (WCAG AA >= 5.2:1)', () => {
      expect(light.financeVital).toBe('#1D4ED8');
      expect(light.financeVitalSoft).toBe('#DBEAFE');
      expect(light.financeGrowth).toBe('#116B34');
      expect(light.financeGrowthSoft).toBe('#DCFCE7');
      expect(light.financeWarning).toBe('#9A4306');
      expect(light.financeWarningSoft).toBe('#FEF3C7');
      expect(light.financeDanger).toBe('#BE123C');
      expect(light.financeDangerSoft).toBe('#FFE4E6');
    });
  });

  describe('Dark Theme Tokens (OLED Pure Black #090F0D)', () => {
    const dark = THEME_COLORS.dark;

    it('has exact surface and background tokens for OLED', () => {
      expect(dark.bgCanvas).toBe('#090F0D');
      expect(dark.bgSurface).toBe('#121C18');
      expect(dark.bgElevated).toBe('#1A2823');
      expect(dark.bgSubtle).toBe('#21322C');
    });

    it('has exact text tokens for dark mode', () => {
      expect(dark.textPrimary).toBe('#ECF3F0');
      expect(dark.textSecondary).toBe('#95A8A0');
      expect(dark.textMuted).toBe('#859E94');
      expect(dark.textOnBrand).toBe('#06231B');
    });

    it('has exact brand tokens for dark mode', () => {
      expect(dark.brandPrimary).toBe('#2DD4A8');
      expect(dark.brandPrimaryPressed).toBe('#14B88E');
      expect(dark.brandSoft).toBe('#113229');
    });

    it('has exact border tokens for dark mode', () => {
      expect(dark.borderSubtle).toBe('#273D35');
      expect(dark.borderStrong).toBe('#3D5C50');
    });

    it('has exact financial traffic light tokens in OLED dark mode', () => {
      expect(dark.financeVital).toBe('#60A5FA');
      expect(dark.financeVitalSoft).toBe('#172554');
      expect(dark.financeGrowth).toBe('#4ADE80');
      expect(dark.financeGrowthSoft).toBe('#052E16');
      expect(dark.financeWarning).toBe('#FBBF24');
      expect(dark.financeWarningSoft).toBe('#3B2106');
      expect(dark.financeDanger).toBe('#FB7185');
      expect(dark.financeDangerSoft).toBe('#3F0B19');
    });
  });

  describe('Radii & Spacing Specifications (craft-floor.md & android.md)', () => {
    it('defines standard radii with card radius between 12px (sm) and 16px (md)', () => {
      expect(RADII.xs).toBe(8);
      expect(RADII.sm).toBe(12);
      expect(RADII.md).toBe(16);
      expect(RADII.lg).toBe(20);
      expect(RADII.xl).toBe(24);
      expect(RADII.full).toBe(9999);
    });

    it('defines touch and fab ergonomic dimensions (min 48dp, fab 56dp)', () => {
      expect(SPACING.touch).toBe(48);
      expect(SPACING.fab).toBe(56);
    });
  });

  describe('Typography Configuration', () => {
    it('maps official fonts Manrope and JetBrains Mono', () => {
      expect(FONT_FAMILIES.sans.family).toBe('Manrope');
      expect(FONT_FAMILIES.mono.family).toBe('JetBrainsMono');
      expect(FONT_FAMILIES.sans.weights.regular).toBe('Manrope_400Regular');
      expect(FONT_FAMILIES.sans.weights.bold).toBe('Manrope_700Bold');
      expect(FONT_FAMILIES.mono.weights.regular).toBe('JetBrainsMono_500Medium');
      expect(FONT_FAMILIES.mono.weights.bold).toBe('JetBrainsMono_700Bold');
    });
  });
});
