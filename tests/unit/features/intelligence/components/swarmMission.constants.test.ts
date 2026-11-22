import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from '../../../../../src/features/intelligence/components/swarm-dashboard/swarmMission.constants.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createId — gerador criptograficamente seguro (S2245)', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
    vi.restoreAllMocks();
  });

  it('usa crypto.randomUUID quando disponível e não chama Math.random', () => {
    const randomUUID = vi.fn(() => '11111111-2222-4333-8444-555555555555');
    const getRandomValues = vi.fn();
    const mathRandom = vi.spyOn(Math, 'random');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID, getRandomValues },
    });

    expect(createId()).toBe('11111111-2222-4333-8444-555555555555');
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('cai para crypto.getRandomValues no formato UUID v4 quando randomUUID não existe', () => {
    const getRandomValues = vi.fn((buf: Uint8Array) => {
      for (let i = 0; i < buf.length; i++) buf[i] = i;
      return buf;
    });
    const mathRandom = vi.spyOn(Math, 'random');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { getRandomValues },
    });

    const id = createId();
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(id).toMatch(UUID_V4);
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('lança se não houver gerador seguro — não usa Math.random como fallback', () => {
    const mathRandom = vi.spyOn(Math, 'random');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    expect(() => createId()).toThrow(/criptograficamente seguro/);
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('produz identificadores distintos em chamadas seguidas', () => {
    const a = createId();
    const b = createId();
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });
});
