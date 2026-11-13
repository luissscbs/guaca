# Guaca v2: Fuente de Verdad del Sistema de Diseño (DESIGN.md)

> **Estado:** Aprobado y verificado  
> **Identidad de Marca:** Guaca  
> **Lema Oficial:** "Lo tuyo, intocable. Lo demás, bajo control."  
> **Emblema Gráfico:** El Cofre Geométrico (G-Vault)  
> **Pila Tecnológica:** React Native + Expo SDK 52+ + NativeWind v4 + TypeScript estricto  
> **Normas de Calidad:** Cumplimiento estricto de `craft-floor.md` y directrices nativas de `android.md`

---

## 1. Identidad de Marca y Emblema (G-Vault)

El logotipo de Guaca representa la seguridad de una bóveda patrimonial unida a la cercanía de una alcancía tradicional. Combina una "G" monolítica con el rombo central de un cerrojo geométrico:

```xml
<!-- Logotipo Oficial Guaca: El Cofre Geométrico (G-Vault) -->
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-label="Logotipo Guaca G-Vault">
  <rect x="2" y="2" width="36" height="36" rx="11" fill="var(--brand-soft)" stroke="var(--brand-primary)" stroke-width="2.2"/>
  <path d="M27.5 14.5C25.8 11.8 23.1 10.2 19.8 10.2C14.4 10.2 10.2 14.5 10.2 20C10.2 25.5 14.4 29.8 19.8 29.8C24.8 29.8 28.6 26.4 29.2 21.6H23.2" stroke="var(--brand-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 15L24.5 20L20 25L15.5 20L20 15Z" fill="var(--brand-primary)"/>
</svg>
```

### 1.1 Variantes del Emblema por Tema y Estado
1. **Modo Claro Diurno:** Fondo contenedor `#DDF3EC`, trazo y rombo `#0B6B53`.
2. **Modo Oscuro OLED:** Fondo contenedor `#113229`, trazo y rombo `#2DD4A8`.
3. **Modo Privacidad Activo:** Contenedor tonal azul `#DBEAFE` (`#172554` en oscuro) con tres puntos de cerrojo alineados horizontalmente, indicando que las cifras están protegidas de miradas indiscretas.

---

## 2. Paleta "Esmeralda Bóveda & Piedra Fría" (Verificación Matemática WCAG AA)

Todos los pares de color han sido auditados matemáticamente mediante el algoritmo WCAG 2.1 (Luminancia Relativa). Cada combinación supera el umbral estricto de **4.5:1 para texto normal** y **3.0:1 para elementos gráficos y texto grande**, incluso sobre superficies tenues (`subtle` y `elevated`).

### 2.1 Modo Claro Diurno (Fondos Típicos: `#F6F8F7`, `#FFFFFF`, `#EDF2F0`, `#E3ECE8`)

| Rol del Token | Código Hex | Canal RGB | Función en la Interfaz | Ratio s/ Superficie Más Crítica (`#E3ECE8`) | Estado WCAG AA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F6F8F7` | `246 248 247` | Fondo principal de la pantalla | Base | Base |
| `--bg-surface` | `#FFFFFF` | `255 255 255` | Tarjetas y contenedores principales | Base | Base |
| `--bg-elevated` | `#EDF2F0` | `237 242 240` | Superficies de apoyo, cabeceras | Base | Base |
| `--bg-subtle` | `#E3ECE8` | `227 236 232` | Fondos de chips, cajas de entrada | Base | Base |
| `--text-primary` | `#0F1D18` | `15 29 24` | Títulos y texto de alta jerarquía | **14.41:1** | **Supera AAA** |
| `--text-secondary` | `#384B44` | `56 75 68` | Párrafos, subtítulos y explicaciones | **7.72:1** | **Supera AAA** |
| `--text-muted` | `#485A53` | `72 90 83` | Fechas, unidades y leyendas | **6.09:1** | **Supera AA (>= 4.5:1)** |
| `--text-on-brand` | `#FFFFFF` | `255 255 255` | Texto sobre botón primario (`#0B6B53`) | **6.48:1** | **Supera AA (>= 4.5:1)** |
| `--brand-primary` | `#0B6B53` | `11 107 83` | Botones primarios, acento principal | **5.38:1** | **Supera AA (>= 4.5:1)** |
| `--brand-soft` | `#DDF3EC` | `221 243 236` | Fondo de destacados y consejos | Superficie | Decorativa |
| `--border-subtle` | `#DCE5E1` | `220 229 225` | Borde de tarjetas y divisores de 1px | Estructura | Perceptible |
| `--border-strong` | `#B8C9C1` | `184 201 193` | Bordes activos y estados de foco | Estructura | Alto contraste |
| `--finance-vital` | `#1D4ED8` | `29 78 216` | Mínimo Vital (Azul protector) | **5.56:1** | **Supera AA (>= 4.5:1)** |
| `--finance-growth` | `#116B34` | `17 107 52` | Capacidad de Ahorro (Verde bosque) | **5.49:1** | **Supera AA (>= 4.5:1)** |
| `--finance-warning`| `#9A4306` | `154 67 6` | Alerta / Fuga hormiga (Ámbar tierra) | **5.48:1** | **Supera AA (>= 4.5:1)** |
| `--finance-danger` | `#BE123C` | `190 18 60` | Peligro / Déficit (Carmesí profundo) | **5.22:1** | **Supera AA (>= 4.5:1)** |

### 2.2 Modo Oscuro OLED (Fondos Típicos: `#090F0D`, `#121C18`, `#1A2823`, `#21322C`)

| Rol del Token | Código Hex | Canal RGB | Función en la Interfaz | Ratio s/ Superficie Más Crítica (`#21322C`) | Estado WCAG AA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#090F0D` | `9 15 13` | Negro puro OLED de ahorro de batería | Base | Base |
| `--bg-surface` | `#121C18` | `18 28 24` | Tarjetas y hojas modales | Base | Base |
| `--bg-elevated` | `#1A2823` | `26 40 35` | Contenedores tonales de segundo nivel | Base | Base |
| `--bg-subtle` | `#21322C` | `33 50 44` | Fondos de chips y campos interactivos | Base | Base |
| `--text-primary` | `#ECF3F0` | `236 243 240` | Títulos y cifras destacadas | **11.97:1** | **Supera AAA** |
| `--text-secondary` | `#95A8A0` | `149 168 160` | Textos secundarios y descripciones | **5.39:1** | **Supera AA (>= 4.5:1)** |
| `--text-muted` | `#859E94` | `133 158 148` | Etiquetas, fechas y texto atenuado | **4.70:1** | **Supera AA (>= 4.5:1)** |
| `--text-on-brand` | `#06231B` | `6 35 27` | Texto oscuro sobre esmeralda luminoso | **8.78:1** | **Supera AAA** |
| `--brand-primary` | `#2DD4A8` | `45 212 168` | Acento vibrante, FAB y botones clave | **7.12:1** | **Supera AAA** |
| `--brand-soft` | `#113229` | `17 50 41` | Superficie suave de marca | Superficie | Tonal |
| `--border-subtle` | `#273D35` | `39 61 53` | Borde de 1px con separación nítida | Estructura | Claro sobre negro |
| `--border-strong` | `#3D5C50` | `61 92 80` | Foco y selecciones activas | Estructura | Destacado |
| `--finance-vital` | `#60A5FA` | `96 165 250` | Mínimo Vital en modo oscuro | **5.30:1** | **Supera AA (>= 4.5:1)** |
| `--finance-growth` | `#4ADE80` | `74 222 128` | Ahorro saludable en modo oscuro | **7.74:1** | **Supera AAA** |
| `--finance-warning`| `#FBBF24` | `251 191 36` | Alerta / Observación en modo oscuro | **8.08:1** | **Supera AAA** |
| `--finance-danger` | `#FB7185` | `251 113 133` | Déficit / Riesgo en modo oscuro | **5.01:1** | **Supera AA (>= 4.5:1)** |

---

## 3. Tipografía Oficial: Manrope + JetBrains Mono

En cumplimiento de las directrices de diseño limpio y legibilidad en pantallas móviles:
- **Interfaz, títulos y textos:** `@expo-google-fonts/manrope` (pesos `400`, `500`, `600`, `700`, `800`).
- **Montos, saldos y cálculos en pesos COP:** `@expo-google-fonts/jetbrains-mono` (pesos `500`, `600`, `700`).

### 3.1 Escala Tipográfica (Spacial Scale)

| Rol Tipográfico | Fuente y Peso | Tamaño (dp / sp) | Altura de Línea | Uso Específico |
| :--- | :--- | :--- | :--- | :--- |
| **Display Grande** | `font-sans-extrabold` (Manrope 800) | `32sp` | `38sp` | Cifras macro de patrimonio e inicio |
| **Título 1** | `font-sans-bold` (Manrope 700) | `24sp` | `30sp` | Encabezados principales de pantalla |
| **Título 2** | `font-sans-semibold` (Manrope 600) | `18sp` | `24sp` | Títulos de sección dentro de pantallas |
| **Cuerpo Principal** | `font-sans` (Manrope 400) | `15sp` | `22sp` | Párrafos y explicaciones didácticas |
| **Cuerpo Medio** | `font-sans-medium` (Manrope 500) | `14sp` | `20sp` | Elementos de lista, inputs y chips |
| **Etiqueta / Leyenda**| `font-sans-semibold` (Manrope 600) | `12sp` | `16sp` | Badges, pills y textos de apoyo |
| **Monto Macro** | `font-mono-bold` (JetBrains Mono 700) | `26sp` | `32sp` | Semáforo mensual y saldos destacados |
| **Monto Fila** | `font-mono-semibold` (JetBrains Mono 600) | `16sp` | `20sp` | Importes en filas de movimientos |
| **Monto Secundario** | `font-mono` (JetBrains Mono 500) | `13sp` | `16sp` | Cuotas mensuales y costos de interés |

### 3.2 Reglas Inquebrantables de Tipografía en React Native
1. **Nunca combinar familias con clases de peso duplicadas:**  
   En React Native y Android, la fuente personalizada ya tiene el peso incrustado en su nombre nativo.  
   - ✅ Correcto: `<Text className="font-sans-bold text-lg text-text-primary">`
   - ❌ Prohibido: `<Text className="font-sans-bold font-bold text-lg">` (provoca fallo de resolución en Android).
2. **Cifras siempre tabulares:**  
   Todo monto en pesos debe incluir la propiedad nativa `style={{ fontVariant: ['tabular-nums'] }}` para que los dígitos numéricos ocupen exactamente el mismo ancho y no bailen al cambiar de valor.
3. **Tracking moderado:**  
   El espaciado entre letras (`letter-spacing`) en Android debe mantenerse entre `-0.01em` y `0` para títulos, y cero absoluto en cifras monoespaciadas.

---

## 4. Regla de Oro Estructural: Cero Tarjetas Anidadas ("No Nested Cards")

Siguiendo el estándar de excelencia `craft-floor.md`:
- **Prohibido meter una tarjeta dentro de otra tarjeta:**  
  La práctica de envolver una lista en una tarjeta y luego meter cada elemento dentro de otra tarjeta crea ruido visual, sensación de desorden y bordes redundantes.
- **La solución limpia:**  
  1. La tarjeta contenedora define el bloque conceptual con fondo `bg-surface` y borde de 1px sutil (`border-subtle`).
  2. Los elementos internos se separan mediante espacio generoso y el componente átomo `GuacaDivider` (un divisor horizontal de exactamente 1px con color `--border-subtle`).
  3. La jerarquía se transmite por tamaño tipográfico, peso y contraste de color, nunca multiplicando contenedores.
- **Declarar elevación una sola vez:**  
  - Superficie plana con borde de 1px para el 95% de la interfaz.
  - La propiedad `elevation` de Android queda reservada exclusivamente para elementos que realmente flotan sobre la escena: el botón de acción rápida (FAB), la barra de navegación inferior y las hojas modales (`@gorhom/bottom-sheet`).
- **Radios de esquina de tarjetas:**  
  Estrictamente entre `12px` (`rounded-sm`) y `16px` (`rounded-md`). Los radios tipo píldora (`rounded-full`) son exclusivos para chips, badges y botones pequeños.

---

## 5. Ergonomía Nativa Android (Directrices `android.md`)

1. **Zonas táctiles de 48x48dp mínimo:**  
   Todo botón, chip, casilla de verificación, selector o icono interactivo tiene como piso absoluto `min-h-[48px] min-w-[48px]` con al menos 8dp de separación entre controles vecinos.
2. **Botón de acción flotante (FAB) ergonómico:**  
   Dimensiones estándar de 56x56dp, ubicado en la esquina inferior derecha a 16dp de los bordes, al alcance natural del pulgar, con etiqueta clara `Anotar rápido`.
3. **Snackbar inferior con acción "Deshacer":**  
   Para notificaciones transitorias (por ejemplo: al eliminar un movimiento o guardar una cuenta), se utiliza siempre una barra inferior accesible con botón interactivo de "Deshacer". Nunca se usan toasts superiores invasivos que violen la ergonomía de Android.
4. **Respeto a las Áreas Seguras (Safe Areas):**  
   Integración obligatoria con `react-native-safe-area-context` para respetar la barra de estado superior, las cámaras perforadas (notch/punch-hole) y la barra de navegación gestual de Android.
5. **Comportamiento del gesto "Atrás":**  
   El botón de retroceso físico o gestual de Android debe cerrar hojas modales o regresar a la pantalla anterior predeciblemente, sin cerrar la aplicación de golpe ni quedar atrapado.
6. **Estados interactivos completos:**  
   Cada control admite 7 estados obligatorios:
   - `default`: Reposo claro y contrastado.
   - `pressed`: Escala sutil `0.98` con retroalimentación háptica ligera (`expo-haptics`).
   - `disabled`: Opacidad al 40% sin responder a eventos táctiles.
   - `loading`: Indicador de actividad tonal integrado sin deformar el botón.
   - `empty`: Ilustración o icono geométrico simple con mensaje motivador para registrar datos.
   - `error`: Borde y texto en carmesí profundo con mensaje de ayuda para solucionar el problema.
   - `privacy`: Reemplazo instantáneo de números por glifos protegidos (`$ •••••••`).

---

## 6. Catálogo Completo de Componentes (Diseño Atómico)

### 6.1 Átomos (Elementos base indivisibles)

#### 1. `MoneyText`
- **Función:** Representación visual de cualquier suma en Pesos Colombianos (COP).
- **Tipografía:** `JetBrainsMono` con `fontVariant: ['tabular-nums']`.
- **Props:** `amount: number`, `size?: 'sm' | 'md' | 'lg' | 'xl'`, `isPrivate?: boolean`, `colorClass?: string`.
- **Modo Privado:** Cuando `isPrivate` es verdadero, proyecta `$ •••••••` manteniendo el mismo ancho visual para evitar saltos en la pantalla.
- **TalkBack:** Anuncia al lector de pantalla el valor completo en pesos: *"Cuatrocientos cincuenta mil pesos colombianos"*, salvo en modo privado donde anuncia *"Monto protegido"*.

#### 2. `GuacaButton`
- **Función:** Botón de acción para navegación, confirmaciones y formularios.
- **Variantes:**
  - `primary`: Fondo `--brand-primary`, texto blanco `#FFFFFF`, min-h de 48dp.
  - `secondary`: Fondo `--bg-subtle`, texto `--text-primary`, borde 1px `--border-subtle`.
  - `ghost`: Fondo transparente, texto `--brand-primary`, pensado para acciones secundarias y cancelaciones.
  - `danger`: Fondo `--finance-danger`, texto blanco, reservado para eliminaciones definitivas.
  - `tonal`: Fondo `--brand-soft`, texto `--brand-primary`, para botones de asistencia rápida.
- **Estados:** `default`, `pressed` (opacidad 0.85 y escala 0.98), `disabled`, `loading` (spinner tonal).

#### 3. `QuickFAB`
- **Función:** Botón flotante protagonista para el registro en 2 toques.
- **Dimensiones:** `56x56dp` circular (`rounded-full`), `elevation: 6`, ubicado en la esquina inferior derecha.
- **Iconografía:** Símbolo "+" geométrico nítido y accesible.

#### 4. `TrafficLightBadge`
- **Función:** Pastilla indicadora de salud financiera o pilar de gasto.
- **Variantes cromáticas:**
  - `vital`: Fondo azul suave, texto e icono azul profundo (`--finance-vital`).
  - `growth`: Fondo verde suave, texto e icono verde bosque (`--finance-growth`).
  - `warning`: Fondo ámbar suave, texto e icono ámbar tierra (`--finance-warning`).
  - `danger`: Fondo carmesí suave, texto e icono carmesí profundo (`--finance-danger`).
- **Accesibilidad para daltonismo:** Nunca depende únicamente del color; exige siempre icono vectorial descriptivo y texto explícito (ejemplo: `✓ Intocable`, `↑ Ahorro`, `! Alerta`, `✕ Déficit`).

#### 5. `ProgressBar`
- **Función:** Indicador visual de consumo de presupuesto o avance de meta de ahorro.
- **Comportamiento:** Altura de 8dp, bordes redondeados (`rounded-full`), relleno animado según porcentaje.
- **Semántica:** Atributo de accesibilidad `accessibilityRole="progressbar"`.

#### 6. `GuacaDivider`
- **Función:** Línea sutil de 1px con color `--border-subtle` para separar filas dentro de un contenedor sin anidar tarjetas.

#### 7. `GuacaInput`
- **Función:** Campo de texto o numérico con etiqueta flotante clara, zona táctil de min-h de 48dp y validación integrada en español sencillo.

#### 8. `PillarChip`
- **Función:** Selector táctil de 48dp de altura para clasificar rápidamente un gasto en los 4 pilares básicos o en ocio libre.

---

### 6.2 Moléculas (Combinaciones funcionales de átomos)

#### 1. `MoneyStatCard`
- **Estructura:** Contenedor plano de 1px borde (`border-subtle`), etiqueta descriptiva en Manrope, monto principal en JetBrains Mono tabular y un `TrafficLightBadge` explicativo.
- **Regla:** Sin tarjetas anidadas en su interior.

#### 2. `WalletCard`
- **Estructura:** Ficha de cuenta bancaria o billetera digital con icono representativo, nombre de la cuenta, tipo (Ahorros, Corriente, Efectivo, Billetera) y saldo actual formateado.

#### 3. `DebtItemCard`
- **Estructura:** Ficha de deuda o tarjeta de crédito que muestra:
  - Saldo adeudado total.
  - Cuota mensual mínima obligatoria.
  - **Traducción en pesos:** *"Pagas ~$X al mes de interés por cada $100.000 prestados"*.
  - Selector para marcar pago o hacer abono extraordinario.

#### 4. `TransactionItem`
- **Estructura:** Fila accesible de 64dp de altura total:
  - Icono circular de categoría a la izquierda (40x40dp).
  - Columna central con nombre del comercio o movimiento, fecha y nombre de la cuenta.
  - Columna derecha con importe en JetBrains Mono tabular (verde para ingresos, oscuro/blanco para gastos) y pastilla del pilar correspondiente.

#### 5. `SubscriptionLeakItem`
- **Estructura:** Fila de suscripción recurrente o gasto hormiga:
  - Nombre del servicio (ejemplo: Netflix, café diario).
  - Costo mensual en pesos.
  - Cifra destacada del impacto anual: *"Te cuesta $420.000 al año"*.

#### 6. `InsightBanner`
- **Estructura:** Caja tonal destacada sobre `--brand-soft` con borde de 1px:
  - Icono del Coach Pablo.
  - Consejo redactado en lenguaje sencillo y amigable.
  - Botón de acción directa de un toque (ejemplo: *"Ajustar meta"*, *"Ver fugas"*).

#### 7. `TransferAccountSelector`
- **Estructura:** Selector visual con dos casillas táctiles de 48dp:
  - Casilla 1: ¿De cuál cuenta sale la plata?
  - Flecha indicadora bidireccional.
  - Casilla 2: ¿A cuál cuenta llega la plata?
  - Previene confusiones o registros duplicados de gastos ficticios.

#### 8. `VitalPillarRow`
- **Estructura:** Fila interactiva para cada uno de los 4 pilares en el onboarding y ajustes:
  - Icono representativo (Casa, Canasta, Bombillo, Bus).
  - Nombre del pilar y descripción didáctica.
  - Campo numérico en pesos con cálculo reactivo de la suma total en tiempo real.

#### 9. `GuacaSnackbar`
- **Estructura:** Notificación inferior fijada a 16dp sobre la barra de navegación:
  - Mensaje de confirmación en lenguaje positivo.
  - Botón de texto contrastado con la acción `Deshacer`.
  - Desaparición automática tras 4 segundos si no se interactúa.

---

### 6.3 Organismos (Módulos completos de pantalla)

#### 1. `MonthHealthPanel` ("Semáforo del Mes")
- **Ubicación:** Cabecera de la pestaña Inicio.
- **Función:** Presenta en un solo vistazo la radiografía del mes:
  - Estado general: Paz (Verde), Alerta (Ámbar) o Riesgo (Rojo).
  - Barra de distribución: Mínimo Vital protegido vs. Gastos variables vs. Capacidad de Ahorro libre.
  - Monto disponible en pesos para gastar con tranquilidad el resto del mes.

#### 2. `DebtPayoffPlanner` (Plan de Pago de Deudas)
- **Ubicación:** Pestaña Cuentas.
- **Función:** Comparador interactivo de los dos métodos:
  - Pestaña A: **Victorias Rápidas** (liquida primero la deuda más chica para ganar motivación).
  - Pestaña B: **Ahorra Más Intereses** (ataca primero la deuda con el interés más caro para pagar menos plata en total).
  - Proyección en meses exactos para quedar en ceros y total de dinero ahorrado en intereses.

#### 3. `AffordabilitySimulator` ("¿Me alcanza de verdad?")
- **Ubicación:** Pestaña Plan Coach.
- **Función:** Simulador interactivo de compras:
  - Selector de monto de la compra y número de cuotas (1 a 36 meses).
  - Cálculo instantáneo de la cuota mensual.
  - Diagnóstico honesto: Seguro (Verde), Alerta (Ámbar) o Riesgo Mínimo Vital (Rojo).

#### 4. `LeakDetectorList`
- **Ubicación:** Pestaña Presupuesto.
- **Función:** Listado ordenado de suscripciones y micro-gastos con sumatoria total del dinero que se fuga al año.

#### 5. `EmergencyFundGauge`
- **Ubicación:** Pestaña Plan Coach.
- **Función:** Visualizador del Colchón de Tranquilidad:
  - Círculo de progreso con meses cubiertos (ejemplo: `2.4 / 3.0 meses`).
  - Dinero actual ahorrado vs. meta en pesos.
  - Botón para hacer aportes directos desde una cuenta disponible.

#### 6. `QuickRecordSheet`
- **Ubicación:** Hoja modal inferior (`@gorhom/bottom-sheet`) activada por el FAB.
- **Función:** Permite guardar un gasto, ingreso o traslado en menos de 5 segundos con teclado numérico limpio y selección rápida de pilar.

#### 7. `OnboardingWizard`
- **Ubicación:** Ruta `app/onboarding.tsx`.
- **Función:** Proceso guiado de 3 pasos que calcula el Mínimo Vital inicial y deja la app lista sin datos inventados.

#### 8. `BackupRestoreCard`
- **Ubicación:** Pantalla de Ajustes.
- **Función:** Exportación e importación transparente de archivo `.json` local, con confirmación clara para proteger la información del usuario.

---

## 7. Mapeo de Tokens para React Native (`src/constants/theme.ts`)

Dado que librerías nativas como `react-native-svg` y `react-native-reanimated` requieren valores hexadecimales estáticos directos (no pueden interpretar cadenas CSS dinámicas `rgb(var(--...))`), se establece este archivo espejo como contrato oficial:

```typescript
// src/constants/theme.ts
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
```

---

## 8. Guía de Humanización de Marca y Microcopy Sin Culpa (Estilo Nequi + Pablo Financiero)

Esta guía define el tono, voz y personalidad de Guaca en todas las pantallas, notificaciones, resúmenes del coach y diagnósticos de inteligencia artificial.

### 8.1 Los 5 Pilares de Voz y Tono

1. **Arquetipo "El Parcero Sabio":**
   Hablamos de tú a tú, cercanos, cálidos y sin subirnos a ningún pedestal bancario. No somos un juez ni un auditor tributario; somos el parcero que se sienta a tu lado en la mesa, te habla con la verdad sin tapujos, pero siempre te cuida las espaldas.

2. **Metáforas Cotidianas ("Tu Guaca", "Lo Sagrado del Mes"):**
   Reemplazamos conceptos financieros abstractos y fríos por términos tangibles que conectan con la cultura colombiana:
   - En lugar de *"Fondo de Reserva de Emergencia"*, decimos **"Tu Guaca"** o **"Colchón de Tranquilidad"**.
   - En lugar de *"Costos fijos operacionales esenciales"*, decimos **"Lo sagrado del mes"** o **"Mínimo Vital Intocable"** (techo, comida, servicios y transporte).
   - En lugar de *"Superávit discrecional disponible"*, decimos **"Plata libre sin culpa"** o **"Lo que te queda pa' ti"**.

3. **Microcopy Sin Culpa (Cero Regaños ni Alertas Vergonzantes):**
   Los errores financieros no se castigan con lenguaje punitivo ni colores alarmistas humillantes. Si el usuario gastó de más o el mes viene apretado, la app nunca dice *"¡Has gastado en exceso!"* o *"Saldo insuficiente"*. En su lugar, ofrecemos apoyo empático: *"Ey, este mes estuvo movido. Tranqui: respiremos, cuidemos lo sagrado y vamos paso a paso para enderezar el barco"*. Celebrar cada avance, por pequeño que sea.

4. **Traducción Radical a Plata Real (Pesos y Días):**
   Prohibido mostrar porcentajes abstractos o tasas efectivas anuales sin su equivalente real. Todo se traduce a:
   - **Plata por día:** *"Hoy tienes luz verde para gastar hasta $ 35.000 sin remordimientos"*.
   - **Días de tranquilidad ganados:** *"Si recortas esta suscripción, le sumas 14 días más de paz a Tu Guaca"*.
   - **Plata anual rescatada:** *"Son $ 420.000 al año que se quedan en tu bolsillo"*.

5. **Empatía en Silencios, Vacíos y Confirmaciones:**
   Las pantallas vacías (empty states) no son errores; son oportunidades de aliento: *"Todo en calma por acá. Cuando te llegue un pago o hagas una compra, anótalo en 2 toques"*. Al eliminar un registro o corregir un número, siempre se ofrece la opción inmediata de **"Deshacer"** sin juzgar.

---

### 8.2 Diccionario Comparativo: Términos Bancarios Fríos vs. Voz Guaca

| Concepto Técnico / Término Bancario | Expresión Fría Tradicional | Voz Guaca ("Estilo Nequi + Pablo Financiero") | Intención Emocional |
| :--- | :--- | :--- | :--- |
| **Fondo de Emergencia** | Fondo de Imprevistos / Contingencia | **Tu Guaca** / **Colchón de Tranquilidad** | Seguridad cálida y pertenencia |
| **Gastos Fijos Esenciales** | Gastos Ineludibles / Costos Fijos | **Lo sagrado del mes** / **Mínimo Vital** | Protección sin estrés |
| **Presupuesto Disponible** | Superávit Remanente / Saldo Disponible | **Plata libre sin culpa** / **Lo tuyo pal día** | Disfrute sin remordimiento |
| **Gastos Hormiga / Fugas** | Egresos Recurrentes No Operativos | **Fugas silenciosas** / **Fugas de tu plata** | Consciencia amistosa |
| **Exceso de Gasto** | Límite presupuestal superado / Déficit | **Mes movido, cuidemos lo esencial** | Cero culpa, enfoque en solución |
| **Alerta de Deuda** | Alerta de sobreendeudamiento | **Vamos a alivianar esa carga juntos** | Apoyo activo y esperanza |
| **Saldo en Cero / Insuficiente** | Fondos insuficientes / Error | **Estás al ras, tranqui: vamos paso a paso** | Tranquilidad y contención |
| **Aporte a Ahorro** | Transacción de fondeo patrimonial | **Una monedita más para Tu Guaca** | Celebración cotidiana |

