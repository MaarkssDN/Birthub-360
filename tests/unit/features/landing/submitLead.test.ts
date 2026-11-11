import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEAD_CAPTURE_ENDPOINT,
  LEAD_CAPTURE_ENDPOINT_PLACEHOLDER,
  LEAD_SUBMIT_USER_MESSAGES,
  isLeadCaptureEndpointConfigured,
  submitLead,
  submitLeadToEndpoint,
} from '@/features/landing/services/submitLead';

const validPayload = {
  nome: 'Mariana Albuquerque',
  email: 'mariana@vanguarda.com.br',
  whatsapp: '11999999999',
  equipe: '6 a 15',
  consent: true,
  consentMetadata: {
    textVersion: 'landing-demo-v1',
    purpose: 'agendamento da demonstração',
    timestamp: '2026-11-11T05:39:00.000Z',
  },
};

describe('submitLead', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejeita com endpoint indisponível quando a constante é o placeholder e não chama fetch', async () => {
    expect(LEAD_CAPTURE_ENDPOINT).toBe(LEAD_CAPTURE_ENDPOINT_PLACEHOLDER);
    expect(isLeadCaptureEndpointConfigured()).toBe(false);

    await expect(submitLead(validPayload)).rejects.toMatchObject({
      name: 'LeadSubmitError',
      code: 'endpoint_unavailable',
      message: LEAD_SUBMIT_USER_MESSAGES.endpoint_unavailable,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejeita com endpoint indisponível para string vazia ou só espaços', async () => {
    await expect(submitLeadToEndpoint('   ', validPayload)).rejects.toMatchObject({
      code: 'endpoint_unavailable',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolve somente em resposta 2xx e envia POST JSON com o payload', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201 });

    await expect(submitLeadToEndpoint('/api/leads', validPayload)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/leads');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual(validPayload);
  });

  it('mapeia 4xx para erro de validação com mensagem genérica segura', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: 'segredo' }) });

    await expect(submitLeadToEndpoint('/api/leads', validPayload)).rejects.toMatchObject({
      name: 'LeadSubmitError',
      code: 'validation',
      status: 422,
      message: LEAD_SUBMIT_USER_MESSAGES.validation,
    });
  });

  it('mapeia 429 para erro de limite de tentativas', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });

    await expect(submitLeadToEndpoint('/api/leads', validPayload)).rejects.toMatchObject({
      code: 'rate_limit',
      status: 429,
      message: LEAD_SUBMIT_USER_MESSAGES.rate_limit,
    });
  });

  it('mapeia 5xx para erro de servidor', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    await expect(submitLeadToEndpoint('/api/leads', validPayload)).rejects.toMatchObject({
      code: 'server',
      status: 503,
      message: LEAD_SUBMIT_USER_MESSAGES.server,
    });
  });

  it('mapeia falha de rede para erro de rede e não simula sucesso', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(submitLeadToEndpoint('/api/leads', validPayload)).rejects.toMatchObject({
      code: 'network',
      message: LEAD_SUBMIT_USER_MESSAGES.network,
    });
  });

  it('propaga AbortError sem mascarar como erro de rede', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abortError);

    await expect(submitLeadToEndpoint('/api/leads', validPayload, { signal: new AbortController().signal })).rejects.toBe(
      abortError,
    );
  });
});
