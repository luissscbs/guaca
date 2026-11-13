/**
 * Pruebas unitarias para el cliente privado de IA Gratuita (Gemini Coach).
 * TDD estricto: llamadas a Gemini Flash mockeadas, header x-goog-api-key,
 * fallback determinístico local cuando no hay API key o hay error de red,
 * y garantía de privacidad bancaria (cero PII enviada a Google).
 */

import {
  askParceCoachAI,
  AskParceCoachInput,
  ParceCoachAIResult,
} from '../geminiCoach';
import { SpendingDetectiveInsight } from '../../domain/types';

describe('Gemini Coach Service (TDD)', () => {
  const mockDetectiveInsights: SpendingDetectiveInsight[] = [
    {
      id: 'cat_restaurantes',
      sourceType: 'category',
      categoryOrLeakName: 'Restaurantes',
      monthlySpend: 250000,
      suggestedCutAmount: 87500,
      annualSavings: 1050000,
      daysOfGuacaGained: 21,
      debtMonthsSaved: 2,
      nequiMessage: 'Pillamos que en Restaurantes van $ 250.000 este mes.',
    },
  ];

  const baseInput: AskParceCoachInput = {
    profileType: 'salary',
    vitalMinimum: 1500000,
    monthlyIncome: 3500000,
    guiltFreeAvailable: 500000,
    emergencyFundBalance: 1000000,
    emergencyMonths: 0.6,
    topCategories: [
      { name: 'Restaurantes', total: 250000 },
      { name: 'Ropa', total: 100000 },
    ],
    activeLeaksTotal: 50000,
    totalDebt: 800000,
    detectiveInsights: mockDetectiveInsights,
  };

  it('hace fallback inmediato a "local-detective" si no se suministra apiKey', async () => {
    const mockFetch = jest.fn();
    const result: ParceCoachAIResult = await askParceCoachAI({
      ...baseInput,
      apiKey: undefined,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.source).toBe('local-detective');
    expect(result.message).toMatch(/Tu Guaca|parce|plata/i);
    expect(result.tips.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('hace fallback inmediato si la apiKey es una cadena vacía o solo espacios', async () => {
    const mockFetch = jest.fn();
    const result = await askParceCoachAI({
      ...baseInput,
      apiKey: '   ',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.source).toBe('local-detective');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('llama a Gemini con la API Key en el header x-goog-api-key (NUNCA en la URL)', async () => {
    const mockResponseBody = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '¡Ey parcero! Tienes Tu Guaca en camino.\n\n* Baja un 30% a restaurantes.\n* Guarda $ 50.000 extra este fin de semana.\n* Revisa tus fugas de streaming.',
              },
            ],
          },
        },
      ],
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponseBody,
    });

    const result = await askParceCoachAI({
      ...baseInput,
      apiKey: 'AIzaSySecretApiKey123',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = mockFetch.mock.calls[0];

    // Verificar URL sin query param de API key
    expect(callUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    );
    expect(callUrl).not.toContain('AIzaSySecretApiKey123');
    expect(callUrl).not.toContain('key=');

    // Verificar header seguro
    expect(callOptions.headers['x-goog-api-key']).toBe('AIzaSySecretApiKey123');
    expect(callOptions.headers['Content-Type']).toBe('application/json');

    // Verificar resultado
    expect(result.source).toBe('gemini');
    expect(result.message).toContain('¡Ey parcero!');
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it('garantiza privacidad total: no envía nombres propios ni información sensible', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Consejo sin datos privados.' }],
            },
          },
        ],
      }),
    });

    await askParceCoachAI({
      ...baseInput,
      apiKey: 'AIzaSySecretApiKey123',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const [, callOptions] = mockFetch.mock.calls[0];
    const bodyStr = callOptions.body as string;

    // Solo debe haber cifras y nombres agregados de categorías
    expect(bodyStr).not.toContain('Bancolombia');
    expect(bodyStr).not.toContain('Davivienda');
    expect(bodyStr).not.toContain('@');
    expect(bodyStr).toContain('Restaurantes');
  });

  it('hace fallback seguro a "local-detective" si la API de Gemini devuelve error HTTP 400/403/500', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'API key not valid',
    });

    const result = await askParceCoachAI({
      ...baseInput,
      apiKey: 'invalid-key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.source).toBe('local-detective');
    expect(result.errorReason).toBeDefined();
    // NUNCA revelar la clave en el error
    expect(result.errorReason).not.toContain('invalid-key');
    expect(result.message).toMatch(/Tu Guaca|tranqui/i);
  });

  it('hace fallback seguro si ocurre un fallo de red o timeout', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const result = await askParceCoachAI({
      ...baseInput,
      apiKey: 'test-key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.source).toBe('local-detective');
    expect(result.errorReason).toContain('Network request failed');
    expect(result.message).toBeDefined();
  });

  it('hace fallback si la respuesta JSON de Gemini no contiene candidatos válidos', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
    });

    const result = await askParceCoachAI({
      ...baseInput,
      apiKey: 'test-key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.source).toBe('local-detective');
    expect(result.message).toBeDefined();
  });
});
