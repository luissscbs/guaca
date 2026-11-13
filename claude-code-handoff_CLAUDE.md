# CLAUDE.md: Guía Oficial de Implementación para "Guaca" (Android Native)

> **Producto:** Guaca, Finanzas personales y Coach financiero 100% local (Offline-First) para Android.  
> **Lema oficial:** "Lo tuyo, intocable. Lo demás, bajo control."  
> **Stack tecnológico:** React Native + Expo SDK 52+ (Expo Router) + NativeWind v4 + `expo-sqlite` + Zustand + TypeScript estricto + `react-native-svg` + `@gorhom/bottom-sheet`.  
> **Directrices de calidad:** `craft-floor.md` y ergonomía nativa `android.md`.

---

## 1. Identidad Visual y Paleta Verificada WCAG AA

### 1.1 Paleta Esmeralda Bóveda & Piedra Fría
Todos los contrastes fueron auditados matemáticamente (Luminancia Relativa WCAG 2.1) y superan el umbral estricto de **>= 4.5:1 para texto normal** en todas las superficies:

- **Modo Claro Diurno:**
  - Superficies: Canvas `#F6F8F7`, Surface `#FFFFFF`, Elevated `#EDF2F0`, Subtle `#E3ECE8`.
  - Textos: Primary `#0F1D18` (14.41:1 a 17.37:1), Secondary `#384B44` (7.72:1 a 9.30:1), Muted `#485A53` (6.09:1 a 7.34:1).
  - Marca Primaria: `#0B6B53` (5.38:1 a 6.48:1), Pressed `#08523F`, Soft `#DDF3EC`.
  - Texto sobre Marca (`text-on-brand`): `#FFFFFF` (6.48:1 sobre brand).
  - Semáforo Financiero:
    - Mínimo Vital (`finance-vital`): `#1D4ED8` (5.56:1 a 6.70:1), Soft `#DBEAFE`.
    - Capacidad de Ahorro (`finance-growth`): `#116B34` (5.49:1 a 6.61:1), Soft `#DCFCE7`.
    - Alerta / Fuga (`finance-warning`): `#9A4306` (5.48:1 a 6.60:1), Soft `#FEF3C7`.
    - Peligro / Déficit (`finance-danger`): `#BE123C` (5.22:1 a 6.29:1), Soft `#FFE4E6`.
  - Bordes: Subtle `#DCE5E1`, Strong `#B8C9C1`.

- **Modo Oscuro OLED (`#090F0D`):**
  - Superficies: Canvas `#090F0D`, Surface `#121C18`, Elevated `#1A2823`, Subtle `#21322C`.
  - Textos: Primary `#ECF3F0` (11.97:1 a 17.17:1), Secondary `#95A8A0` (5.39:1 a 7.72:1), Muted `#859E94` (4.70:1 a 6.74:1).
  - Marca Primaria: `#2DD4A8` (7.12:1 a 10.22:1), Pressed `#14B88E`, Soft `#113229`.
  - Texto sobre Marca (`text-on-brand`): `#06231B` (8.78:1 sobre `#2DD4A8`).
  - Semáforo Financiero:
    - Mínimo Vital (`finance-vital`): `#60A5FA` (5.30:1 a 7.61:1), Soft `#172554`.
    - Capacidad de Ahorro (`finance-growth`): `#4ADE80` (7.74:1 a 11.10:1), Soft `#052E16`.
    - Alerta / Fuga (`finance-warning`): `#FBBF24` (8.08:1 a 11.59:1), Soft `#3B2106`.
    - Peligro / Déficit (`finance-danger`): `#FB7185` (5.01:1 a 7.19:1), Soft `#3F0B19`.
  - Bordes: Subtle `#273D35` (separación nítida de tarjetas en OLED), Strong `#3D5C50`.

### 1.2 Tipografías Oficiales (`@expo-google-fonts`)
- **Interfaz, títulos y controles:** `@expo-google-fonts/manrope` (`400`, `500`, `600`, `700`, `800`).
- **Montos y cifras en Pesos COP:** `@expo-google-fonts/jetbrains-mono` (`500`, `600`, `700`) con `style={{ fontVariant: ['tabular-nums'] }}` obligatorio en cada número.
- **Regla estricta para React Native:** NUNCA combines clases de familia con clases de peso en JSX (por ejemplo, nunca uses `font-sans-bold font-bold` ni `font-sans font-medium`). Usa únicamente una clase por texto (`font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, etc.).

### 1.3 Emblema de Marca
- **El Cofre Geométrico (G-Vault):** Componente SVG geométrico limpio (`src/components/atoms/GuacaLogo.tsx`), adaptable a los temas claro, oscuro y estado de privacidad.

---

## 2. Reglas del Dominio Financiero (Metodología Coach "Para Dummies")

1. **Mínimo Vital Mensual (`vitalMinimum`):**
   - Suma exacta de 4 casillas indispensables:
     $$\text{vitalMinimum} = \text{housing} + \text{basicFood} + \text{essentialUtilities} + \text{essentialTransport}$$
   - Nunca se utiliza para compras por impulso ni gastos libres.
2. **Capacidad de Ahorro Real (`savingCapacity`):**
   - Calculada al inicio del mes protegiendo lo indispensable y las deudas:
     $$\text{savingCapacity} = \max(0, \text{netIncome} - \text{vitalMinimum} - \text{debtObligations})$$
3. **Colchón de Tranquilidad (Fondo de Emergencia):**
   - Medido en **meses de Mínimo Vital cubiertos** (no en montos abstractos):
     $$\text{monthsCovered} = \frac{\text{emergencyFundBalance}}{\text{vitalMinimum}}$$
   - Hitos: 1.0 mes (Tranquilidad inicial), 3.0 meses (Estabilidad), 6.0 meses (Paz financiera total).
4. **Detector de Fugas y Gastos Hormiga:**
   - Multiplica toda suscripción o gasto recurrente por 12 para mostrar su **costo anualizado**:
     - *"Esta suscripción de $35.000 te cuesta $420.000 al año."*
5. **Simulador "¿Me alcanza de verdad?":**
   - Dada una compra `amount` en `months` cuotas (`quota = amount / months`):
     - **Compra Segura (`growth`):** `savingCapacity - quota >= savingCapacity * 0.5`.
     - **Cuidado con el Ahorro (`warning`):** `0 <= savingCapacity - quota < savingCapacity * 0.5`.
     - **Peligro Mínimo Vital (`danger`):** `quota > savingCapacity` (la compra muerde el Mínimo Vital).
6. **Plan de Pago de Deudas:**
   - Sin jerga financiera como E.A. o TIR; las tasas se traducen a costo mensual en pesos:
     - *"Por cada $100.000 que debes, pagas ~$2.100 al mes de solo interés."*
   - Dos estrategias con nombres intuitivos:
     - **Victorias Rápidas (Bola de Nieve):** Paga primero la deuda más pequeña para ganar victorias inmediatas.
     - **Ahorra Más Intereses (Avalancha):** Ataca primero la deuda con el interés más alto para ahorrar la mayor cantidad de dinero.

---

## 3. Arquitectura de Navegación (5 Pestañas + Pantallas Satélite)

```text
src/
├── app/                          # Rutas Expo Router (5 tabs + Onboarding + CRUD)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Configuración de 5 pestañas con Material 3 Bottom Navigation
│   │   ├── index.tsx             # Tab 1: Inicio ("Semáforo del Mes" + Saldo libre + FAB "Anotar rápido")
│   │   ├── movements.tsx         # Tab 2: Movimientos (Historial, buscador y filtros por pilar)
│   │   ├── accounts.tsx          # Tab 3: Cuentas (Cuentas, Tarjetas, Deudas y Traslados)
│   │   ├── budgets.tsx           # Tab 4: Presupuesto (Presupuestos por categoría, Suscripciones y Fugas)
│   │   └── coach.tsx             # Tab 5: Plan Coach (Mínimo Vital, Colchón, Metas, Simulador y acceso a Reportes)
│   ├── onboarding.tsx            # Primer arranque guiado en 3 pasos con 4 casillas (arranca en cero)
│   ├── quick-record.tsx          # Registro ultra-rápido en 2 toques (Gasto, Ingreso o Traslado)
│   ├── reports.tsx               # Reportes visuales SVG locales (tendencias y distribución)
│   └── settings.tsx              # Ajustes, Modo Privado y Respaldo Local JSON exportable
```

---

## 4. Catálogo Completo de Componentes Atómicos

```text
src/components/
├── atoms/
│   ├── MoneyText.tsx             # Cifras JetBrains Mono + tabular-nums + soporte privacidad ($ •••••••)
│   ├── GuacaButton.tsx           # Botón táctil min-h-[48px], feedback háptico, variantes primary/secondary/ghost/danger/tonal
│   ├── QuickFAB.tsx              # Botón flotante 56x56dp ergonómico etiquetado "Anotar rápido"
│   ├── TrafficLightBadge.tsx     # Pastilla de salud: icono SVG + texto claro (accesible para daltonismo)
│   ├── ProgressBar.tsx           # Barra accesible con accessibilityRole="progressbar"
│   ├── GuacaDivider.tsx          # Divisor de 1px sutil (--border-subtle) para evitar tarjetas anidadas
│   ├── GuacaInput.tsx            # Input numérico/texto de min-h-[48px] con formato COP
│   ├── PillarChip.tsx            # Chip selector de 48dp de altura para los 4 pilares y gastos libres
│   └── GuacaLogo.tsx             # Emblema SVG El Cofre Geométrico (G-Vault)
├── molecules/
│   ├── MoneyStatCard.tsx         # Tarjeta de KPI financiero (1px borde, sin tarjetas anidadas)
│   ├── WalletCard.tsx            # Tarjeta de cuenta bancaria o billetera digital con saldo
│   ├── DebtItemCard.tsx          # Tarjeta de deuda con costo de interés mensual en pesos y botón de abono
│   ├── TransactionItem.tsx       # Fila de movimiento (min-h-[64px]) con categoría, fecha, pilar y monto tabular
│   ├── SubscriptionLeakItem.tsx  # Fila de suscripción con costo mensual e impacto anualizado
│   ├── InsightBanner.tsx         # Tarjeta tonal con consejo del Coach y acción directa de 1 toque
│   ├── TransferAccountSelector.tsx # Selector interactivo de Cuenta Origen y Cuenta Destino
│   ├── VitalPillarRow.tsx        # Fila interactiva para cada uno de los 4 pilares en onboarding y ajustes
│   └── GuacaSnackbar.tsx         # Notificación inferior accesible con acción "Deshacer"
└── organisms/
    ├── MonthHealthPanel.tsx      # Organismo principal: "Semáforo del Mes" y saldo libre
    ├── DebtPayoffPlanner.tsx     # Comparador "Victorias Rápidas" vs. "Ahorra Más Intereses"
    ├── AffordabilitySimulator.tsx # Herramienta "¿Me alcanza de verdad?" en tiempo real
    ├── LeakDetectorList.tsx      # Sumador anualizado de fugas hormiga y suscripciones
    ├── EmergencyFundGauge.tsx    # Medidor del Colchón de Tranquilidad en meses de Mínimo Vital
    ├── QuickRecordSheet.tsx      # Hoja inferior (@gorhom/bottom-sheet) para registrar en 2 toques
    ├── OnboardingWizard.tsx      # Flujo interactivo de 3 pasos para bienvenida limpia sin datos ficticios
    └── BackupRestoreCard.tsx     # Módulo honesto de exportación e importación de archivo JSON local
```

---

## 5. Matriz Completa de Operaciones CRUD en Base de Datos Local

La base de datos SQLite (`src/db/schema.ts`) mediante `expo-sqlite` implementa operaciones completas:

1. **Cuentas y Billeteras:**
   - Crear: Nombre, tipo (Bancaria, Efectivo, Digital), saldo inicial.
   - Listar: Saldo total y cuentas agrupadas.
   - Actualizar: Nombre, icono, conciliación de saldo.
   - Archivar/Eliminar: Ocultar cuenta conservando movimientos asociados.
2. **Deudas y Tarjetas de Crédito:**
   - Crear: Nombre, acreedor, cupo, saldo pendiente, cuota mensual, interés mensual en pesos.
   - Registrar abono: Abono ordinario o extraordinario que actualiza el plan de amortización.
   - Actualizar: Saldo adeudado o cuota pactada.
   - Marcar como pagada: Estado finalizado con felicitación en pantalla.
3. **Movimientos:**
   - Crear: Monto, tipo (gasto/ingreso), cuenta, categoría, pilar, nota.
   - Listar: Historial filtrable por mes, cuenta, pilar y texto libre.
   - Actualizar: Modificación de cualquier campo con ajuste automático del saldo de la cuenta.
   - Eliminar: Reversión de saldo con opción inmediata de "Deshacer" vía Snackbar.
4. **Traslados entre Cuentas:**
   - Registro de transferencia con Cuenta Origen y Cuenta Destino obligatorias (no genera gastos ni ingresos ficticios en el informe mensual).
5. **Presupuestos por Categoría:**
   - Fijar límite mensual, monitorear porcentaje consumido y recibir alertas al 80% y 100%.
6. **Metas de Ahorro:**
   - Crear objetivo, registrar aportes periódicos, monitorear progreso porcentual.
7. **Copia de Respaldo Local:**
   - Exportar archivo `guaca-backup-YYYY-MM-DD.json` accesible desde el explorador de archivos de Android.
   - Importar y restaurar con reemplazo seguro de la base de datos previa.

---

## 6. Reglas Estrictas de Craft y Ergonomía Android

1. **Cero tarjetas anidadas (`no nested cards`):**
   - Prohibido incluir una tarjeta dentro de otra tarjeta.
   - Para separar listas internas, usa espaciado vertical y `GuacaDivider` (1px sutil `--border-subtle`).
   - Radios de esquina de tarjetas: estrictamente entre `12px` (`rounded-sm`) y `16px` (`rounded-md`).
2. **Elevación única:**
   - Mantén las superficies planas con borde sutil de 1px.
   - Reserva `elevation` de Android únicamente para elementos flotantes (FAB de 56dp, barra de navegación inferior y hojas modales).
3. **Zonas táctiles ergonómicas:**
   - Todo elemento interactivo mide como mínimo `48x48dp` (`min-h-[48px] min-w-[48px]`).
   - El botón flotante de registro (`QuickFAB`) mide `56x56dp` y está situado en la zona de fácil alcance del pulgar derecho.
4. **Snackbar con Deshacer:**
   - Reemplaza cualquier toast superior por un `GuacaSnackbar` inferior anclado sobre la barra de navegación con botón de acción `Deshacer`.
5. **Soporte para escalabilidad de texto (`font_scale`):**
   - La interfaz no debe cortar textos ni montos numéricos cuando el usuario incremente el tamaño de fuente en la configuración de accesibilidad de Android.
6. **Modo Privado instantáneo:**
   - Un toque en el icono de privacidad oculta todos los saldos reemplazándolos por `$ •••••••` sin romper la alineación tabular.
