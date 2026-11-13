/**
 * Guaca v2: Local JSON Backup & Restore Module
 * Exporta y restaura copias de respaldo 100% locales en formato JSON.
 * Protecciones de nivel bancario: límite de 10 MB, prevención contra Prototype Pollution,
 * validación exhaustiva de dominio y reemplazo atómico en una sola transacción SQLite.
 */

import {
  Budget,
  CreditCard,
  Debt,
  SavingsGoal,
  SubscriptionLeak,
  Transaction,
  UserSettings,
  Wallet,
} from '../domain/types';
import { BackupPayload } from '../domain/types';
import { validateBackupPayload } from '../domain/validation';
import { GuacaRepository } from './repository';
import { BackupImportResult, SQLiteExecutor } from './types';

// Límite de tamaño máximo seguro para archivos de respaldo (10 MB)
export const MAX_BACKUP_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Exporta todo el contenido de la base de datos local empaquetado en un BackupPayload oficial.
 */
export async function exportBackupPayload(
  db: SQLiteExecutor,
  appVersion: string = '1.0.0'
): Promise<BackupPayload> {
  const repo = new GuacaRepository(db);

  const [
    settings,
    wallets,
    creditCards,
    debts,
    transactions,
    budgets,
    subscriptions,
    savingsGoals,
    quickPresets,
  ] = await Promise.all([
    repo.getSettings(),
    repo.listWallets({ includeArchived: true }),
    repo.listCreditCards({ includeArchived: true }),
    repo.listDebts({ includePaid: true }),
    repo.listAllTransactions(),
    repo.listBudgets(),
    repo.listSubscriptions(),
    repo.listSavingsGoals(),
    repo.listQuickPresets(),
  ]);

  if (!settings) {
    throw new Error('No es posible exportar un respaldo sin haber configurado los ajustes de usuario.');
  }

  // SEGURIDAD CRÍTICA: Excluir estrictamente geminiApiKey de la exportación
  const { geminiApiKey: _excludedApiKey, ...safeSettings } = settings;

  return {
    metadata: {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion,
    },
    settings: safeSettings,
    wallets,
    creditCards,
    debts,
    transactions,
    budgets,
    subscriptions,
    savingsGoals,
    quickPresets,
  };
}

/**
 * Serializa el objeto de respaldo a un archivo JSON legible.
 */
export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Restaura un respaldo JSON local reemplazando todas las tablas atómicamente.
 * Si ocurre cualquier error, SQLite hace rollback y no se pierde ningún dato existente.
 */
export async function importBackupJson(
  db: SQLiteExecutor,
  rawJsonInput: string | object
): Promise<BackupImportResult> {
  // 1. Validar límite de tamaño si la entrada es un string
  if (typeof rawJsonInput === 'string') {
    if (rawJsonInput.length > MAX_BACKUP_SIZE_BYTES) {
      return {
        success: false,
        error: 'El archivo supera el tamaño máximo permitido de 10 MB.',
      };
    }
  }

  // 2. Parseo seguro de JSON y detección de Prototype Pollution (claves maliciosas)
  let parsedPayload: unknown;
  const prototypePollutionKeyRegex = /"(?:__proto__|constructor|prototype)"\s*:/;

  if (typeof rawJsonInput === 'string') {
    // Detección previa a parse para capturar claves de objeto peligrosas
    if (prototypePollutionKeyRegex.test(rawJsonInput)) {
      return {
        success: false,
        error: 'Archivo rechazado por razones de seguridad: contiene propiedades maliciosas (__proto__, constructor, prototype).',
      };
    }

    try {
      parsedPayload = JSON.parse(rawJsonInput, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new Error('Archivo rechazado por razones de seguridad: contiene propiedades maliciosas.');
        }
        return value;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message.includes('seguridad')
        ? e.message
        : 'El archivo de respaldo no tiene un formato JSON válido.';
      return {
        success: false,
        error: msg,
      };
    }
  } else {
    // Si viene como objeto, serializar y verificar claves peligrosas
    const jsonStr = JSON.stringify(rawJsonInput);
    if (prototypePollutionKeyRegex.test(jsonStr)) {
      return {
        success: false,
        error: 'Archivo rechazado por razones de seguridad: contiene propiedades maliciosas (__proto__, constructor, prototype).',
      };
    }
    parsedPayload = rawJsonInput;
  }

  // 3. Validación de Dominio exhaustiva
  const validation = validateBackupPayload(parsedPayload);
  if (!validation.isValid || !validation.value) {
    return {
      success: false,
      error: validation.error || 'El archivo contiene datos inválidos o corruptos.',
    };
  }

  const payload = validation.value;
  const now = new Date().toISOString();

  // 4. Reemplazo Atómico dentro de una sola transacción
  try {
    await db.withTransactionAsync(async () => {
      // Limpiar tablas existentes en orden inverso de dependencias
      await db.execAsync(`
        DELETE FROM quick_presets;
        DELETE FROM transactions;
        DELETE FROM budgets;
        DELETE FROM subscriptions;
        DELETE FROM savings_goals;
        DELETE FROM debts;
        DELETE FROM credit_cards;
        DELETE FROM wallets;
        DELETE FROM user_settings;
      `);

      // A. user_settings (Ignora o limpia geminiApiKey por seguridad)
      const s = payload.settings;
      const profileType =
        s.profileType === 'student' || s.profileType === 'variable' ? s.profileType : 'salary';

      await db.runAsync(
        `INSERT INTO user_settings (
          id, user_name, currency, net_monthly_income,
          vital_housing, vital_food, vital_utilities, vital_transport,
          month_start_day, is_private_mode, onboarding_completed,
          profile_type, gemini_api_key,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          1,
          s.userName,
          s.currency,
          s.netMonthlyIncome,
          s.vitalMinimumBreakdown.housing,
          s.vitalMinimumBreakdown.food,
          s.vitalMinimumBreakdown.utilities,
          s.vitalMinimumBreakdown.transport,
          s.monthStartDay,
          s.isPrivateMode ? 1 : 0,
          s.onboardingCompleted ? 1 : 0,
          profileType,
          null, // Por seguridad nunca se restauran llaves secretas de archivos externos
          s.createdAt || now,
          s.updatedAt || now,
        ]
      );

      // B. wallets
      for (const w of payload.wallets) {
        await db.runAsync(
          `INSERT INTO wallets (id, name, type, balance, icon, color, is_archived, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [w.id, w.name, w.type, w.balance, w.icon ?? null, w.color ?? null, w.isArchived ? 1 : 0, w.createdAt, w.updatedAt]
        );
      }

      // C. credit_cards
      for (const c of payload.creditCards) {
        await db.runAsync(
          `INSERT INTO credit_cards (
            id, name, credit_limit, current_balance, cutoff_day, due_day, monthly_rate_pct, is_archived, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            c.id,
            c.name,
            c.creditLimit,
            c.currentBalance,
            c.cutoffDay,
            c.dueDay,
            c.monthlyRatePct,
            c.isArchived ? 1 : 0,
            c.createdAt,
            c.updatedAt,
          ]
        );
      }

      // D. debts
      for (const d of payload.debts) {
        await db.runAsync(
          `INSERT INTO debts (
            id, name, creditor, original_balance, remaining_balance, minimum_monthly_payment,
            estimated_monthly_rate_pct, is_paid, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            d.id,
            d.name,
            d.creditor,
            d.originalBalance,
            d.remainingBalance,
            d.minimumMonthlyPayment,
            d.estimatedMonthlyRatePct,
            d.isPaid ? 1 : 0,
            d.notes ?? null,
            d.createdAt,
            d.updatedAt,
          ]
        );
      }

      // E. transactions
      for (const t of payload.transactions) {
        await db.runAsync(
          `INSERT INTO transactions (
            id, amount, type, pillar, wallet_id, destination_wallet_id, category_id, date, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.id,
            t.amount,
            t.type,
            t.pillar,
            t.walletId,
            t.destinationWalletId ?? null,
            t.categoryId ?? null,
            t.date,
            t.note ?? null,
            t.createdAt,
          ]
        );
      }

      // F. budgets
      for (const b of payload.budgets) {
        await db.runAsync(
          `INSERT INTO budgets (id, category_id, monthly_limit, spent_this_month, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [b.id, b.categoryId, b.monthlyLimit, b.spentThisMonth, b.createdAt, b.updatedAt]
        );
      }

      // G. subscriptions
      for (const sub of payload.subscriptions) {
        await db.runAsync(
          `INSERT INTO subscriptions (
            id, name, amount, frequency, wallet_id, category_id, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            sub.id,
            sub.name,
            sub.amount,
            sub.frequency,
            sub.walletId ?? null,
            sub.categoryId ?? null,
            sub.isActive ? 1 : 0,
            sub.createdAt,
            sub.updatedAt,
          ]
        );
      }

      // H. savings_goals
      for (const g of payload.savingsGoals) {
        await db.runAsync(
          `INSERT INTO savings_goals (
            id, name, target_amount, current_amount, target_date, icon, is_completed, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            g.id,
            g.name,
            g.targetAmount,
            g.currentAmount,
            g.targetDate ?? null,
            g.icon ?? null,
            g.isCompleted ? 1 : 0,
            g.createdAt,
            g.updatedAt,
          ]
        );
      }

      // I. quick_presets (opcional para retrocompatibilidad)
      if (payload.quickPresets && payload.quickPresets.length > 0) {
        for (const q of payload.quickPresets) {
          await db.runAsync(
            `INSERT INTO quick_presets (
              id, name, type, default_amount, pillar, category_id, icon, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              q.id,
              q.name,
              q.type,
              q.defaultAmount ?? 0,
              q.pillar,
              q.categoryId,
              q.icon ?? null,
              q.createdAt || now,
              q.updatedAt || now,
            ]
          );
        }
      }
    });

    return {
      success: true,
      recordsImported: {
        wallets: payload.wallets.length,
        creditCards: payload.creditCards.length,
        debts: payload.debts.length,
        transactions: payload.transactions.length,
        budgets: payload.budgets.length,
        subscriptions: payload.subscriptions.length,
        savingsGoals: payload.savingsGoals.length,
        quickPresets: payload.quickPresets?.length ?? 0,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido al restaurar la base de datos.';
    return {
      success: false,
      error: `Error durante la restauración: ${errorMsg}`,
    };
  }
}

// =========================================================================
// Helpers Nativos Expo Aislados (expo-file-system, expo-sharing, expo-document-picker)
// =========================================================================

/**
 * Guarda el archivo JSON en el caché local del dispositivo y abre el diálogo nativo de compartir de Android.
 */
export async function shareBackupFile(jsonString: string): Promise<boolean> {
  try {
    const FileSystem = require('expo-file-system');
    const Sharing = require('expo-sharing');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `guaca-respaldo-${dateStr}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('La función de compartir no está disponible en este dispositivo.');
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar copia de seguridad de Guaca',
      UTI: 'public.json',
    });

    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    throw new Error(`No se pudo exportar el respaldo: ${msg}`);
  }
}

/**
 * Abre el selector nativo de documentos de Android para que el usuario escoja un archivo JSON previo.
 */
export async function pickAndReadBackupJson(): Promise<string | null> {
  try {
    const DocumentPicker = require('expo-document-picker');
    const FileSystem = require('expo-file-system');

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_BACKUP_SIZE_BYTES) {
      throw new Error('El archivo seleccionado supera el límite máximo permitido de 10 MB.');
    }

    const fileUri = asset.uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return content;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    throw new Error(`No se pudo leer el archivo seleccionado: ${msg}`);
  }
}
