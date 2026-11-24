import { describe, expect, it } from 'vitest';
import {
  civilDateKeyInZone,
  civilDayRangeInZoneToUtcIso,
  formatUtcTaskToClientTimezone,
  normalizeActivityDateToUtcIso,
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

describe('normalizeActivityDateToUtcIso', () => {
  it('date-only YYYY-MM-DD vira meia-noite NO FUSO, não meia-noite UTC (regressão off-by-one)', () => {
    // new Date('2026-11-23') === 2026-11-23T00:00:00Z → 22/11 21h em São Paulo (dia anterior).
    // O correto é 2026-11-23T03:00:00Z (meia-noite local).
    expect(normalizeActivityDateToUtcIso('2026-11-23')).toBe('2026-11-23T03:00:00.000Z');
  });

  it('date-only respeita o fuso informado', () => {
    expect(normalizeActivityDateToUtcIso('2026-11-23', 'UTC')).toBe('2026-11-23T00:00:00.000Z');
    expect(normalizeActivityDateToUtcIso('2026-07-01', 'America/New_York')).toBe(
      '2026-07-01T04:00:00.000Z',
    );
  });

  it('ISO completo com offset passa direto', () => {
    expect(normalizeActivityDateToUtcIso('2026-11-23T14:30:00-03:00')).toBe(
      '2026-11-23T17:30:00.000Z',
    );
  });

  it('Date válido vira ISO; inválidos lançam erro descritivo', () => {
    expect(normalizeActivityDateToUtcIso(new Date('2026-01-01T00:00:00Z'))).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(() => normalizeActivityDateToUtcIso(new Date('lixo'))).toThrow(
      'Data de atividade inválida',
    );
    expect(() => normalizeActivityDateToUtcIso('não é data')).toThrow(
      'Data de atividade inválida',
    );
    expect(() => normalizeActivityDateToUtcIso('2026-02-30')).toThrow(
      'Data de tarefa inexistente no calendário',
    );
  });
});

describe('civilDateKeyInZone', () => {
  it('instante UTC perto da meia-noite vira o dia civil do fuso, não do UTC', () => {
    // 2026-11-23T02:00Z = 22/11 23:00 em São Paulo.
    expect(civilDateKeyInZone('2026-11-23T02:00:00.000Z', 'America/Sao_Paulo')).toBe('2026-11-22');
    expect(civilDateKeyInZone('2026-11-23T02:00:00.000Z', 'UTC')).toBe('2026-11-23');
  });
});

describe('civilDayRangeInZoneToUtcIso', () => {
  it('cobre o dia civil inteiro em America/Sao_Paulo', () => {
    expect(civilDayRangeInZoneToUtcIso('2026-11-23')).toEqual({
      start: '2026-11-23T03:00:00.000Z',
      end: '2026-11-24T03:00:00.000Z',
    });
  });

  it('vira o mês/ano corretamente na virada', () => {
    expect(civilDayRangeInZoneToUtcIso('2026-12-31', 'UTC')).toEqual({
      start: '2026-12-31T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z',
    });
  });

  it('rejeita data civil inexistente', () => {
    expect(() => civilDayRangeInZoneToUtcIso('2026-02-30')).toThrow(
      'Data de tarefa inexistente no calendário',
    );
  });
});
