/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: "rgb(var(--bg-canvas) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          subtle: "rgb(var(--bg-subtle) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          onBrand: "rgb(var(--text-on-brand) / <alpha-value>)",
        },
        border: {
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-primary) / <alpha-value>)",
          pressed: "rgb(var(--brand-primary-pressed) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
        },
        finance: {
          vital: "rgb(var(--finance-vital) / <alpha-value>)",
          vitalSoft: "rgb(var(--finance-vital-soft) / <alpha-value>)",
          growth: "rgb(var(--finance-growth) / <alpha-value>)",
          growthSoft: "rgb(var(--finance-growth-soft) / <alpha-value>)",
          warning: "rgb(var(--finance-warning) / <alpha-value>)",
          warningSoft: "rgb(var(--finance-warning-soft) / <alpha-value>)",
          danger: "rgb(var(--finance-danger) / <alpha-value>)",
          dangerSoft: "rgb(var(--finance-danger-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        /* REGLA CRÍTICA REACT NATIVE:
           En Expo y Android, la fuente personalizada ya incluye el peso en su nombre de archivo
           (ej. Manrope_700Bold). NUNCA combines clases como "font-sans-bold font-bold" en el JSX,
           porque Android intentará aplicar negrita sintética a una fuente que ya es bold o
           buscará un glifo inexistente, provocando fallos visuales o reseteo a la fuente del sistema.
           Usa únicamente una clase a la vez: font-sans, font-sans-medium, font-sans-bold, etc. */
        sans: ["Manrope_400Regular", "sans-serif"],
        "sans-medium": ["Manrope_500Medium", "sans-serif"],
        "sans-semibold": ["Manrope_600SemiBold", "sans-serif"],
        "sans-bold": ["Manrope_700Bold", "sans-serif"],
        "sans-extrabold": ["Manrope_800ExtraBold", "sans-serif"],
        mono: ["JetBrainsMono_500Medium", "monospace"],
        "mono-semibold": ["JetBrainsMono_600SemiBold", "monospace"],
        "mono-bold": ["JetBrainsMono_700Bold", "monospace"],
      },
      borderRadius: {
        /* Estándar craft-floor.md:
           - Tarjetas: estrictamente entre 12px (sm) y 16px (md).
           - Modales / Bottom Sheets: 20px (lg).
           - Chips, Pills y Botones redondeados: 9999px (full). */
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        full: "9999px",
      },
      spacing: {
        /* Ergonomía táctil Android:
           - Mínimo por especificación Material Design 3: 48x48dp.
           - Botón de acción flotante (FAB): 56x56dp estándar. */
        touch: "48px",
        fab: "56px",
      },
    },
  },
  plugins: [],
};
