import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacterExecution } from '@/features/characters/useCharacterExecution';

type SseEvent = { event: string; data: string };

let script: SseEvent[] = [];
let fetchBehavior: (init: RequestInit) => Promise<unknown> = async () => ({ ok: true });

vi.mock('@/lib/sse.js', () => ({
  sseRequestInit: (body: unknown, signal?: AbortSignal) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }),
  readSseStream: vi.fn(async (_res: unknown, cb: (evt: SseEvent) => void) => {
    for (const evt of script) cb(evt);
  }),
}));

const fetchMock = vi.fn((input: unknown, init?: RequestInit) => fetchBehavior(init ?? {}));

beforeEach(() => {
  script = [];
  fetchBehavior = async () => ({ ok: true });
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useCharacterExecution', () => {
  it('ignora missão vazia e não chama fetch', async () => {
    const { result } = renderHook(() => useCharacterExecution('orbit'));
    await act(async () => {
      await result.current.run('   ');
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.exec.running).toBe(false);
  });

  it('executa missão completa: queued → routing → result → end', async () => {
    script = [
      { event: 'queued', data: JSON.stringify({ position: 2 }) },
      { event: 'queued', data: 'frame-malformado' },
      {
        event: 'message',
        data: JSON.stringify({ type: 'routing', agent: 'supervisor', nextAgent: 'closer', reasoning: 'lead quente' }),
      },
      {
        event: 'message',
        data: JSON.stringify({ type: 'agent_result', agent: 'closer', content: 'Proposta enviada', reasoning: 'ok' }),
      },
      { event: 'message', data: 'nao-e-json' },
      { event: 'message', data: JSON.stringify({ type: 'final', content: 'Missão cumprida' }) },
      { event: 'end', data: '' },
    ];
    const { result } = renderHook(() => useCharacterExecution('seller-01'));
    await act(async () => {
      await result.current.run('Feche o lead X');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sessionId).toBeTruthy();
    expect(body.characterId).toBe('seller-01');
    expect(body.mission).toContain('[Personagem: seller-01] Feche o lead X');

    expect(result.current.exec.running).toBe(false);
    expect(result.current.exec.operationalState).toBe('completed');
    expect(result.current.exec.visualState).toBe('success');
    expect(result.current.exec.activeAgent).toBe('closer');
    expect(result.current.exec.output).toContain('Proposta enviada');
    expect(result.current.exec.output).toContain('Missão cumprida');
    expect(result.current.exec.events.some((e) => e.detail?.includes('posição 2'))).toBe(true);
    expect(result.current.exec.events.some((e) => e.kind === 'routing')).toBe(true);
  });

  it('trata evento error com payload JSON e texto puro', async () => {
    script = [
      { event: 'error', data: JSON.stringify({ message: 'quota excedida' }) },
    ];
    const { result } = renderHook(() => useCharacterExecution('c1'));
    await act(async () => {
      await result.current.run('missão');
    });
    expect(result.current.exec.error).toBe('quota excedida');
    expect(result.current.exec.operationalState).toBe('error');
    expect(result.current.exec.visualState).toBe('error');
  });

  it('trata agent_error dentro do stream', async () => {
    script = [
      { event: 'message', data: JSON.stringify({ type: 'agent_error', agent: 'hunter', content: 'sem budget' }) },
      { event: 'end', data: '' },
    ];
    const { result } = renderHook(() => useCharacterExecution('c1'));
    await act(async () => {
      await result.current.run('missão');
    });
    expect(result.current.exec.error).toBe('sem budget');
  });

  it('marca concluído quando o stream encerra sem end/error', async () => {
    script = [];
    const { result } = renderHook(() => useCharacterExecution('c1'));
    await act(async () => {
      await result.current.run('missão');
    });
    expect(result.current.exec.operationalState).toBe('completed');
    expect(result.current.exec.events.some((e) => e.label === 'Stream encerrado')).toBe(true);
  });

  it('captura falha de conexão no catch genérico', async () => {
    fetchBehavior = async () => {
      throw new Error('network down');
    };
    const { result } = renderHook(() => useCharacterExecution('c1'));
    await act(async () => {
      await result.current.run('missão');
    });
    expect(result.current.exec.error).toBe('network down');
    expect(result.current.exec.operationalState).toBe('error');
    expect(result.current.exec.running).toBe(false);
  });

  it('cancel() aborta e marca execução cancelada', async () => {
    fetchBehavior = (init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    const { result } = renderHook(() => useCharacterExecution('c1'));
    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.run('missão');
    });
    await waitFor(() => expect(result.current.exec.running).toBe(true));
    act(() => result.current.cancel());
    await act(async () => {
      await pending;
    });
    expect(result.current.exec.error).toBe('Execução cancelada pelo usuário.');
    expect(result.current.exec.running).toBe(false);
  });

  it('reset() volta ao estado inicial e aborta execução em curso', async () => {
    fetchBehavior = (init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    const { result } = renderHook(() => useCharacterExecution('c1'));
    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = result.current.run('missão');
    });
    await waitFor(() => expect(result.current.exec.running).toBe(true));
    act(() => result.current.reset());
    await act(async () => {
      await pending;
    });
    expect(result.current.exec.running).toBe(false);
    expect(result.current.exec.executionId).toBeNull();
  });
});
