import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'usr-1', role: 'ADMIN', organizationId: 'org-test' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
  }),
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

const readSseStream = vi.fn();
const sseRequestInit = vi.fn((body: unknown, signal?: AbortSignal) => ({
  method: 'POST',
  body: JSON.stringify(body),
  signal,
}));

vi.mock('../../../../src/lib/sse.js', () => ({
  readSseStream: (...args: unknown[]) => readSseStream(...args),
  sseRequestInit: (...args: unknown[]) => sseRequestInit(...(args as [unknown, AbortSignal?])),
}));

import { ModuleAgentWidget } from '../../../../src/components/ui/ModuleAgentWidget.js';

function openWidget() {
  render(<ModuleAgentWidget activeTab="crm" />);
  fireEvent.click(screen.getByRole('button', { name: /Abrir copiloto Orbit/i }));
  return screen.getByRole('textbox', { name: /Mensagem ou instrução para o copiloto Orbit/i });
}

describe('ModuleAgentWidget — streaming SSE', () => {
  beforeEach(() => {
    readSseStream.mockReset();
    sseRequestInit.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, body: {} }),
    );
  });

  it('envia o prompt, processa routing/result/final e ignora JSON inválido', async () => {
    readSseStream.mockImplementation(async (_res: unknown, cb: (evt: { data: string }) => void) => {
      cb({ data: '' });
      cb({ data: JSON.stringify({ type: 'routing', nextAgent: 'sdr' }) });
      cb({
        data: JSON.stringify({
          type: 'agent_result',
          content: 'Primeira análise',
          reasoning: 'Lead com fit alto',
        }),
      });
      cb({ data: JSON.stringify({ type: 'final', content: 'Missão concluída' }) });
      cb({ data: 'texto-cru-nao-json' });
    });

    const input = openWidget();
    fireEvent.change(input, { target: { value: 'Qual o próximo passo?' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar comando para o copiloto/i }));

    expect(await screen.findByText(/Primeira análise/)).toBeInTheDocument();
    expect(screen.getByText(/Missão concluída/)).toBeInTheDocument();
    expect(screen.getByText(/texto-cru-nao-json/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/agent/swarm/stream', expect.anything());
  });

  it('envia com Enter e rejeita prompt vazio', async () => {
    readSseStream.mockResolvedValue(undefined);
    const input = openWidget();
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /Enviar comando para o copiloto/i })).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Auditar o funil' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it('mostra erro de agente e permite tentar de novo', async () => {
    readSseStream
      .mockImplementationOnce(async (_res: unknown, cb: (evt: { data: string }) => void) => {
        cb({ data: JSON.stringify({ type: 'agent_error', content: 'Agente saturado' }) });
      })
      .mockImplementationOnce(async (_res: unknown, cb: (evt: { data: string }) => void) => {
        cb({ data: JSON.stringify({ type: 'final', content: 'Recuperado' }) });
      });

    const input = openWidget();
    fireEvent.change(input, { target: { value: 'Tenta de novo' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar comando para o copiloto/i }));

    expect(await screen.findByText('Agente saturado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Recuperado')).toBeInTheDocument();
  });

  it('cancela o stream e registra AbortError como cancelamento do operador', async () => {
    let abortSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: { signal?: AbortSignal }) => {
        abortSignal = init.signal;
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }),
    );

    const input = openWidget();
    fireEvent.change(input, { target: { value: 'Missão longa' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar comando para o copiloto/i }));

    const cancel = await screen.findByRole('button', { name: 'Cancelar comando do copiloto' });
    expect(abortSignal).toBeDefined();
    fireEvent.click(cancel);
    expect(await screen.findByText(/Processamento cancelado pelo operador/i)).toBeInTheDocument();
  });

  it('mostra falha de conexão genérica e fecha com Escape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('rede indisponível')),
    );
    const input = openWidget();
    fireEvent.change(input, { target: { value: 'Ping' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar comando para o copiloto/i }));
    expect(await screen.findByText('rede indisponível')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: /Mensagem ou instrução/i })).toBeNull(),
    );
  });
});
