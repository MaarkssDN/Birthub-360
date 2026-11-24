import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_DEFAULT_TIME_ZONE,
  civilDayRangeUtc,
  localDateOnlyToIso,
  parseActivityDate,
  toLocalDateInputValue,
  wallTimeInZoneToUtcIso,
} from '../domain/activityDate.js';

/**
 * Regressão do bug comprovado pelo Agente 45 (handoff 45-para-04-atividades-agenda-bugs.md,
 * item 1): `<input type="date">` produz `YYYY-MM-DD` e `new Date('2026-11-23')` SEMPRE resulta
 * em `2026-11-23T00:00:00.000Z` (meia-noite UTC por especificação). Em America/Sao_Paulo
 * (UTC-3) esse instante é 22/11 21h — a atividade criada para o dia 23 aparecia no dia 22.
 */
describe('wallTimeInZoneToUtcIso', () => {
  it('interpreta YYYY-MM-DD como meia-noite no fuso informado, não como UTC', () => {
    // America/Sao_Paulo não tem DST desde 2019 — UTC-3 o ano todo.
    expect(wallTimeInZoneToUtcIso('2026-11-23', null, 'America/Sao_Paulo')).toBe(
      '2026-11-23T03:00:00.000Z',
    );
  });

  it('combina data civil + horário de parede no fuso', () => {
    expect(wallTimeInZoneToUtcIso('2026-11-23', '14:30', 'America/Sao_Paulo')).toBe(
      '2026-11-23T17:30:00.000Z',
    );
  });

  it('rejeita data inexistente no calendário', () => {
    expect(() => wallTimeInZoneToUtcIso('2026-02-30', null, 'America/Sao_Paulo')).toThrow();
  });

  it('rejeita formato que não seja YYYY-MM-DD', () => {
    expect(() => wallTimeInZoneToUtcIso('23/11/2026', null, 'America/Sao_Paulo')).toThrow();
    expect(() => wallTimeInZoneToUtcIso('2026-11-23T10:00:00Z', null, 'America/Sao_Paulo')).toThrow();
  });
});

describe('parseActivityDate — backend nunca deve gravar meia-noite UTC para date-only', () => {
  it('date-only vira o instante da meia-noite civil em America/Sao_Paulo', () => {
    const parsed = parseActivityDate('2026-11-23');
    expect(parsed.toISOString()).toBe('2026-11-23T03:00:00.000Z');
    // Prova do bug original: new Date('2026-11-23') daria 2026-11-23T00:00:00.000Z, que em
    // America/Sao_Paulo é 22/11 21h — um dia antes do escolhido.
    expect(new Date('2026-11-23').toISOString()).toBe('2026-11-23T00:00:00.000Z');
  });

  it('ISO completo passa inalterado (drag do calendário, tools de IA)', () => {
    const iso = '2026-11-23T17:30:00.000Z';
    expect(parseActivityDate(iso).toISOString()).toBe(iso);
    const date = new Date('2026-11-23T17:30:00.000Z');
    expect(parseActivityDate(date).getTime()).toBe(date.getTime());
  });

  it('rejeita string que não é data', () => {
    expect(() => parseActivityDate('não-é-data')).toThrow();
  });
});

describe('civilDayRangeUtc — filtro ?date=YYYY-MM-DD cobre o dia civil no fuso do produto', () => {
  it('retorna [meia-noite SP do dia, meia-noite SP do dia seguinte)', () => {
    const range = civilDayRangeUtc('2026-11-23');
    expect(range?.gte.toISOString()).toBe('2026-11-23T03:00:00.000Z');
    expect(range?.lt.toISOString()).toBe('2026-11-24T03:00:00.000Z');
  });

  it('retorna null para entrada que não é date-only (caller decide o fallback)', () => {
    expect(civilDayRangeUtc('2026-11-23T10:00:00Z')).toBeNull();
  });
});

describe('helpers de formulário (<input type="date">)', () => {
  it('localDateOnlyToIso interpreta YYYY-MM-DD na meia-noite do fuso LOCAL do navegador', () => {
    // Independente do fuso da máquina que roda o teste: a data civil escolhida tem que
    // permanecer a mesma quando renderizada no mesmo fuso.
    const iso = localDateOnlyToIso('2026-11-23');
    const back = new Date(iso);
    expect(back.getFullYear()).toBe(2026);
    expect(back.getMonth()).toBe(10);
    expect(back.getDate()).toBe(23);
    expect(back.getHours()).toBe(0);
    expect(back.getMinutes()).toBe(0);
  });

  it('toLocalDateInputValue nunca usa toISOString() (que escorrega um dia em fusos negativos à noite)', () => {
    const d = new Date(2026, 10, 23, 22, 30); // 23/11 22:30 no fuso local da máquina
    expect(toLocalDateInputValue(d)).toBe('2026-11-23');
  });
});

describe('constante de fuso', () => {
  it('default do produto é America/Sao_Paulo', () => {
    expect(ACTIVITY_DEFAULT_TIME_ZONE).toBe('America/Sao_Paulo');
  });
});
