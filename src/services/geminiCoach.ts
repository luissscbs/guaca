/**
 * Guaca v2: Private Gemini AI Coach Service ("Parce Coach")
 * Cliente privado y seguro para consultas inteligentes usando Gemini 2.0 Flash gratuito.
 *
 * Principios de Seguridad y Privacidad Bancaria:
 * 1. Privacidad Radical: Cero información personal identificable (PII), nombres de personas,
 *    correos o nombres de entidades bancarias son transmitidos. Únicamente cifras agregadas en COP.
 * 2. Llave Segura: La API key se envía exclusivamente en el header HTTP 'x-goog-api-key' (nunca en URL query params).
 * 3. Fallback Determinístico Local: Si no hay llave configurada o hay error de red/HTTP/timeout,
 *    se activa automáticamente el "Detective Local de tu Plata" con cero fricción para el usuario.
 */

import { formatCOP } from '../utils/formatters';
import {
  SpendingDetectiveInsight,
  UserProfileType,
} from '../domain/types';

export interface AskParceCoachInput {
  apiKey?: string;
  profileType: UserProfileType;
  vitalMinimum: number;
  monthlyIncome: number;
  guiltFreeAvailable: number;
  emergencyFundBalance: number;
  emergencyMonths: number;
  topCategories: Array<{ name: string; total: number }>;
  activeLeaksTotal: number;
  totalDebt: number;
  detectiveInsights: SpendingDetectiveInsight[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface ParceCoachAIResult {
  source: 'gemini' | 'local-detective';
  message: string;
  tips: string[];
  errorReason?: string;
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const PROFILE_DESCRIPTIONS: Record<UserProfileType, string> = {
  salary: 'Empleado con sueldo fijo quincenal/mensual',
  student: 'Estudiante con mesada o apoyo familiar',
  variable: 'Independiente o freelance con ingresos variables',
};

/**
 * Genera el resultado de respaldo 100% local a partir del Detective de tu Plata.
 */
function buildLocalDetectiveFallback(
  input: AskParceCoachInput,
  errorReason?: string
): ParceCoachAIResult {
  const tips: string[] = [];

  if (input.detectiveInsights && input.detectiveInsights.length > 0) {
    for (const insight of input.detectiveInsights) {
      tips.push(insight.nequiMessage);
    }
  } else {
    if (input.vitalMinimum > 0) {
      tips.push(
        `Lo sagrado primero: tu Mínimo Vital es de ${formatCOP(input.vitalMinimum)}. Blindemos siempre techo y comida.`
      );
    }
    if (input.guiltFreeAvailable > 0) {
      tips.push(
        `Tienes ${formatCOP(input.guiltFreeAvailable)} libres este mes para disfrutar sin culpa.`
      );
    }
    if (input.emergencyMonths < 1.0) {
      tips.push(
        'Tu primera gran meta de oro: reunir 1 mes de Mínimo Vital para Tu Guaca (tu colchón de tranquilidad).'
      );
    }
  }

  const message =
    '¡Ey parce! Aquí tienes el diagnóstico inteligente de tu plata para cuidar Tu Guaca y vivir tranquilo sin culpa este mes.';

  return {
    source: 'local-detective',
    message,
    tips: tips.slice(0, 3),
    errorReason,
  };
}

/**
 * Extrae viñetas o consejos de la respuesta de texto de Gemini.
 */
function extractTips(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  const bulletTips: string[] = [];

  for (const line of lines) {
    if (
      line.startsWith('*') ||
      line.startsWith('-') ||
      line.startsWith('•') ||
      /^\d+[\.\)]/.test(line)
    ) {
      const cleaned = line.replace(/^[\*\-•\d\.\)\s]+/, '').trim();
      if (cleaned.length > 5) {
        bulletTips.push(cleaned);
      }
    }
  }

  if (bulletTips.length > 0) {
    return bulletTips.slice(0, 3);
  }

  // Fallback: párrafos no vacíos
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  return paragraphs.slice(0, 3);
}

/**
 * Construye el prompt anónimo agregando solo métricas de alto nivel en COP.
 */
function buildAggregatedPrompt(input: AskParceCoachInput): string {
  const profileDesc = PROFILE_DESCRIPTIONS[input.profileType] || 'Usuario de Guaca';

  const categoryBreakdown = input.topCategories.length > 0
    ? input.topCategories.map((c) => `- ${c.name}: ${formatCOP(c.total)}`).join('\n')
    : '- Sin gastos clasificados aún';

  return `
Perfil de usuario: ${profileDesc} (${input.profileType}).
Situación financiera del mes en Pesos Colombianos (COP):
- Ingreso neto mensual: ${formatCOP(input.monthlyIncome)}
- Mínimo Vital sagrado (techo, comida, servicios, transporte): ${formatCOP(input.vitalMinimum)}
- Saldo libre sin culpa para ocio/discrecional: ${formatCOP(input.guiltFreeAvailable)}
- Saldo acumulado en Tu Guaca (fondo de tranquilidad): ${formatCOP(input.emergencyFundBalance)} (${input.emergencyMonths} meses cubiertos)
- Deuda total activa: ${formatCOP(input.totalDebt)}
- Fugas silenciosas anuales estimadas: ${formatCOP(input.activeLeaksTotal)}

Principales gastos por categoría del mes:
${categoryBreakdown}

Dame un mensaje breve de ánimo y exactamente 3 consejos accionables, concretos y sin culpa, adaptados a mi perfil (${input.profileType}), para que la plata me rinda y haga crecer Tu Guaca.
`.trim();
}

/**
 * Consulta a Parce Coach AI usando Gemini 2.0 Flash o hace fallback limpio al Detective Local.
 */
export async function askParceCoachAI(
  input: AskParceCoachInput
): Promise<ParceCoachAIResult> {
  const trimmedKey = input.apiKey?.trim();

  // 1. Si no hay API Key configurada, fallback inmediato a Detective Local
  if (!trimmedKey) {
    return buildLocalDetectiveFallback(input);
  }

  const fetchFn = input.fetchImpl || fetch;
  const timeoutMs = input.timeoutMs || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const promptText = buildAggregatedPrompt(input);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text:
            'Eres Parce Coach, el coach financiero de confianza en la app colombiana Guaca. ' +
            'Hablas de tú a tú con calidez y cercanía colombiana auténtica (tono Nequi clásico: "tu celu, tu plata, Tu Guaca") y filosofía de Pablo Financiero. ' +
            'Cero tecnicismos bancarios aburridos, cero regaños ni culpa. Siempre enfocado en soluciones prácticas. ' +
            'Responde con un mensaje introductorio empático y exactamente 3 consejos accionables en viñetas (*), cada uno con cifras o acciones concretas.',
        },
      ],
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  };

  try {
    const response = await fetchFn(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': trimmedKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return buildLocalDetectiveFallback(
        input,
        `Gemini API error (Status ${response.status})`
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText || candidateText.trim().length === 0) {
      return buildLocalDetectiveFallback(
        input,
        'Respuesta vacía o sin formato esperado de Gemini'
      );
    }

    const tips = extractTips(candidateText);

    return {
      source: 'gemini',
      message: candidateText.trim(),
      tips,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    let errMsg = err instanceof Error ? err.message : 'Error desconocido al conectar con Gemini';
    // Sanitizar cualquier fuga de la API Key en el mensaje de error
    if (trimmedKey) {
      errMsg = errMsg.split(trimmedKey).join('[REDACTED_API_KEY]');
    }
    return buildLocalDetectiveFallback(input, errMsg);
  }
}
