import { describe, expect, it } from 'vitest';
import { evaluateCadenceBusinessWindow, resolveLocalTimeParts } from '../cadence.worker.js';

/**
 * Testes focados do avaliador de janela comercial de cadências (Agente 44 — Onda 4).
 * Complementam o caso feliz já coberto em `tests/unit/features/crm/onda3CrmSquad40.test.tsx`
 * com as bordas que decidem QUANDO um toque é adiado: virada de dia útil, precisão de
 * minuto, fallback de timezone inválido e configuração customizada de janela.
 *
 * Referência de fuso: America/Sao_Paulo = UTC-3 fixo (sem horário de verão desde 2019),
 * o que torna os cálculos de `delayMsUntilNextWindow` determinísticos.
 */

const TZ = 'America/Sao_Paulo';

describe('[44 · Lola] evaluateCadenceBusinessWindow — bordas da janela comercial', () => {
  it('permite exatamente no startHour e bloqueia exatamente no endHour', () => {
    // 2026-11-20 é Sexta-feira. 11:00Z = 08:00 BRT; 22:00Z = 19:00 BRT.
    const atStart = evaluateCadenceBusinessWindow(new Date('2026-11-20T11:00:00Z'), TZ);
    expect(atStart.allowed).toBe(true);

    const atEnd = evaluateCadenceBusinessWindow(new Date('2026-11-20T22:00:00Z'), TZ);
    expect(atEnd.allowed).toBe(false);
    expect(atEnd.reason).toBe('OUTSIDE_BUSINESS_HOURS');
  });

  it('adia pela manhã do mesmo dia útil com precisão de minuto', () => {
    // 10:30Z = 07:30 BRT de sexta → próximo slot é 08:00 do mesmo dia (30 min).
    const r = evaluateCadenceBusinessWindow(new Date('2026-11-20T10:30:00Z'), TZ);
    expect(r.allowed).toBe(false);
    expect(r.localWeekday).toBe(5);
    expect(r.delayMsUntilNextWindow).toBe(30 * 60 * 1000);
  });

  it('adia de sexta à noite para segunda 08:00 (pula sábado e domingo)', () => {
    // 23:30Z = 20:30 BRT de sexta → segunda 08:00 BRT = +59h30.
    const r = evaluateCadenceBusinessWindow(new Date('2026-11-20T23:30:00Z'), TZ);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('OUTSIDE_BUSINESS_HOURS'); // sexta é dia útil, só fora do horário
    expect(r.delayMsUntilNextWindow).toBe(59.5 * 60 * 60 * 1000);
  });

  it('adia de sábado para segunda 08:00 independentemente da hora local', () => {
    // 12:00Z sábado = 09:00 BRT → +47h até segunda 08:00.
    const morning = evaluateCadenceBusinessWindow(new Date('2026-11-21T12:00:00Z'), TZ);
    expect(morning.allowed).toBe(false);
    expect(morning.reason).toBe('WEEKEND_OR_NON_BUSINESS_DAY');
    expect(morning.delayMsUntilNextWindow).toBe(47 * 60 * 60 * 1000);

    // 02:00Z de domingo = 23:00 BRT de sábado → +33h até segunda 08:00.
    const nightBefore = evaluateCadenceBusinessWindow(new Date('2026-11-22T02:00:00Z'), TZ);
    expect(nightBefore.localWeekday).toBe(6);
    expect(nightBefore.delayMsUntilNextWindow).toBe(33 * 60 * 60 * 1000);
  });

  it('respeita allowedWeekdays customizado (janela só no fim de semana)', () => {
    const weekendOnly = { startHour: 10, endHour: 12, allowedWeekdays: [0, 6] as const };
    // Quarta 2026-11-18 13:00Z = 10:00 BRT → bloqueado; próximo sábado 10:00 = 2026-11-21 13:00Z.
    const wed = evaluateCadenceBusinessWindow(new Date('2026-11-18T13:00:00Z'), TZ, weekendOnly);
    expect(wed.allowed).toBe(false);
    expect(wed.delayMsUntilNextWindow).toBe(72 * 60 * 60 * 1000);

    // Sábado 2026-11-21 13:00Z = 10:00 BRT → dentro da janela customizada.
    const sat = evaluateCadenceBusinessWindow(new Date('2026-11-21T13:00:00Z'), TZ, weekendOnly);
    expect(sat.allowed).toBe(true);
  });

  it('faz fallback para America/Sao_Paulo quando o timezone do lead é inválido', () => {
    const r = evaluateCadenceBusinessWindow(new Date('2026-11-20T17:00:00Z'), 'Fuso/Inexistente');
    expect(r.timezone).toBe('America/Sao_Paulo');
    expect(r.localHour).toBe(14); // 17:00Z = 14:00 BRT
    expect(r.allowed).toBe(true);

    const parts = resolveLocalTimeParts(new Date('2026-11-20T17:00:00Z'), '');
    expect(parts.normalizedTimezone).toBe('America/Sao_Paulo');
  });

  it('nunca devolve delay menor que 1 minuto (piso de reavaliação)', () => {
    // 07:59:30 BRT → ~30s até 08:00, mas o piso garante re-check em 60s.
    const r = evaluateCadenceBusinessWindow(new Date('2026-11-20T10:59:30Z'), TZ);
    expect(r.allowed).toBe(false);
    expect(r.delayMsUntilNextWindow).toBe(60_000);
  });
});
