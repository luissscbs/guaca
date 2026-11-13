/**
 * Guaca v2: Debt Payoff Planner Domain Engine
 * Estrategias de amortización acelerada: Victorias Rápidas (Bola de Nieve) vs. Ahorra Más Intereses (Avalancha).
 * Traduce tasas bancarias abstractas a pesos COP comprensibles sin tecnicismos ("Para Dummies").
 */

import { formatCOP, roundCOP } from '../utils/formatters';
import { Debt, DebtPayoffPlan, DebtPayoffStrategy } from './types';

export const MAX_SIMULATION_MONTHS = 600; // Tope de seguridad: 50 años
export const MAX_ACTIVE_DEBTS = 200;      // Tope de seguridad para deudas concurrentes

/**
 * Traduce una tasa de interés mensual a pesos COP por cada $100.000 de saldo.
 * Ejemplo: 2.1% mensual -> $2.100 por cada $100.000 adeudados.
 */
export function calculateInterestPer100k(monthlyRatePct: number): number {
  if (!Number.isFinite(monthlyRatePct) || monthlyRatePct <= 0) {
    return 0;
  }
  return roundCOP(100000 * (monthlyRatePct / 100));
}

/**
 * Estima el costo mensual de intereses en pesos COP para un saldo y tasa dados.
 */
export function estimateMonthlyInterestCOP(balance: number, monthlyRatePct: number): number {
  const safeBalance = Math.max(0, roundCOP(balance));
  if (!Number.isFinite(monthlyRatePct) || monthlyRatePct <= 0 || safeBalance === 0) {
    return 0;
  }
  return roundCOP(safeBalance * (monthlyRatePct / 100));
}

interface SimulationState {
  id: string;
  name: string;
  balance: number;
  minPayment: number;
  monthlyRate: number;
}

/**
 * Simula la amortización mes a mes de una lista de deudas.
 * Ejecuta en tiempo O(N) por mes utilizando mapas y referencias directas O(1).
 */
function runAmortizationSimulation(
  initialDebts: SimulationState[],
  extraMonthlyPayment: number
): {
  months: number;
  totalInterest: number;
  isUnpayable: boolean;
} {
  const debts = initialDebts.map((d) => ({ ...d }));
  let months = 0;
  let totalInterest = 0;
  let isUnpayable = false;

  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const totalAvailablePayment = totalMinPayment + extraMonthlyPayment;

  while (months < MAX_SIMULATION_MONTHS) {
    const activeDebts = debts.filter((d) => d.balance > 0);
    if (activeDebts.length === 0) {
      break;
    }

    months += 1;

    // 1. Calcular intereses del mes para cada deuda activa
    let monthTotalInterest = 0;
    const dues = new Map<string, number>();

    for (const d of activeDebts) {
      const interest = d.balance * d.monthlyRate;
      monthTotalInterest += interest;
      dues.set(d.id, d.balance + interest);
    }

    totalInterest += monthTotalInterest;

    // Si los pagos disponibles no cubren ni los intereses del mes, la deuda crece indefinidamente
    if (totalAvailablePayment <= monthTotalInterest) {
      isUnpayable = true;
      months = MAX_SIMULATION_MONTHS;
      break;
    }

    // 2. Asignar la cuota mínima obligatoria a cada deuda activa
    let extraPool = extraMonthlyPayment;

    // Sumar cuotas mínimas de deudas liquidadas (efecto bola de nieve)
    for (const d of debts) {
      if (d.balance <= 0) {
        extraPool += d.minPayment;
      }
    }

    for (const d of activeDebts) {
      const currentDue = dues.get(d.id)!;
      const regularPayment = Math.min(currentDue, d.minPayment);
      const remainingDue = currentDue - regularPayment;
      dues.set(d.id, remainingDue);

      // Si la deuda requirió menos de su cuota mínima para quedar en 0, el remanente se suma a la bolsa extra
      if (d.minPayment > regularPayment) {
        extraPool += d.minPayment - regularPayment;
      }
    }

    // 3. Aplicar la bolsa extra en orden de prioridad (acceso directo O(1))
    for (const d of activeDebts) {
      let currentDue = dues.get(d.id)!;
      if (currentDue > 0 && extraPool > 0) {
        const extraPayment = Math.min(currentDue, extraPool);
        currentDue -= extraPayment;
        extraPool -= extraPayment;
        dues.set(d.id, currentDue);
      }

      d.balance = Math.max(0, currentDue);
    }
  }

  // Si llegamos al mes 600 y aún hay saldo pendiente, marcar como impagable
  if (debts.some((d) => d.balance > 0)) {
    isUnpayable = true;
    months = MAX_SIMULATION_MONTHS;
  }

  return {
    months,
    totalInterest: roundCOP(totalInterest),
    isUnpayable,
  };
}

/**
 * Planifica el pago de deudas comparando el camino estándar (solo mínimos)
 * contra la estrategia seleccionada con abono extra acelerado.
 */
export function planDebtPayoff(
  debts: Debt[],
  extraMonthlyPayment: number,
  strategy: DebtPayoffStrategy
): DebtPayoffPlan {
  const safeExtra = Math.max(0, roundCOP(extraMonthlyPayment));

  // Filtrar deudas activas pendientes
  const activeDebts = debts.filter(
    (d) => !d.isPaid && Number.isFinite(d.remainingBalance) && d.remainingBalance > 0
  );

  if (activeDebts.length === 0) {
    return {
      strategy,
      monthsToFreedom: 0,
      monthsSaved: 0,
      totalInterestPaid: 0,
      interestSaved: 0,
      priorityDebt: null,
      unpayableWarning: false,
      explanation: '¡Felicidades! No tienes deudas activas pendientes.',
    };
  }

  // Ordenar según la estrategia elegida
  const sortedDebts = [...activeDebts].sort((a, b) => {
    if (strategy === 'snowball') {
      // Victorias Rápidas: Menor saldo primero; desempate por mayor tasa
      if (a.remainingBalance !== b.remainingBalance) {
        return a.remainingBalance - b.remainingBalance;
      }
      return b.estimatedMonthlyRatePct - a.estimatedMonthlyRatePct;
    }

    // Ahorra Más Intereses: Mayor tasa mensual primero; desempate por menor saldo
    if (a.estimatedMonthlyRatePct !== b.estimatedMonthlyRatePct) {
      return b.estimatedMonthlyRatePct - a.estimatedMonthlyRatePct;
    }
    return a.remainingBalance - b.remainingBalance;
  });

  const priorityDebt = sortedDebts[0];

  // Aplicar tope seguro si la cantidad de deudas activas excede el umbral extremo
  const isCapped = sortedDebts.length > MAX_ACTIVE_DEBTS;
  const targetDebts = isCapped ? sortedDebts.slice(0, MAX_ACTIVE_DEBTS) : sortedDebts;

  const simulationInputs: SimulationState[] = targetDebts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: Math.max(0, roundCOP(d.remainingBalance)),
    minPayment: Math.max(0, roundCOP(d.minimumMonthlyPayment)),
    monthlyRate: Math.max(
      0,
      (Number.isFinite(d.estimatedMonthlyRatePct) ? d.estimatedMonthlyRatePct : 0) / 100
    ),
  }));

  // Simulación 1: Línea base (sin abono extra)
  const baseline = runAmortizationSimulation(simulationInputs, 0);

  // Simulación 2: Acelerada (con abono extra)
  const accelerated = runAmortizationSimulation(simulationInputs, safeExtra);

  const monthsToFreedom = accelerated.months;
  const monthsSaved = Math.max(0, baseline.months - accelerated.months);
  const totalInterestPaid = accelerated.totalInterest;
  const interestSaved = Math.max(0, baseline.totalInterest - accelerated.totalInterest);
  const unpayableWarning = accelerated.isUnpayable;

  let explanation: string;
  if (unpayableWarning) {
    explanation =
      'Alerta: Al menos una de tus deudas no cubre los intereses con la cuota mínima o el plazo supera los 50 años. Es crucial incrementar el abono mensual o renegociar las condiciones con el acreedor.';
  } else if (strategy === 'snowball') {
    explanation = `Con el método Victorias Rápidas atacando primero "${priorityDebt.name}", quedarás libre de deudas en ${monthsToFreedom} meses. Ahorras ${formatCOP(interestSaved)} en intereses y sales ${monthsSaved} meses antes.`;
  } else {
    explanation = `Con el método Ahorra Más Intereses atacando primero "${priorityDebt.name}", quedarás libre de deudas en ${monthsToFreedom} meses. Ahorras ${formatCOP(interestSaved)} en intereses y sales ${monthsSaved} meses antes.`;
  }

  if (isCapped) {
    explanation += ` (Nota: Se calculó sobre el límite máximo de ${MAX_ACTIVE_DEBTS} deudas prioritarias).`;
  }

  return {
    strategy,
    monthsToFreedom,
    monthsSaved,
    totalInterestPaid,
    interestSaved,
    priorityDebt,
    unpayableWarning,
    explanation,
  };
}
