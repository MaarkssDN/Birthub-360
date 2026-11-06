import { describe, expect, it } from 'vitest';
import { formatSafeCsvCell } from '../../../../src/services/bitrix/exportFormatter.service.js';

describe('exportFormatter CSV injection', () => {
  it.each(['=CMD|\'/C calc\'!A0', '+1+1', '-2+3', '@SUM(A1)', '\tx', '\rx'])('neutraliza %j', (v) => {
    const out = formatSafeCsvCell(v);
    expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
  });
  it('mantem valores comuns e nulos', () => {
    expect(formatSafeCsvCell('Joao')).toBe('Joao');
    expect(formatSafeCsvCell(null)).toBe('');
    expect(formatSafeCsvCell('a,b')).toBe('"a,b"');
  });
});
