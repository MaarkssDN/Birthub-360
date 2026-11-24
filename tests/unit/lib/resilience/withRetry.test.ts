import { describe, expect, it, vi } from 'vitest';
import { withRetry } from '../../../../src/lib/resilience/withRetry.js';
import { DEFAULT_BACKOFF } from '../../../../src/lib/queue/outbox/backoff.js';

function recordingSleep() {
  const delays: number[] = [];
  const sleep = vi.fn(async (ms: number) => {
    delays.push(ms);
  });
  return { sleep, delays };
}

describe('withRetry (Agente 24 — Ivo)', () => {
  it('retorna o valor na primeira tentativa sem dormir', async () => {
    const { sleep } = recordingSleep();
    const fn = vi.fn(async () => 'ok');

    await expect(withRetry(fn, { sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retenta falha transitória com backoff exponencial + jitter injetado', async () => {
    const { sleep, delays } = recordingSleep();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue('done');

    // random=0.5 → delay = floor(0.5 * cap); cap attempt1 = baseMs(1000), attempt2 = 2000
    const result = await withRetry(fn, {
      sleep,
      random: () => 0.5,
      backoff: { baseMs: 1000, maxMs: 60_000, maxAttempts: 8 },
    });

    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([500, 1000]); // jitter determinístico: 0.5 * cap
  });

  it('respeita o teto maxMs do backoff', async () => {
    const { sleep, delays } = recordingSleep();
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 4) throw new Error('flaky');
      return 'ok';
    });

    await withRetry(fn, {
      sleep,
      maxAttempts: 4,
      random: () => 1, // jitter máximo
      backoff: { baseMs: 1000, maxMs: 1500, maxAttempts: 8 },
    });

    // caps: min(1500, 1000*2^0)=1000, min(1500,2000)=1500, min(1500,4000)=1500
    expect(delays).toEqual([1000, 1500, 1500]);
  });

  it('propaga o último erro e chama onExhausted quando esgota maxAttempts', async () => {
    const { sleep } = recordingSleep();
    const fn = vi.fn(async () => {
      throw new Error('permanent-ish');
    });
    const onExhausted = vi.fn();

    await expect(
      withRetry(fn, { sleep, maxAttempts: 3, random: () => 0, onExhausted }),
    ).rejects.toThrow('permanent-ish');

    expect(fn).toHaveBeenCalledTimes(3);
    expect(onExhausted).toHaveBeenCalledOnce();
    expect(onExhausted).toHaveBeenCalledWith(expect.any(Error), 3);
  });

  it('shouldRetry=false interrompe na hora (falha permanente, sem backoff)', async () => {
    const { sleep } = recordingSleep();
    const fn = vi.fn(async () => {
      throw new Error('400 Bad Request');
    });

    await expect(
      withRetry(fn, {
        sleep,
        maxAttempts: 5,
        shouldRetry: (err) => !(err instanceof Error && err.message.includes('400')),
      }),
    ).rejects.toThrow('400 Bad Request');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('onExhausted NÃO é chamado quando shouldRetry aborta antes do limite', async () => {
    const { sleep } = recordingSleep();
    const onExhausted = vi.fn();
    const fn = vi.fn(async () => {
      throw new Error('fatal');
    });

    await expect(
      withRetry(fn, { sleep, maxAttempts: 5, shouldRetry: () => false, onExhausted }),
    ).rejects.toThrow('fatal');

    expect(onExhausted).not.toHaveBeenCalled();
  });

  it('AbortSignal abortado antes da primeira tentativa lança AbortError sem executar fn', async () => {
    const { sleep } = recordingSleep();
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn(async () => 'never');

    await expect(withRetry(fn, { sleep, signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('AbortSignal abortado durante o backoff impede a próxima tentativa', async () => {
    const controller = new AbortController();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('never-reached');
    const sleep = vi.fn(async () => {
      controller.abort();
    });

    await expect(withRetry(fn, { sleep, signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('usa DEFAULT_BACKOFF do outbox como política default (consumo via contrato)', async () => {
    const { sleep, delays } = recordingSleep();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValue('ok');

    await withRetry(fn, { sleep, random: () => 0 });

    // DEFAULT_BACKOFF.baseMs = 1000, random=0 → delay = floor(0 * cap) = 0
    expect(delays).toEqual([0]);
    expect(DEFAULT_BACKOFF.baseMs).toBe(1000);
  });
});
