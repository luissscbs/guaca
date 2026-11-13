# Guaca: Contexto de Producto y Reglas de Negocio

> **Versión del documento:** 2.0 (Aprobada)  
> **Nombre del producto:** Guaca  
> **Lema oficial:** "Lo tuyo, intocable. Lo demás, bajo control."  
> **Plataforma objetivo:** Android nativo (construido con React Native, Expo SDK 52+, NativeWind v4, SQLite local).  
> **Modelo operativo:** 100% fuera de línea (Offline-First), sin servidores externos, sin cuentas en la nube y con privacidad total.  
> **Moneda por defecto:** Peso Colombiano (COP, formato `$ 1.250.000` sin decimales).

---

## 1. Propósito y Audiencia

### 1.1 El problema real
En Colombia y América Latina, la mayoría de aplicaciones financieras fracasan por dos motivos:
1. Hablan en lenguaje bancario incomprensible (tasas E.A., amortizaciones complejas, gráficos abstractos) que confunde y asusta a los usuarios.
2. Tratan todo el dinero como si fuera igual, permitiendo que una persona gaste en ocio plata que en realidad necesita para el arriendo o la comida de final de mes.

### 1.2 La promesa de Guaca
Guaca no es una hoja de cálculo fría ni un clon de banca digital. Es un compañero financiero inteligente que funciona como un guardián de tu tranquilidad:
- **Protege primero lo indispensable:** Identifica y blinda tu "Mínimo Vital" para que nunca te falte techo, comida, luz o pasaje.
- **Te dice la verdad sin rodeos:** Calcula tu "Capacidad de Ahorro Real", que es la plata que de verdad te sobra después de pagar tus compromisos.
- **Te habla en español claro:** Cero jerga financiera. Todo se explica con ejemplos del día a día y costos directos en pesos.
- **Tu privacidad es sagrada:** No te pide correo, no se conecta a tu banco, no envía tus datos a internet y funciona sin señal celular.

### 1.3 Audiencia objetivo
Personas reales en Colombia: trabajadores dependientes, independientes, comerciantes y familias que quieren tomar el control de su plata, salir de deudas y dormir en paz, sin necesitar un título en economía.

---

## 2. Filosofía del Coach Financiero (Pablo Financiero)

Guaca implementa la metodología de finanzas conscientes adaptada a la vida cotidiana:

### 2.1 El Mínimo Vital Intocable (`vitalMinimum`)
Es el costo real de estar vivo y tranquilo durante un mes. Se compone obligatoriamente de 4 pilares básicos:
1. **Vivienda:** Arriendo o cuota de vivienda, administración.
2. **Mercado:** Alimentación básica del hogar.
3. **Servicios:** Luz, agua, gas, internet y telefonía esencial.
4. **Transporte:** Pasajes de transporte público, gasolina o movilidad básica obligatoria.

$$\text{Mínimo Vital} = \text{Vivienda} + \text{Mercado} + \text{Servicios} + \text{Transporte}$$

*Regla de oro:* Este dinero es intocable. La aplicación nunca sugiere usarlo para pagar lujos, compras por impulso ni cuotas innecesarias.

### 2.2 Capacidad de Ahorro Real (`savingCapacity`)
Muchos creen que su capacidad de ahorro es lo que les sobra al final del mes. En Guaca se calcula al principio del mes:

$$\text{Capacidad de Ahorro Real} = \text{Ingreso Neto} - \text{Mínimo Vital} - \text{Cuotas Mínimas de Deudas}$$

- Si es **positiva y holgada (más del 20% del ingreso):** Estado de Paz (Verde). Puedes ahorrar, invertir o darte gustos planificados.
- Si es **ajustada (entre 1% y 19% del ingreso):** Estado de Alerta (Ámbar). Hay que vigilar gastos hormiga.
- Si es **cero o negativa:** Estado de Riesgo (Rojo). Tus deudas o gastos están mordiendo tu Mínimo Vital.

### 2.3 Colchón de Tranquilidad (Fondo de Emergencia)
No se mide como un número grande y frío, sino en **meses de vida cubierta**.
$$\text{Meses de Tranquilidad} = \frac{\text{Dinero Ahorrado en Fondo de Emergencia}}{\text{Mínimo Vital Mensual}}$$
- Meta inicial para principiantes: **1 mes de Mínimo Vital**.
- Meta intermedia: **3 meses de Mínimo Vital**.
- Meta de paz financiera completa: **6 meses de Mínimo Vital**.

### 2.4 Detector de Fugas y Gastos Hormiga
Un café diario de $5.000 parece inofensivo en el momento, pero representa $150.000 al mes y $1.800.000 al año.
Guaca multiplica automáticamente cada gasto hormiga o suscripción recurrente por 12:
- *"Esta suscripción de $35.000 te cuesta $420.000 al año."*
- Permite al usuario tomar decisiones conscientes sin sentirse culpable, entendiendo el peso real de sus hábitos.

### 2.5 Simulador "¿Me alcanza de verdad?"
Antes de comprar algo a crédito o de contado, el usuario ingresa el valor y el número de cuotas deseadas:
- **Compra Segura (Verde):** La cuota mensual no supera el 50% de tu Capacidad de Ahorro Real. Tu Mínimo Vital y tu colchón siguen a salvo.
- **Cuidado con el Ahorro (Ámbar):** La cuota se come más del 50% de tu ahorro mensual. Si pasa algo inesperado, te apretarás.
- **Peligro (Rojo):** La cuota supera tu Capacidad de Ahorro o entra a gastarse la plata del arriendo o la comida. La app te lo dice con claridad: *"Esta compra pondría en riesgo tu Mínimo Vital"*.

### 2.6 Plan de Pago de Deudas ("Para Dummies")
En lugar de hablar de "Amortización francesa", "TIR" o "Tasa Efectiva Anual (E.A.)":
1. **Traducción de intereses a pesos:** Cada deuda muestra cuánto dinero se pierde al mes solo en intereses:
   - *"Por cada $100.000 que debes en esta tarjeta, el banco se queda con ~$2.100 al mes solo en intereses."*
2. **Los dos caminos comprobados:**
   - **Camino 1: Victorias Rápidas (Método Bola de Nieve):** Se concentra el dinero extra en liquidar primero la deuda de menor saldo total. Cada deuda eliminada genera alivio psicológico inmediato y libera su cuota para la siguiente.
   - **Camino 2: Ahorra Más Intereses (Método Avalancha):** Se concentra el dinero extra en pagar primero la deuda con la tasa de interés más costosa. Matemáticamente ahorra la mayor cantidad de plata en el tiempo.
3. El usuario puede comparar ambos caminos en una sola pantalla y ver cuántos meses antes quedará libre de deudas.

---

## 3. Navegación Principal del Sistema (5 Pestañas + Pantallas Satélite)

La navegación sigue las directrices ergonómicas de Android y Material Design 3 con una barra inferior de 5 destinos principales:

```text
[ Inicio ]   [ Movimientos ]   [ Cuentas ]   [ Presupuesto ]   [ Plan Coach ]
```

### 3.1 Pestaña 1: Inicio (`app/(tabs)/index.tsx`)
- **Encabezado:** Saludo personal, selector rápido de mes y botón de Modo Privado (icono de ojo que oculta saldos como `$ •••••••`).
- **Semáforo del Mes (Panel principal):**
  - Estado del mes: Paz (Verde), Alerta (Ámbar) o Riesgo (Rojo).
  - Comparativa visual clara: Ingresos vs. Mínimo Vital vs. Gastos del Mes.
  - Cifra destacada de Capacidad de Ahorro disponible para lo que queda del mes.
- **Consejo del día del Coach:** Mensaje breve y accionable basado en el comportamiento reciente.
- **Últimos movimientos:** Acceso directo a los 3 registros más recientes.
- **Acción principal flotante (FAB):** Botón circular ergonómico de 56dp en la esquina inferior derecha etiquetado como `Anotar rápido`.

### 3.2 Pestaña 2: Movimientos (`app/(tabs)/movements.tsx`)
- **Buscador y filtros:** Por texto, cuenta bancaria, categoría o pilar financiero (Vivienda, Mercado, Servicios, Transporte, Ocio, Ahorro).
- **Lista cronológica:** Agrupada por fecha (Hoy, Ayer, Esta semana, Mes anterior).
- **Fila de movimiento:** Muestra icono de categoría, nombre, cuenta utilizada, etiqueta del pilar y valor en pesos con tipografía monoespaciada tabular alineada a la derecha.
- **Deslizar para acciones (Swipe):** Editar o eliminar con confirmación y Snackbar de "Deshacer".

### 3.3 Pestaña 3: Cuentas (`app/(tabs)/accounts.tsx`)
- **Resumen patrimonial:** Total en cuentas disponibles menos total de deudas.
- **Sección 1: Cuentas y Efectivo:** Tarjetas de cuentas bancarias (Bancolombia, Nequi, Daviplata, Efectivo, etc.) con saldo actual.
- **Sección 2: Tarjetas de Crédito:** Cupo total, cupo usado, fecha de corte, fecha límite de pago y cuota del mes.
- **Sección 3: Deudas y Créditos:** Lista de préstamos con saldo pendiente, cuota mensual y costo mensual de intereses en pesos.
- **Acceso directo al Plan de Deudas:** Selector entre "Victorias Rápidas" y "Ahorra Más Intereses".
- **Botón de Traslado rápido:** Para mover plata entre cuentas (por ejemplo, retirar del cajero a efectivo o pasar de cuenta corriente a Nequi) sin alterar los reportes de ingresos o gastos.

### 3.4 Pestaña 4: Presupuesto (`app/(tabs)/budgets.tsx`)
- **Progreso general del presupuesto mensual:** Porcentaje consumido a la fecha respecto al día del mes.
- **Categorías con barras de progreso:**
  - Verde: Por debajo del ritmo esperado.
  - Ámbar: Superando el 80% del tope asignado.
  - Rojo: Presupuesto sobrepasado.
- **Módulo Detector de Fugas y Gastos Hormiga:** Lista de suscripciones (Netflix, Spotify, gimnasio) y compras recurrentes con su impacto mensual y anualizado.

### 3.5 Pestaña 5: Plan Coach (`app/(tabs)/coach.tsx`)
- **Tus 4 Pilares del Mínimo Vital:** Resumen editable de Vivienda, Mercado, Servicios y Transporte.
- **Colchón de Tranquilidad:** Indicador de meses protegidos (ejemplo: *"Tienes 2.3 meses de vida cubiertos"*).
- **Metas de Ahorro:** Tarjetas de objetivos (ejemplo: *"Paseo de fin de año"*, *"Arreglo del carro"*) con barra de avance y botón para aportar dinero.
- **Simulador "¿Me alcanza de verdad?":** Calculadora interactiva para evaluar compras antes de pasar la tarjeta.
- **Acceso a Reportes Visuales:** Botón destacado que conduce a los gráficos detallados del mes.

### 3.6 Pantallas Satélite y Flujos Clave

#### A. Onboarding Guiado en 3 Pasos (`app/onboarding.tsx`)
Obligatorio en el primer arranque de la aplicación. Arranca en cero absoluto (sin datos inventados):
1. **Paso 1 (Tu Nombre y Moneda):** "¿Cómo te gusta que te llamen?" y confirmación de Peso Colombiano (COP).
2. **Paso 2 (Tus Ingresos Mensuales):** "¿Cuánto dinero recibes de forma segura al mes después de descuentos?".
3. **Paso 3 (Tus 4 Pilares Indispensables):** 4 casillas independientes y claras:
   - Casilla A: Vivienda (arriendo o cuota).
   - Casilla B: Mercado (comida básica del mes).
   - Casilla C: Servicios públicos e internet básico.
   - Casilla D: Transporte esencial.
   - La pantalla suma automáticamente en vivo: *"Tu Mínimo Vital mensual es de $X"*.
   - Al finalizar, la app celebra el inicio y deja el tablero listo para el día a día.

#### B. Registro Rápido (`app/quick-record.tsx` o Bottom Sheet)
Apertura instantánea desde el botón `Anotar rápido` (FAB):
- Selector de tipo: **Gasto**, **Ingreso** o **Traslado**.
- Teclado numérico grande y claro para ingresar el monto en pesos.
- En gastos: Selección de categoría (con sugerencia automática del pilar correspondiente) y cuenta pagadora.
- En traslados: Selección obligatoria de **Cuenta Origen** y **Cuenta Destino**.
- Registro completado en 2 toques, con confirmación háptica ligera y retorno inmediato a la pantalla anterior.

#### C. Reportes Visuales (`app/reports.tsx`)
- Gráficos SVG ligeros y limpios (sin librerías pesadas):
  - Gráfico de distribución de gastos por categoría y por pilar (Mínimo Vital vs. Gustos vs. Deudas).
  - Tendencia de gastos día a día a lo largo del mes.
  - Tasa de ahorro histórica mes a mes.

#### D. Ajustes y Respaldo Local (`app/settings.tsx`)
- Ajuste del Mínimo Vital y fecha de inicio del mes contable (día 1, 15 o 30 según cobro de nómina).
- Activación de Modo Privado por defecto.
- **Copia de Respaldo Local:**
  - Exportar copia: Genera un archivo local `guaca-respaldo-AAAA-MM-DD.json` que el usuario puede guardar en su carpeta de Descargas o compartir a su correo o Google Drive mediante el menú estándar de Android.
  - Importar copia: Permite seleccionar un archivo `.json` previo para restaurar toda la información con confirmación de seguridad.
  - Explicación honesta al usuario: *"Tus datos están guardados en tu teléfono en formato seguro. Esta copia contiene tus cuentas y movimientos para que nunca los pierdas si cambias de celular."*

---

## 4. Matriz Completa de Operaciones CRUD

Para garantizar una experiencia sólida, todos los módulos cuentan con operaciones completas:

| Entidad | Crear | Leer / Listar | Actualizar | Eliminar / Archivar |
| :--- | :--- | :--- | :--- | :--- |
| **Cuentas bancarias y efectivo** | Nombre, tipo (Bancaria, Efectivo, Billetera digital), saldo inicial, icono | Listado agrupado, saldo consolidado, detalle de movimientos | Nombre, icono, ajuste de saldo con registro de conciliación | Archivar cuenta (conserva historial) o eliminar si no tiene movimientos |
| **Tarjetas de crédito** | Nombre, cupo total, fecha de corte, fecha límite, saldo adeudado | Cupo disponible, deuda actual, cuota estimada del mes | Modificar cupo, fechas o saldo adeudado | Archivar o eliminar tarjeta sin movimientos activos |
| **Deudas y préstamos** | Nombre, acreedor, saldo inicial, cuota mensual, interés mensual estimado | Lista ordenada por método (Victorias Rápidas o Ahorro de Intereses) | Registrar abonos extraordinarios, actualizar saldo o cuota | Marcar como pagada con celebración en pantalla o eliminar |
| **Movimientos** | Monto, tipo (gasto/ingreso), fecha, cuenta, categoría, nota opcional | Filtros por mes, pilar, cuenta y categoría; búsqueda textual | Editar cualquier campo de un movimiento previo | Eliminar movimiento y revertir el saldo de la cuenta con Snackbar de deshacer |
| **Traslados** | Monto, fecha, cuenta origen, cuenta destino, nota opcional | Se visualiza en el historial con icono bidireccional | Editar monto o cuentas involucradas | Revertir traslado en ambas cuentas simultáneamente |
| **Presupuestos** | Categoría, monto mensual asignado | Progreso visual con barra de color semántico | Aumentar o reducir monto mensual | Eliminar presupuesto de la categoría |
| **Suscripciones y Fugas** | Nombre, monto recurrente, frecuencia (mensual/anual), cuenta de cobro | Listado con cálculo mensual y costo anualizado | Modificar tarifa o cambiar estado a pausada | Eliminar suscripción del radar |
| **Metas de ahorro** | Nombre, monto meta, fecha objetivo, icono | Progreso en porcentaje, saldo acumulado, saldo faltante | Modificar meta o fecha | Retirar fondos a una cuenta o eliminar meta |

---

## 5. Reglas Técnicas y Restricciones de Arquitectura

1. **Sin dependencias de red:** La aplicación debe iniciar, calcular y operar al 100% en modo avión. No hay llamadas a APIs externas en el flujo operativo.
2. **Persistencia única en SQLite:** Todos los datos residen en la base de datos local SQLite mediante `expo-sqlite`, garantizando transacciones seguras (ACID).
3. **Manejo de monedas:** Los cálculos internos se realizan en números enteros de pesos colombianos para evitar errores de redondeo de punto flotante.
4. **Respeta los gestos y botones del sistema Android:**
   - El botón o gesto de "Atrás" nunca queda atrapado ni cierra la app inesperadamente en subpantallas.
   - Zonas táctiles mínimas de 48x48dp para todos los elementos interactivos.
   - Textos adaptables a la escala del sistema (`font_scale`) sin cortar números ni etiquetas monetarias.
