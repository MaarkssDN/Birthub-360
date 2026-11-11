import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEAD_CAPTURE_ENDPOINT,
  LEAD_CONSENT_PURPOSE,
  LEAD_CONSENT_TEXT_VERSION,
  LEAD_SUBMIT_USER_MESSAGES,
  isLeadCaptureEndpointConfigured,
  submitLead,
  submitLeadToEndpoint,
  type LeadCapturePayload,
} from '@/features/landing/services/submitLead';

const validPayload: LeadCapturePayload = {
  nome: 'Mariana Albuquerque',
  email: 'mariana@vanguarda.com.br',
  whatsapp: '11999999999',
  equipe: '6 a 15',
  consent: true,
  consentTextVersion: LEAD_CONSENT_TEXT_VERSION,
  purpose: LEAD_CONSENT_PURPOSE,
  website: '',
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

  function jsonResponse(status: number, body: unknown) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  }

  it('usa a constante única POST /api/public/demo-leads', () => {
    expect(LEAD_CAPTURE_ENDPOINT).toBe('/api/public/demo-leads');
    expect(isLeadCaptureEndpointConfigured()).toBe(true);
    expect(LEAD_CONSENT_TEXT_VERSION).toBe('landing-demo-v1');
    expect(LEAD_CONSENT_PURPOSE).toBe('agendamento_demonstracao');
  });

  it('rejeita endpoint vazio ou placeholder e não chama fetch', async () => {
    await expect(submitLeadToEndpoint('PENDENTE_CONTRATO_AGENTE_01', validPayload)).rejects.toMatchObject({
      code: 'endpoint_unavailable',
    });
    await expect(submitLeadToEndpoint('   ', validPayload)).rejects.toMatchObject({
      code: 'endpoint_unavailable',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolve somente em 202 com ok:true e envia POST JSON com honeypot vazio', async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, { ok: true }));

    const payload: LeadCapturePayload = { ...validPayload, website: '' };
    await expect(submitLead(payload)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/public/demo-leads');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual(payload);
    expect(JSON.parse(String(init.body)).website).toBe('');
  });

  it('omite whatsapp do corpo quando a chave não é enviada', async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, { ok: true }));
    const { whatsapp: _omit, ...withoutWhatsapp } = validPayload;
    await submitLead(withoutWhatsapp);
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body).not.toHaveProperty('whatsapp');
  });

  it('não trata 200/201 ou 202 sem ok:true como sucesso', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await expect(submitLead(validPayload)).rejects.toMatchObject({ code: 'server', status: 200 });

    fetchMock.mockResolvedValueOnce(jsonResponse(201, { ok: true }));
    await expect(submitLead(validPayload)).rejects.toMatchObject({ code: 'server', status: 201 });

    fetchMock.mockResolvedValueOnce(jsonResponse(202, { ok: false }));
    await expect(submitLead(validPayload)).rejects.toMatchObject({ code: 'server', status: 202 });
  });

  it('mapeia 400 invalid_payload com fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        ok: false,
        error: 'invalid_payload',
        fields: { email: 'invalid', consent: 'required' },
      }),
    );

    const error = await submitLead(validPayload).catch((caught) => caught);
    expect(error).toMatchObject({
      name: 'LeadSubmitError',
      code: 'validation',
      status: 400,
      message: LEAD_SUBMIT_USER_MESSAGES.validation,
      fields: { email: 'invalid', consent: 'required' },
    });
  });

  it('mapeia 429 rate_limited com mensagem específica', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { ok: false, error: 'rate_limited' }));

    await expect(submitLead(validPayload)).rejects.toMatchObject({
      code: 'rate_limit',
      status: 429,
      message: LEAD_SUBMIT_USER_MESSAGES.rate_limit,
    });
    expect(LEAD_SUBMIT_USER_MESSAGES.rate_limit).toMatch(/5 envios a cada 15 minutos/i);
  });

  it('mapeia 503 unavailable com mensagem específica', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, { ok: false, error: 'unavailable' }));

    await expect(submitLead(validPayload)).rejects.toMatchObject({
      code: 'unavailable',
      status: 503,
      message: LEAD_SUBMIT_USER_MESSAGES.unavailable,
    });
  });

  it('mapeia falha de rede para erro genérico e não simula sucesso', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(submitLead(validPayload)).rejects.toMatchObject({
      code: 'network',
      message: LEAD_SUBMIT_USER_MESSAGES.network,
    });
  });

  it('propaga AbortError sem mascarar como erro de rede', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abortError);

    await expect(
      submitLead(validPayload, { signal: new AbortController().signal }),
    ).rejects.toBe(abortError);
  });
});
