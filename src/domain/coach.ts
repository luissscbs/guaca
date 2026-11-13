/**
 * Guaca v2: Financial Coach Domain Engine (Pablo Financiero)
 * Cálculos puros y reglas de negocio para finanzas conscientes "Para Dummies".
 * Sin dependencias de UI ni persistencia.
 */

import { formatCOP, formatMonths, roundCOP } from '../utils/formatters';
import {
  AnnualizedLeakResult,
  CoachSnapshot,
  Debt,
  EmergencyFundResult,
  LeakFrequency,
  MonthHealthResult,
  PurchaseSimulationResult,
  SafeAllowanceSummary,
  SpendingDetectiveInsight,
  SubscriptionLeak,
  Transaction,
  UserProfileType,
  VitalBreakdown,
} from './types';

/**
 * Calcula la suma exacta del Mínimo Vital Intocable a partir de los 4 pilares obligatorios.
 * Clampa valores negativos a 0 y redondea a enteros de pesos COP.
 */
export function calculateVitalMinimum(breakdown: VitalBreakdown): number {
  const housing = Math.max(0, roundCOP(breakdown.housing));
  const food = Math.max(0, roundCOP(breakdown.food));
  const utilities = Math.max(0, roundCOP(breakdown.utilities));
  const transport = Math.max(0, roundCOP(breakdown.transport));

  return housing + food + utilities + transport;
}

/**
 * Calcula la Capacidad de Ahorro Real al inicio del mes.
 * Formula: max(0, Ingreso Neto - Mínimo Vital - Cuotas Mínimas de Deudas).
 */
export function calculateSavingCapacity(params: {
  netIncome: number;
  vitalMinimum: number;
  debtObligations: number;
}): number {
  const safeIncome = Math.max(0, roundCOP(params.netIncome));
  const safeVital = Math.max(0, roundCOP(params.vitalMinimum));
  const safeDebts = Math.max(0, roundCOP(params.debtObligations));

  const capacity = safeIncome - safeVital - safeDebts;
  return Math.max(0, capacity);
}

/**
 * Calcula el dinero disponible para ocio consciente o gastos libres ("Sin Culpa").
 * Descuenta del ingreso: Mínimo Vital, deudas, lo ya gastado en no-vitales y ahorros blindados.
 */
export function calculateGuiltFreeAvailable(params: {
  netIncome: number;
  vitalMinimum: number;
  debtObligations: number;
  nonVitalSpentThisMonth: number;
  shieldedThisMonth?: number;
}): number {
  const capacity = calculateSavingCapacity({
    netIncome: params.netIncome,
    vitalMinimum: params.vitalMinimum,
    debtObligations: params.debtObligations,
  });

  const safeSpent = Math.max(0, roundCOP(params.nonVitalSpentThisMonth));
  const safeShielded = Math.max(0, roundCOP(params.shieldedThisMonth ?? 0));

  const available = capacity - safeSpent - safeShielded;
  return Math.max(0, available);
}

/**
 * Determina el Semáforo del Mes (Paz, Alerta o Riesgo) con explicación en lenguaje cotidiano.
 * - Paz (>= 20% de ahorro libre)
 * - Alerta (1% a 19% de ahorro libre)
 * - Riesgo (0% o déficit)
 */
export function getMonthHealthStatus(params: {
  netIncome: number;
  vitalMinimum: number;
  savingCapacity?: number;
  debtObligations?: number;
}): MonthHealthResult {
  const safeIncome = Math.max(0, roundCOP(params.netIncome));
  const safeVital = Math.max(0, roundCOP(params.vitalMinimum));

  const capacity =
    params.savingCapacity !== undefined
      ? Math.max(0, roundCOP(params.savingCapacity))
      : calculateSavingCapacity({
          netIncome: safeIncome,
          vitalMinimum: safeVital,
          debtObligations: params.debtObligations ?? 0,
        });

  if (safeIncome <= 0 || safeVital > safeIncome || capacity <= 0) {
    let explanation =
      'Estado de Riesgo: Tus compromisos y gastos no te dejan margen de ahorro libre. Revisa gastos hormiga y cuotas de deudas.';
    if (safeVital > safeIncome) {
      explanation =
        'Atención: Tu Mínimo Vital supera tus ingresos de este mes. Techo y comida son intocables; pausa cualquier otro gasto.';
    }

    return {
      status: 'risk',
      savingCapacity: capacity,
      savingCapacityPct: 0,
      explanation,
    };
  }

  const savingCapacityPct = Math.round((capacity / safeIncome) * 100);

  if (savingCapacityPct >= 20) {
    return {
      status: 'peace',
      savingCapacity: capacity,
      savingCapacityPct,
      explanation: `¡Estado de Paz! Cuentas con un ${savingCapacityPct}% de ahorro libre tras blindar tu Mínimo Vital y deudas. Tienes tranquilidad para ahorrar o darte un gusto sin culpa.`,
    };
  }

  return {
    status: 'alert',
    savingCapacity: capacity,
    savingCapacityPct,
    explanation: `Estado de Alerta: Tu capacidad de ahorro es del ${savingCapacityPct}%. Tu margen es ajustado, vigila gastos imprevistos y fugas hormiga.`,
  };
}

/**
 * Evalúa el Colchón de Tranquilidad (Fondo de Emergencia) medido en meses cubiertos.
 * Previene divisiones por cero cuando vitalMinimum === 0.
 */
export function calculateEmergencyMonths(params: {
  emergencyFundBalance: number;
  vitalMinimum: number;
}): EmergencyFundResult {
  const safeBalance = Math.max(0, roundCOP(params.emergencyFundBalance));
  const safeVital = Math.max(0, roundCOP(params.vitalMinimum));

  if (safeVital <= 0) {
    return {
      monthsCovered: 0,
      daysCovered: 0,
      nextMilestoneMonths: 1,
      goalAmount: 0,
      progressPct: 0,
      explanation:
        'Configura primero tus 4 pilares del Mínimo Vital para saber cuántos meses de tranquilidad tienes cubiertos.',
    };
  }

  const rawMonths = safeBalance / safeVital;
  const monthsCovered = Math.round(rawMonths * 10) / 10;
  const daysCovered = Math.round(monthsCovered * 30);

  let nextMilestoneMonths: 1 | 3 | 6 = 1;
  if (monthsCovered >= 3.0) {
    nextMilestoneMonths = 6;
  } else if (monthsCovered >= 1.0) {
    nextMilestoneMonths = 3;
  }

  const goalAmount = safeVital * nextMilestoneMonths;
  const progressPct = Math.min(100, Math.max(0, Math.round((safeBalance / goalAmount) * 100)));

  let explanation: string;
  if (monthsCovered < 1.0) {
    explanation = `Tienes ${formatMonths(monthsCovered)} cubiertos (${daysCovered} días). Tu primera gran meta es alcanzar 1 mes de Mínimo Vital (${formatCOP(goalAmount)}) para Tu Guaca.`;
  } else if (monthsCovered < 3.0) {
    explanation = `¡Gran avance! Tienes ${formatMonths(monthsCovered)} cubiertos (${daysCovered} días). Tu siguiente escalón son 3 meses (${formatCOP(goalAmount)}) en Tu Guaca.`;
  } else if (monthsCovered < 6.0) {
    explanation = `¡Excelente estabilidad! Tienes ${formatMonths(monthsCovered)} cubiertos (${daysCovered} días). Tu meta final de paz son 6 meses (${formatCOP(goalAmount)}) en Tu Guaca.`;
  } else {
    explanation = `¡Paz financiera total! Tienes ${formatMonths(monthsCovered)} cubiertos (${daysCovered} días). Tu Guaca (colchón de tranquilidad) está completamente blindada.`;
  }

  return {
    monthsCovered,
    daysCovered,
    nextMilestoneMonths,
    goalAmount,
    progressPct,
    explanation,
  };
}

/**
 * Calcula el impacto mensual y el costo anualizado de suscripciones o gastos hormiga.
 */
export function calculateAnnualizedLeak(
  amount: number,
  frequency: LeakFrequency
): AnnualizedLeakResult {
  const safeAmount = Math.max(0, roundCOP(amount));

  if (frequency === 'monthly') {
    const annualCost = safeAmount * 12;
    return {
      monthlyEquivalent: safeAmount,
      annualCost,
      explanation: `Esta suscripción de ${formatCOP(safeAmount)} al mes te cuesta ${formatCOP(annualCost)} al año.`,
    };
  }

  const monthlyEquivalent = Math.round(safeAmount / 12);
  return {
    monthlyEquivalent,
    annualCost: safeAmount,
    explanation: `Este pago de ${formatCOP(safeAmount)} al año equivale a apartar ${formatCOP(monthlyEquivalent)} cada mes.`,
  };
}

/**
 * Simulador "¿Me alcanza de verdad?":
 * Evalúa si una compra en cuotas o de contado pone en riesgo el Mínimo Vital o el ahorro.
 */
export function simulatePurchase(params: {
  amount: number;
  months: number;
  savingCapacity: number;
  vitalMinimum?: number;
}): PurchaseSimulationResult {
  const safeAmount = Math.max(0, roundCOP(params.amount));
  const safeMonths = Math.max(1, Math.round(params.months || 1));
  const safeCapacity = Math.max(0, roundCOP(params.savingCapacity));

  if (safeAmount === 0) {
    return {
      verdict: 'safe',
      monthlyQuota: 0,
      remainingSavingCapacity: safeCapacity,
      explanation: 'Compra segura y sin costo adicional.',
    };
  }

  const monthlyQuota = Math.round(safeAmount / safeMonths);
  const remainingSavingCapacity = safeCapacity - monthlyQuota;

  if (monthlyQuota > safeCapacity) {
    return {
      verdict: 'danger',
      monthlyQuota,
      remainingSavingCapacity,
      explanation: `Peligro: La cuota mensual de ${formatCOP(monthlyQuota)} supera tu capacidad de ahorro (${formatCOP(safeCapacity)}) y pondría en riesgo tu Mínimo Vital.`,
    };
  }

  if (remainingSavingCapacity < safeCapacity * 0.5) {
    return {
      verdict: 'warning',
      monthlyQuota,
      remainingSavingCapacity,
      explanation: `Cuidado con el ahorro: La cuota de ${formatCOP(monthlyQuota)} consume más de la mitad de tu ahorro mensual. Quedarías con poco margen ante imprevistos.`,
    };
  }

  return {
    verdict: 'safe',
    monthlyQuota,
    remainingSavingCapacity,
    explanation: `Compra Segura: La cuota de ${formatCOP(monthlyQuota)} cabe cómodamente en tu ahorro mensual sin comprometer tu tranquilidad.`,
  };
}

/**
 * Genera un consejo del Coach accionable, empático y en español cotidiano según la foto actual del usuario.
 * Aplica Microcopy Sin Culpa (estilo Nequi + Pablo Financiero) y nombra a Tu Guaca.
 */
export function evaluateCoachRules(snapshot: CoachSnapshot): string {
  if (snapshot.vitalMinimum <= 0) {
    return 'Configura tus 4 pilares del Mínimo Vital en el Plan Coach para que podamos cuidar Tu Guaca y tu tranquilidad.';
  }

  if (snapshot.netIncome <= 0) {
    return 'Registra tus ingresos mensuales para que Guaca pueda calcular tu capacidad de ahorro real.';
  }

  if (snapshot.vitalMinimum > snapshot.netIncome) {
    return 'Ey, este mes estuvo movido: tu Mínimo Vital supera tus ingresos. Tranqui, cuidemos lo sagrado primero (techo y comida) antes de cualquier otro gasto.';
  }

  if (snapshot.debtObligations > snapshot.netIncome * 0.4) {
    return 'Tus deudas están consumiendo más del 40% de tu sueldo. Tranqui: revisa el Plan de Pago en Cuentas para liberarte paso a paso sin culpa.';
  }

  if (snapshot.emergencyFundBalance < snapshot.vitalMinimum) {
    return 'Tu primera meta de oro: reunir 1 mes de Mínimo Vital para Tu Guaca (tu colchón de tranquilidad). ¡Cada peso suma!';
  }

  if (snapshot.totalLeaksAnnual > 500000) {
    return 'Revisa tus suscripciones: detectamos fugas silenciosas por más de $ 500.000 al año que podrías rescatar para Tu Guaca.';
  }

  return '¡Vas con paso firme! Tu Mínimo Vital está protegido y tienes margen para ahorrar en Tu Guaca o darte un gusto consciente sin culpa.';
}

export const getDailyCoachTip = evaluateCoachRules;

/**
 * Calcula el gasto diario y semanal seguro ("Safe Allowance") según perfil de ingreso.
 * Sin regaños, con microcopy empático y límites protectores.
 */
export function calculateSafeAllowance(params: {
  guiltFreeAvailable: number;
  daysRemainingInMonth: number;
  profileType?: UserProfileType;
}): SafeAllowanceSummary {
  const profileType: UserProfileType = params.profileType ?? 'salary';

  const profileLabels: Record<UserProfileType, string> = {
    salary: 'Sueldo fijo',
    student: 'Estudiante / Mesada',
    variable: 'Independiente / Variable',
  };
  const profileLabel = profileLabels[profileType] || 'Sueldo fijo';

  let rawDays = Math.floor(params.daysRemainingInMonth);
  if (!Number.isFinite(rawDays) || rawDays < 1) rawDays = 1;
  if (rawDays > 31) rawDays = 31;
  const safeDays = rawDays;

  const available = Math.max(0, roundCOP(params.guiltFreeAvailable));

  if (available <= 0) {
    return {
      profileType,
      profileLabel,
      dailyAllowance: 0,
      weeklyAllowance: 0,
      daysRemaining: safeDays,
      headlineMessage:
        'Este mes ya cubriste lo tuyo al ras, tranqui: vamos paso a paso cuidando lo esencial.',
    };
  }

  const dailyAllowance = Math.floor(available / safeDays);
  const weeklyDays = Math.min(7, safeDays);
  const weeklyAllowance = Math.min(available, Math.floor(dailyAllowance * weeklyDays));

  let headlineMessage: string;
  if (profileType === 'student') {
    headlineMessage = `Con tu mesada te alcanza para gastar ${formatCOP(dailyAllowance)} al día (${formatCOP(weeklyAllowance)} esta semana) sin remordimientos.`;
  } else if (profileType === 'variable') {
    headlineMessage = `Para que la plata te rinda parejo este mes, puedes gastar hasta ${formatCOP(dailyAllowance)} al día (${formatCOP(weeklyAllowance)} por semana).`;
  } else {
    headlineMessage = `Tienes luz verde para gastar ${formatCOP(dailyAllowance)} al día (${formatCOP(weeklyAllowance)} esta semana) con total tranquilidad.`;
  }

  return {
    profileType,
    profileLabel,
    dailyAllowance,
    weeklyAllowance,
    daysRemaining: safeDays,
    headlineMessage,
  };
}

export interface SpendingDetectiveInput {
  transactions: Transaction[];
  subscriptions: SubscriptionLeak[];
  vitalMinimum: number;
  emergencyFundBalance?: number;
  debts?: Debt[];
  now?: Date | string;
}

/**
 * El Detective de tu Plata:
 * Motor 100% local y determinístico que detecta fugas silenciosas y gastos recortables,
 * calculando cuánto dinero anual y cuántos días de Guaca ganas para tu tranquilidad.
 */
export function analyzeSpendingDetective(
  params: SpendingDetectiveInput
): SpendingDetectiveInsight[] {
  const refDate = params.now ? new Date(params.now) : new Date();
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();

  const safeVital = Math.max(0, roundCOP(params.vitalMinimum));
  const dailyVital = Math.max(1, Math.round(safeVital / 30));

  const unpaidDebts = (params.debts || []).filter((d) => !d.isPaid);
  const totalDebt = unpaidDebts.reduce((sum, d) => sum + Math.max(0, d.remainingBalance), 0);
  const totalMinPayment = unpaidDebts.reduce(
    (sum, d) => sum + Math.max(0, d.minimumMonthlyPayment),
    0
  );

  const insights: SpendingDetectiveInsight[] = [];

  // 1. Analizar gastos discrecionales del mes actual agrupados por categoría
  const categorySpends = new Map<string, number>();

  for (const tx of params.transactions) {
    if (tx.type !== 'expense') continue;
    // Excluir gastos de mínimo vital, deudas, transferencias o ingresos
    if (
      tx.pillar === 'vital' ||
      tx.pillar === 'debt' ||
      tx.pillar === 'transfer' ||
      tx.pillar === 'income'
    ) {
      continue;
    }

    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) continue;
    if (txDate.getFullYear() !== currentYear || txDate.getMonth() !== currentMonth) {
      continue;
    }

    const catName = tx.categoryId?.trim() || 'Varios';
    const current = categorySpends.get(catName) || 0;
    categorySpends.set(catName, current + Math.max(0, tx.amount));
  }

  for (const [catName, spend] of categorySpends.entries()) {
    if (spend <= 0) continue;
    const suggestedCutAmount = Math.round(spend * 0.35); // 35% de recorte sugerido
    const annualSavings = suggestedCutAmount * 12;

    const daysOfGuacaGained =
      safeVital > 0 && suggestedCutAmount > 0
        ? Math.max(1, Math.round(annualSavings / dailyVital))
        : 0;

    let debtMonthsSaved = 0;
    if (totalDebt > 0 && suggestedCutAmount > 0) {
      const divisor = totalMinPayment > 0 ? totalMinPayment : totalDebt / 12;
      debtMonthsSaved = Math.max(1, Math.round(annualSavings / Math.max(1, divisor)));
    }

    const nequiMessage = `Pillamos que en ${catName} van ${formatCOP(spend)} este mes. Bajándole un 35% te rescatas ${formatCOP(annualSavings)} al año para Tu Guaca (${daysOfGuacaGained} días más de tranquilidad).`;

    insights.push({
      id: `cat_${catName.toLowerCase().replace(/\s+/g, '_')}`,
      sourceType: 'category',
      categoryOrLeakName: catName,
      monthlySpend: spend,
      suggestedCutAmount,
      annualSavings,
      daysOfGuacaGained,
      debtMonthsSaved,
      nequiMessage,
    });
  }

  // 2. Analizar suscripciones activas
  for (const sub of params.subscriptions) {
    if (sub.isActive === false) continue;
    const monthlySpend =
      sub.frequency === 'annual'
        ? Math.round(Math.max(0, sub.amount) / 12)
        : Math.max(0, sub.amount);
    if (monthlySpend <= 0) continue;

    const suggestedCutAmount = monthlySpend;
    const annualSavings = suggestedCutAmount * 12;

    const daysOfGuacaGained =
      safeVital > 0 && suggestedCutAmount > 0
        ? Math.max(1, Math.round(annualSavings / dailyVital))
        : 0;

    let debtMonthsSaved = 0;
    if (totalDebt > 0 && suggestedCutAmount > 0) {
      const divisor = totalMinPayment > 0 ? totalMinPayment : totalDebt / 12;
      debtMonthsSaved = Math.max(1, Math.round(annualSavings / Math.max(1, divisor)));
    }

    const nequiMessage = `Tienes la suscripción de ${sub.name} en ${formatCOP(monthlySpend)}/mes. Al cancelarla o compartirla sumas ${formatCOP(annualSavings)} al año para Tu Guaca (${daysOfGuacaGained} días más de paz).`;

    insights.push({
      id: `sub_${sub.id}`,
      sourceType: 'subscription',
      categoryOrLeakName: sub.name,
      monthlySpend,
      suggestedCutAmount,
      annualSavings,
      daysOfGuacaGained,
      debtMonthsSaved,
      nequiMessage,
    });
  }

  // 3. Ordenar por mayor ahorro anual y limitar a 3
  insights.sort((a, b) => b.annualSavings - a.annualSavings);
  return insights.slice(0, 3);
}
