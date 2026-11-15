// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState: { currentUser: { role: string } | null } = { currentUser: { role: 'ADMIN' } };

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => authState,
}));
vi.mock('../../../../src/lib/soundEffects.js', () => ({ SoundFX: { play: vi.fn() } }));
vi.mock('../../../../src/lib/toast.js', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('../../../../src/components/brand/CompanyBrandIcon.js', () => ({
  CompanyBrandIcon: () => null,
}));

import { toast } from '../../../../src/lib/toast.js';
import { ExternalCrmPanel } from '../../../../src/features/integrations/components/ExternalCrmPanel.js';
import { toast } from '../../../../src/lib/toast.js';

type Reply = { ok?: boolean; status?: number; body?: unknown } | Error;

function jsonResponse(r: Exclude<Reply, Error>) {
  return {
    ok: r.ok ?? true,
    status: r.status ?? 200,
    json: async () => r.body ?? {},
  };
}

/** Roteia fetch por "MÉTODO url" para respostas enfileiradas (a última se repete). */
function mockFetch(routes: Record<string, Reply[]>) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const queue = routes[key];
    if (!queue) throw new Error(`rota não mockada: ${key}`);
    const reply = queue.length > 1 ? queue.shift()! : queue[0];
    if (reply instanceof Error) throw reply;
    return jsonResponse(reply);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const conn = {
  id: 'c1',
  provider: 'hubspot',
  label: 'HubSpot Comercial',
  inboundEventsEnabled: true,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const LIST_HUBSPOT = 'GET /api/integrations/external-crm?provider=hubspot';

beforeEach(() => {
  authState.currentUser = { role: 'ADMIN' };
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ExternalCrmPanel', () => {
  it('mostra estado vazio quando não há conexões e abre/fecha o modal', async () => {
    mockFetch({ [LIST_HUBSPOT]: [{ body: [] }] });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);

    expect(await screen.findByText('Nenhum portal HubSpot conectado')).toBeTruthy();
    expect(screen.getByText('Desconectado')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Conectar HubSpot/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect((screen.getByLabelText('Nome de Identificação (opcional)') as HTMLInputElement).value).toBe(
      'HubSpot Principal',
    );

    // alterna visualização do token
    const token = document.getElementById('modal-crm-token') as HTMLInputElement;
    expect(token.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: /Ver/ }));
    expect(token.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Ocultar/ }));

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Conectar HubSpot/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar janela' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancela o carregamento ao desmontar sem exibir erro nem toast', async () => {
    let capturedSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        capturedSignal = init?.signal;
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const { unmount } = render(
      <ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />,
    );

    await waitFor(() => expect(capturedSignal).toBeDefined());
    unmount();

    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
    // AbortError é cancelamento cooperativo, não falha: não pode virar erro de UI.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('exibe erro de carregamento e permite fechar o alerta', async () => {
    mockFetch({ [LIST_HUBSPOT]: [{ ok: false, status: 500 }] });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('status 500');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar alerta de erro' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('desabilita ações para quem não é ADMIN/GESTOR', async () => {
    authState.currentUser = { role: 'SDR' };
    mockFetch({ [LIST_HUBSPOT]: [{ body: [conn] }] });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);

    expect(await screen.findByText('HubSpot Comercial')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Nova Conexão/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByRole('button', { name: 'Desconectar HubSpot Comercial' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('valida o formulário antes de testar e de salvar', async () => {
    mockFetch({ [LIST_HUBSPOT]: [{ body: [] }] });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar HubSpot/ }));

    fireEvent.click(screen.getByRole('button', { name: /Testar Conexão/ }));
    expect(screen.getByText('O token de autenticação é obrigatório.')).toBeTruthy();

    const token = document.getElementById('modal-crm-token') as HTMLInputElement;
    fireEvent.change(token, { target: { value: 'abc' } });
    fireEvent.submit(token.closest('form') as HTMLFormElement);
    expect(screen.getByText('O token informado é muito curto para ser válido.')).toBeTruthy();
  });

  it('testa as credenciais antes de salvar (sucesso e falha)', async () => {
    const fetchMock = mockFetch({
      [LIST_HUBSPOT]: [{ body: [] }],
      'POST /api/integrations/hubspot/ping': [
        { body: { valid: true, message: 'Token válido' } },
        { ok: false, status: 401, body: { valid: false, error: 'Token rejeitado' } },
        new Error('rede caiu'),
      ],
    });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar HubSpot/ }));
    fireEvent.change(document.getElementById('modal-crm-token') as HTMLInputElement, {
      target: { value: 'token-valido-123' },
    });

    const testBtn = () => screen.getByRole('button', { name: /Testar Conexão/ });
    fireEvent.click(testBtn());
    expect(await screen.findByText('Token válido')).toBeTruthy();
    fireEvent.click(testBtn());
    expect(await screen.findByText('Token rejeitado')).toBeTruthy();
    fireEvent.click(testBtn());
    expect(await screen.findByText('rede caiu')).toBeTruthy();

    const pingCall = fetchMock.mock.calls.find(([u]) => u === '/api/integrations/hubspot/ping');
    expect(JSON.parse(String(pingCall?.[1]?.body)).token).toBe('token-valido-123');
  });

  it('salva nova conexão (oauth2) e recarrega a lista', async () => {
    const fetchMock = mockFetch({
      [LIST_HUBSPOT]: [{ body: [] }, { body: [conn] }],
      'POST /api/integrations/external-crm': [{ body: { id: 'c1' } }],
    });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar HubSpot/ }));

    fireEvent.change(screen.getByLabelText('Nome de Identificação (opcional)'), {
      target: { value: 'HubSpot Comercial' },
    });
    const token = document.getElementById('modal-crm-token') as HTMLInputElement;
    fireEvent.change(token, { target: { value: 'token-valido-123' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Salvar Conexão/ }));

    expect(await screen.findByText('HubSpot Comercial')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('Conectado')).toBeTruthy();

    const saveCall = fetchMock.mock.calls.find(
      ([u, i]) => u === '/api/integrations/external-crm' && i?.method === 'POST',
    );
    const body = JSON.parse(String(saveCall?.[1]?.body));
    expect(body).toMatchObject({
      provider: 'hubspot',
      label: 'HubSpot Comercial',
      inboundEventsEnabled: true,
      config: { accessToken: 'token-valido-123' },
    });
  });

  it('mostra erro quando o salvamento falha', async () => {
    mockFetch({
      [LIST_HUBSPOT]: [{ body: [] }],
      'POST /api/integrations/external-crm': [{ ok: false, status: 400, body: { error: 'Inválido' } }],
    });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar HubSpot/ }));
    fireEvent.change(document.getElementById('modal-crm-token') as HTMLInputElement, {
      target: { value: 'token-valido-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Conexão/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('Inválido');
  });

  it('Monday exige Board ID e envia apiKey + boardId', async () => {
    const fetchMock = mockFetch({
      'GET /api/integrations/external-crm?provider=monday': [{ body: [] }],
      'POST /api/integrations/external-crm': [{ body: {} }],
    });
    render(<ExternalCrmPanel providerKey="monday" displayName="Monday" authType="api_key" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar Monday/ }));
    const token = document.getElementById('modal-crm-token') as HTMLInputElement;
    fireEvent.change(token, { target: { value: 'chave-monday-123' } });
    fireEvent.submit(token.closest('form') as HTMLFormElement);
    expect(
      screen.getByText('O ID do Quadro (Board ID) é obrigatório para o Monday.com.'),
    ).toBeTruthy();

    fireEvent.change(document.getElementById('modal-crm-board') as HTMLInputElement, {
      target: { value: '987654' },
    });
    fireEvent.submit(token.closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const saveCall = fetchMock.mock.calls.find(([, i]) => i?.method === 'POST');
    expect(JSON.parse(String(saveCall?.[1]?.body)).config).toEqual({
      apiKey: 'chave-monday-123',
      boardId: '987654',
    });
  });

  it('Pipedrive valida o formato do domínio', async () => {
    mockFetch({ 'GET /api/integrations/external-crm?provider=pipedrive': [{ body: [] }] });
    render(<ExternalCrmPanel providerKey="pipedrive" displayName="Pipedrive" authType="api_key" />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar Pipedrive/ }));
    const token = document.getElementById('modal-crm-token') as HTMLInputElement;
    fireEvent.change(token, { target: { value: 'chave-pipe-123' } });
    const domain = document.getElementById('modal-crm-domain') as HTMLInputElement;
    fireEvent.change(domain, { target: { value: 'semponto' } });
    fireEvent.submit(token.closest('form') as HTMLFormElement);
    expect(
      screen.getByText('Formato recomendado: suaempresa.pipedrive.com ou subdomínio.'),
    ).toBeTruthy();
    fireEvent.change(domain, { target: { value: 'empresa.pipedrive.com' } });
    expect(screen.queryByText('Formato recomendado: suaempresa.pipedrive.com ou subdomínio.')).toBeNull();
  });

  it('testa, sincroniza e remove uma conexão existente', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    mockFetch({
      [LIST_HUBSPOT]: [{ body: [conn] }],
      'POST /api/integrations/external-crm/c1/test': [
        { body: { success: true, message: 'Credenciais OK' } },
        { ok: false, status: 401, body: { success: false, error: 'Sem permissão' } },
        new Error('falha'),
      ],
      'POST /api/integrations/external-crm/c1/sync': [
        { body: { success: true, importedCount: 7 } },
        { body: { success: false, error: 'Limite excedido' } },
        new Error('falha'),
      ],
      'DELETE /api/integrations/external-crm/c1': [{ ok: false, status: 500 }, { body: {} }],
    });
    render(<ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />);
    expect(await screen.findByText('HubSpot Comercial')).toBeTruthy();

    const testBtn = () => screen.getByRole('button', { name: /Testar Conexão/ });
    fireEvent.click(testBtn());
    expect(await screen.findByText('Credenciais OK')).toBeTruthy();
    fireEvent.click(testBtn());
    expect(await screen.findByText('Sem permissão')).toBeTruthy();
    fireEvent.click(testBtn());
    expect(
      await screen.findByText('Erro de comunicação ao validar credenciais do CRM.'),
    ).toBeTruthy();

    const syncBtn = () => screen.getByRole('button', { name: /Sincronizar/ });
    fireEvent.click(syncBtn());
    expect(await screen.findByText('7 registro(s) sincronizado(s) com HubSpot!')).toBeTruthy();
    await waitFor(() => expect(syncBtn().hasAttribute('disabled')).toBe(false));
    fireEvent.click(syncBtn());
    expect(await screen.findByText('Limite excedido')).toBeTruthy();
    fireEvent.click(syncBtn());
    expect(await screen.findByText('Falha ao processar sincronização de leads.')).toBeTruthy();

    const delBtn = () => screen.getByRole('button', { name: 'Desconectar HubSpot Comercial' });
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(delBtn());
    expect(screen.getByText('HubSpot Comercial')).toBeTruthy();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(delBtn());
    expect((await screen.findByRole('alert')).textContent).toContain('Falha ao desconectar CRM.');
    fireEvent.click(delBtn());
    await waitFor(() => expect(screen.queryByText('HubSpot Comercial')).toBeNull());
    expect(screen.getByText('Nenhum portal HubSpot conectado')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar status de HubSpot' }));
  });

  it('aborta a listagem via AbortController ao desmontar, sem erro/ toast (S9383)', async () => {
    let seenSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      seenSignal = init?.signal as AbortSignal | undefined;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        );
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(
      <ExternalCrmPanel providerKey="hubspot" displayName="HubSpot" authType="oauth2" />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(seenSignal).toBeInstanceOf(AbortSignal);
    expect(seenSignal?.aborted).toBe(false);

    unmount();
    expect(seenSignal?.aborted).toBe(true);

    // A rejeição por AbortError não pode virar erro de UI nem toast.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
