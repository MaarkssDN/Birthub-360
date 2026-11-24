import { describe, expect, it } from 'vitest';
import {
  formatUtcTaskToClientTimezone,
  normalizeTaskDateToUtcIso,
  wallTimeInZoneToUtcIso,
} from '../calendar.utils.js';

describe('normalizeTaskDateToUtcIso', () => {
  it('converte ISO com offset para UTC', () => {
    expect(normalizeTaskDateToUtcIso('2026-11-20T15:00:00-03:00')).toBe('2026-11-20T18:00:00.000Z');
  });

  it('aceita Date e rejeita data inválida', () => {
    expect(normalizeTaskDateToUtcIso(new Date('2026-01-01T00:00:00Z'))).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(() => normalizeTaskDateToUtcIso('não é data')).toThrow(
      'Data de tarefa inválida para normalização UTC.',
    );
  });
});

describe('formatUtcTaskToClientTimezone', () => {
  it('formata instante UTC no fuso do cliente', () => {
    const formatted = formatUtcTaskToClientTimezone(
      '2026-11-20T18:00:00.000Z',
      'America/Sao_Paulo',
    );
    expect(formatted).toContain('15:00');
    expect(formatted).toContain('20/11/2026');
  });

  it('usa America/Sao_Paulo como fuso padrão', () => {
    expect(formatUtcTaskToClientTimezone('2026-11-20T18:00:00.000Z')).toContain('15:00');
  });

  it('rejeita ISO inválido', () => {
    expect(() => formatUtcTaskToClientTimezone('lixo')).toThrow('String ISO UTC inválida.');
  });
});

describe('wallTimeInZoneToUtcIso', () => {
  it('converte data civil em America/Sao_Paulo para o instante UTC equivalente', () => {
    // Regressão do off-by-one: '2026-11-23' NÃO pode virar 2026-11-23T00:00:00Z
    // (que renderiza como 22/11 21h em São Paulo) — deve ser 03:00Z (meia-noite local).
    expect(wallTimeInZoneToUtcIso('2026-11-23', null, 'America/Sao_Paulo')).toBe(
      '2026-11-23T03:00:00.000Z',
    );
  });

  it('converte data + horário no fuso informado', () => {
    expect(wallTimeInZoneToUtcIso('2026-11-23', '14:30', 'America/Sao_Paulo')).toBe(
      '2026-11-23T17:30:00.000Z',
    );
    expect(wallTimeInZoneToUtcIso('2026-11-23', '09:00:30', 'America/Sao_Paulo')).toBe(
      '2026-11-23T12:00:30.000Z',
    );
  });

  it('respeita o offset do fuso (não é fixo -03:00)', () => {
    // Nova York em julho está em EDT (UTC-4), não EST (UTC-5).
    expect(wallTimeInZoneToUtcIso('2026-07-01', '12:00', 'America/New_York')).toBe(
      '2026-07-01T16:00:00.000Z',
    );
    // E em janeiro está em EST (UTC-5).
    expect(wallTimeInZoneToUtcIso('2026-01-15', '12:00', 'America/New_York')).toBe(
      '2026-01-15T17:00:00.000Z',
    );
  });

  it('fuso UTC devolve a própria meia-noite/horário como UTC', () => {
    expect(wallTimeInZoneToUtcIso('2026-11-23', '08:15', 'UTC')).toBe('2026-11-23T08:15:00.000Z');
  });

  it('usa America/Sao_Paulo como fuso padrão', () => {
    expect(wallTimeInZoneToUtcIso('2026-11-23')).toBe('2026-11-23T03:00:00.000Z');
  });

  it('rejeita formato de data inválido', () => {
    expect(() => wallTimeInZoneToUtcIso('23/11/2026')).toThrow(
      'Data de tarefa inválida para conversão de fuso',
    );
  });

  it('rejeita data civil inexistente', () => {
    expect(() => wallTimeInZoneToUtcIso('2026-02-30')).toThrow(
      'Data de tarefa inexistente no calendário',
    );
  });

  it('rejeita horário inválido', () => {
    expect(() => wallTimeInZoneToUtcIso('2026-11-23', '25:00')).toThrow(
      'Horário de tarefa fora do intervalo',
    );
    expect(() => wallTimeInZoneToUtcIso('2026-11-23', 'abc')).toThrow('Horário de tarefa inválido');
  });

  it('rejeita fuso horário inexistente', () => {
    expect(() => wallTimeInZoneToUtcIso('2026-11-23', null, 'Marte/Olympus')).toThrow(
      'Fuso horário inválido para conversão de tarefa',
    );
  });
});
