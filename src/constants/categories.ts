import { FinancialPillar } from '../domain/types';

export interface CategoryDefinition {
  id: string;
  name: string;
  pillar: FinancialPillar;
  iconName: string;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'vivienda', name: 'Vivienda', pillar: 'vital', iconName: 'Home', color: '#1D4ED8' },
  { id: 'mercado', name: 'Mercado', pillar: 'vital', iconName: 'ShoppingCart', color: '#1D4ED8' },
  { id: 'servicios', name: 'Servicios', pillar: 'vital', iconName: 'Zap', color: '#1D4ED8' },
  { id: 'transporte', name: 'Transporte', pillar: 'vital', iconName: 'Bus', color: '#1D4ED8' },
  { id: 'salud', name: 'Salud y Cuidado', pillar: 'vital', iconName: 'HeartPulse', color: '#1D4ED8' },
  { id: 'educacion', name: 'Educación', pillar: 'vital', iconName: 'GraduationCap', color: '#1D4ED8' },
  { id: 'ocio', name: 'Ocio y Salidas', pillar: 'leisure', iconName: 'Coffee', color: '#9A4306' },
  { id: 'suscripciones', name: 'Suscripciones', pillar: 'leisure', iconName: 'Tv', color: '#9A4306' },
  { id: 'compras', name: 'Compras y Gustos', pillar: 'leisure', iconName: 'ShoppingBag', color: '#9A4306' },
  { id: 'guaca', name: 'Tu Guaca (Ahorro)', pillar: 'growth', iconName: 'ShieldCheck', color: '#116B34' },
  { id: 'deudas', name: 'Pago de Deudas', pillar: 'debt', iconName: 'CreditCard', color: '#BE123C' },
  { id: 'ingresos', name: 'Ingresos y Sueldo', pillar: 'income', iconName: 'Wallet', color: '#116B34' },
  { id: 'otros', name: 'Varios', pillar: 'leisure', iconName: 'Tag', color: '#485A53' },
];

export function getCategoryDefinition(id?: string): CategoryDefinition {
  if (!id) return DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  const found = DEFAULT_CATEGORIES.find((c) => c.id.toLowerCase() === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase());
  return (
    found || {
      id,
      name: id,
      pillar: 'leisure',
      iconName: 'Tag',
      color: '#485A53',
    }
  );
}
