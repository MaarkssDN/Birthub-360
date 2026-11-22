import { describe, expect, it } from 'vitest';
import { formatCurrency, formatMultiple, formatPercent } from '../presentation/formatMetrics.js';

describe('executive metric formatting', () => {
  it('keeps missing metrics unavailable instead of manufacturing zero', () => {
    for (const format of [formatCurrency, formatMultiple, formatPercent]) {
      expect(format(null)).toBe('Não disponível');
      expect(format(undefined)).toBe('Não disponível');
    }
  });

  it('distinguishes real zero values and formats percent and multiples', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s+0,00/);
    expect(formatPercent(0)).toBe('0%');
    expect(formatMultiple(0)).toBe('0x');
    expect(formatPercent(23.45)).toBe('23,5%');
    expect(formatMultiple(1.56)).toBe('1,6x');
  });

  it('retains the requested currency and negative amounts', () => {
    expect(formatCurrency(-1234.5, 'USD')).toBe(
      (-1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }),
    );
  });
});
