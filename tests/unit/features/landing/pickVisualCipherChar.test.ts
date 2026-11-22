import { describe, expect, it, vi } from 'vitest';
import {
  pickVisualCipherChar,
} from '../../../../src/features/landing/components/B360CinematicEngine.js';

const CIPHER_CHARS = '#%&*01/<>[]X$@ØΔλ';

describe('pickVisualCipherChar — scramble visual sem PRNG previsível (S2245)', () => {
  it('devolve um glyph do alfabeto visual e não chama Math.random', () => {
    const mathRandom = vi.spyOn(Math, 'random');
    const glyphs = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const ch = pickVisualCipherChar();
      expect(CIPHER_CHARS).toContain(ch);
      glyphs.add(ch);
    }
    expect(mathRandom).not.toHaveBeenCalled();
    expect(glyphs.size).toBeGreaterThan(1);
    mathRandom.mockRestore();
  });

  it('usa crypto.getRandomValues para escolher o índice', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    pickVisualCipherChar();
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Uint32Array);
    spy.mockRestore();
  });
});
