# CLAUDE.md — Guía de Implementación para "Guaca" (Android MVP)

> **Producto:** Guaca — Finanzas personales + Coach financiero 100% local (Offline-First) para Android.
> **Eslogan:** *"Lo tuyo, intocable. Lo demás, bajo control."*
> **Stack objetivo:** React Native + Expo SDK 52+ (Expo Router) + NativeWind v4 + `expo-sqlite` + Zustand + TypeScript estricto.

---

## 1. Identidad Visual Confirmada

- **Paleta:** **Opción A · Esmeralda Bóveda & Piedra Fría** (definida en `global.css` y mapeada en `tailwind.config.js`).
  - Marca Primaria: `#0B6B53` (Claro) / `#2DD4A8` (Oscuro OLED).
  - Mínimo Vital Intocable (`finance-vital`): `#1D4ED8` / `#60A5FA`.
  - Capacidad de Ahorro (`finance-growth`): `#15803D` / `#4ADE80`.
  - Alerta / Gasto Hormiga (`finance-warning`): `#B45309` / `#FBBF24`.
  - Déficit / Peligro (`finance-danger`): `#BE123C` / `#FB7185`.
- **Tipografías (`@expo-google-fonts`):**
  - Interfaz y Títulos: `@expo-google-fonts/plus-jakarta-sans` (`400`, `500`, `600`, `700`, `800`).
  - Montos y Cifras COP: `@expo-google-fonts/jetbrains-mono` (`500`, `600`, `700`) con `fontVariant: ['tabular-nums']` obligatorio en cada cifra monetaria.
- **Logotipo:** **El Cofre Geométrico (G-Vault)** — SVG incluido en los encabezados de `index.html` y `design-system.html`.

---

## 2. Reglas de Dominio Financiero (Metodología Coach)

1. **Mínimo Vital Mensual (`vitalMinimum`):**
   - Suma de los 4 pilares indispensables para vivir con dignidad:
     `vitalMinimum = housing + basicFood + essentialUtilities + essentialTransport`
2. **Capacidad de Ahorro Real (`savingCapacity`):**
   - Se calcula al inicio del mes tras proteger el Mínimo Vital y las cuotas mínimas de deudas:
     `savingCapacity = Math.max(0, netIncome - vitalMinimum - debtObligations)`
3. **Colchón de Tranquilidad (Fondo de Emergencia):**
   - Se mide en **meses de Mínimo Vital cubiertos**, nunca como un monto abstracto:
     `monthsCovered = emergencyFundBalance / vitalMinimum` (Meta inicial: `3.0` meses).
4. **Detector de Fugas y Gastos Hormiga:**
   - Toda suscripción o gasto hormiga muestra siempre su **impacto anualizado** (`monthlyLeak * 12`) para hacer visible cuánto patrimonio resta al año.
5. **Simulador *"¿Me alcanza de verdad?"*:**
   - Dada una compra `amount` en `months` cuotas (`quota = amount / months`):
     - **Compra Segura (`growth`):** `savingCapacity - quota >= savingCapacity * 0.5` (Mínimo Vital intacto y conservas al menos el 50% de tu ahorro mensual).
     - **Alerta Consume Ahorro (`warning`):** `0 <= savingCapacity - quota < savingCapacity * 0.5`.
     - **Peligro Mínimo Vital (`danger`):** `quota > savingCapacity` (La cuota muerde el Mínimo Vital intocable).

---

## 3. Arquitectura de Carpetas (Atomic Design + Expo Router)

```text
src/
├── app/                          # Rutas de Expo Router (7 pantallas del MVP)
│   ├── (tabs)/
│   │   ├── index.tsx             # 1. Inicio ("Semáforo del Mes")
│   │   ├── movements.tsx         # 2. Movimientos y filtros
│   │   ├── budgets.tsx           # 4. Presupuestos, Suscripciones y Fugas
│   │   ├── coach.tsx             # 5. Plan Financiero (Mínimo Vital, Colchón y Simulador)
│   │   └── reports.tsx           # 6. Reportes Visuales SVG
│   ├── accounts.tsx              # 3. Cuentas, Tarjetas y Plan Bola de Nieve / Avalancha
│   ├── settings.tsx              # 7. Diagnóstico Inicial (3 pasos) + Ajustes y Respaldo JSON
│   └── quick-record-modal.tsx    # Modal nativo de Registro en 2-3 toques
├── components/
│   ├── atoms/
│   │   ├── MoneyText.tsx         # JetBrains Mono + tabular-nums + soporte privacidad (••••)
│   │   ├── GuacaButton.tsx       # min-h-[48px] obligatorio, feedback háptico ligero
│   │   ├── TrafficLightBadge.tsx # Icono + Texto + Color semántico (WCAG AA)
│   │   └── ProgressBar.tsx       # Barra accesible con accessibilityRole="progressbar"
│   ├── molecules/
│   │   ├── MoneyStatCard.tsx     # Tarjeta de KPI financiero
│   │   ├── WalletCard.tsx        # Billetera normal o Bóveda protegida
│   │   ├── TransactionItem.tsx   # Fila de movimiento con etiqueta de pilar
│   │   └── InsightBanner.tsx     # Tarjeta de consejo accionable del Coach
│   └── organisms/
│       ├── MonthHealthPanel.tsx  # Organismo protagonista "Semáforo del Mes"
│       ├── LeakDetectorList.tsx  # Calculadora anual de suscripciones y gastos hormiga
│       ├── AffordabilitySim.tsx  # Simulador "¿Me alcanza de verdad?"
│       └── DebtPayoffPlanner.tsx # Selector Bola de Nieve vs. Avalancha
├── db/
│   ├── schema.ts                 # Tablas SQLite (wallets, transactions, budgets, goals, settings)
│   └── backup.ts                 # Exportación e importación de JSON local con expo-file-system
└── store/
    └── useFinanceStore.ts        # Estado reactivo con Zustand + persistencia SQLite
```

---

## 4. Requisitos Estrictos de Ergonomía y Accesibilidad Android

- **Zonas táctiles:** Ningún botón, chip, fila interactiva o icono puede medir menos de `48x48dp` (`min-h-[48px] min-w-[48px]`).
- **Safe Areas de Android:** Respetar `SafeAreaView` (`react-native-safe-area-context`) tanto en la barra de estado superior como en la barra gestual inferior.
- **Formato de Moneda COP:** Separador de miles con punto (`$ 1.250.000`), cero decimales por defecto para COP, y ocultación instantánea (`$ •••••••`) cuando `privacyMode === true`.
- **Daltonismo (No depender solo del color):** Todo `TrafficLightBadge` exige prop `icon` y `label` explícitos además de la variante cromática.
