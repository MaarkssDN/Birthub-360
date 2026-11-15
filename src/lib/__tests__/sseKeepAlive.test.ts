import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachSseKeepAlive, SSE_HEARTBEAT_INTERVAL_MS } from '../sseKeepAlive.js';

class FakeSseResponse extends EventEmitter {
  writes: string[] = [];
  write(data: string) {
    this.writes.push(data);
    return true;
  }
  off(event: string, listener: (...args: unknown[]) => void) {
    return this.removeListener(event, listener);
  }
}

describe('attachSseKeepAlive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('escreve comentário `: ping` a cada intervalo configurado', () => {
    const res = new FakeSseResponse();
    attachSseKeepAlive(res as never, 1000);

    vi.advanceTimersByTime(1000);
    expect(res.writes).toEqual([': ping\n\n']);

    vi.advanceTimersByTime(2000);
    expect(res.writes).toHaveLength(3);
    res.emit('close');
  });

  it('usa o intervalo default de 25s (abaixo do timeout típico de proxy)', () => {
    const res = new FakeSseResponse();
    attachSseKeepAlive(res as never);

    vi.advanceTimersByTime(SSE_HEARTBEAT_INTERVAL_MS - 1);
    expect(res.writes).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(res.writes).toEqual([': ping\n\n']);
    res.emit('close');
  });

  it('para de escrever e limpa listeners ao receber `close` (anti memory leak)', () => {
    const res = new FakeSseResponse();
    const stop = attachSseKeepAlive(res as never, 1000);

    res.emit('close');
    vi.advanceTimersByTime(5000);
    expect(res.writes).toHaveLength(0);

    // `stop()` é idempotente e remove os próprios listeners.
    stop();
    expect(res.listenerCount('close')).toBe(0);
    expect(res.listenerCount('error')).toBe(0);
  });

  it('para de escrever ao receber `error` no socket', () => {
    const res = new FakeSseResponse();
    attachSseKeepAlive(res as never, 1000);

    res.emit('error', new Error('socket hang up'));
    vi.advanceTimersByTime(3000);
    expect(res.writes).toHaveLength(0);
  });

  it('para o timer quando `write` lança exceção (socket morto)', () => {
    const res = new FakeSseResponse();
    res.write = () => {
      throw new Error('write after end');
    };
    const stop = attachSseKeepAlive(res as never, 1000);

    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(5000);
    // Se o timer continuasse, cada tick tentaria write de novo; verificamos via
    // listener cleanup: após stop() interno, `close` não deve ter listeners.
    expect(res.listenerCount('close')).toBe(0);
    stop();
  });
});
