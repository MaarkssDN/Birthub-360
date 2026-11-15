import { describe, expect, it } from 'vitest';
import {
  buildDailyActivity,
  buildOutcomeCounts,
  computeDashboardKpis,
  periodDayWindow,
  periodStartDate,
  type PomodoroRecord,
  type TreatmentRecord,
} from '../mesaTratamento.dashboard.js';

/**
 * Testes das agregações puras do dashboard da Mesa de Tratamento — as mesmas funções que o
 * endpoint /api/mesa-tratamento/dashboard usa para montar KPIs, gráfico diário e contagem por
 * desfecho a partir de MesaTratamentoTreatment/PomodoroSession reais.
 */

function treatment(outcome: string, createdAt: Date = new Date()): TreatmentRecord {
  return { outcome, createdAt };
}

function pomodoro(durationMinutes: number, createdAt: Date = new Date()): PomodoroRecord {
  return { durationMinutes, createdAt };
}

describe('computeDashboardKpis', () => {
  it('retorna tudo zerado sem registros', () => {
    const kpis = computeDashboardKpis([], []);
    expect(kpis).toEqual({
      totalTratados: 0,
      taxaConversaoPercent: 0,
      taxaDesqualificacaoPercent: 0,
      totalFocusMinutes: 0,
      pomodoroCycles: 0,
    });
  });

  it('conta reunião agendada/realizada e convertido como conversão, sem_fit/dados_invalidos como desqualificação', () => {
    const kpis = computeDashboardKpis(
      [
        treatment('reuniao_agendada'),
        treatment('reuniao_realizada'),
        treatment('convertido'),
        treatment('sem_fit'),
        treatment('dados_invalidos'),
        treatment('contato'),
        treatment('decidido_pela_gestao'),
      ],
      [pomodoro(25), pomodoro(25), pomodoro(15)],
    );
    expect(kpis.totalTratados).toBe(7);
    // (3 conversões de 7) → 43%
    expect(kpis.taxaConversaoPercent).toBe(43);
    // (2 desqualificações de 7) → 29%
    expect(kpis.taxaDesqualificacaoPercent).toBe(29);
    expect(kpis.totalFocusMinutes).toBe(65);
    expect(kpis.pomodoroCycles).toBe(3);
  });
});

describe('buildDailyActivity', () => {
  it('semeia a janela inteira com zeros mesmo sem nenhum registro', () => {
    const points = buildDailyActivity([], [], 7);
    expect(points).toHaveLength(7);
    expect(points.every((p) => p.tratados === 0 && p.minutosFoco === 0)).toBe(true);
    // Ordem cronológica crescente, terminando hoje.
    expect(points[6].date).toBe(
      new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    );
  });

  it('agrega tratados/reuniões/oportunidades/desqualificados por dia e minutos de foco do Pomodoro', () => {
    const now = new Date();
    const points = buildDailyActivity(
      [
        treatment('reuniao_agendada', now),
        treatment('convertido', now),
        treatment('sem_fit', now),
        treatment('contato', now),
      ],
      [pomodoro(25, now), pomodoro(10, now)],
      1,
    );
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      tratados: 4,
      reunioes: 1,
      oportunidades: 1,
      desqualificados: 1,
      minutosFoco: 35,
    });
  });

  it('ignora registros fora da janela de dias', () => {
    const old = new Date(Date.now() - 30 * 86_400_000);
    const points = buildDailyActivity([treatment('contato', old)], [], 7);
    expect(points.reduce((acc, p) => acc + p.tratados, 0)).toBe(0);
  });
});

describe('buildOutcomeCounts', () => {
  it('agrupa contagem por outcome', () => {
    const counts = buildOutcomeCounts([
      treatment('contato'),
      treatment('contato'),
      treatment('reuniao_agendada'),
    ]);
    const map = new Map(counts.map((c) => [c.outcome, c.count]));
    expect(map.get('contato')).toBe(2);
    expect(map.get('reuniao_agendada')).toBe(1);
  });
});

describe('períodos', () => {
  it('periodStartDate: today = meia-noite de hoje, 7d/30d = janela móvel, all = null', () => {
    const now = new Date(2026, 10, 15, 15, 30);
    const today = periodStartDate('today', now);
    expect(today).toEqual(new Date(2026, 10, 15, 0, 0, 0, 0));
    expect(periodStartDate('7d', now)?.getTime()).toBe(now.getTime() - 7 * 86_400_000);
    expect(periodStartDate('30d', now)?.getTime()).toBe(now.getTime() - 30 * 86_400_000);
    expect(periodStartDate('all', now)).toBeNull();
  });

  it('periodDayWindow cobre 1/7/30/90 dias', () => {
    expect(periodDayWindow('today')).toBe(1);
    expect(periodDayWindow('7d')).toBe(7);
    expect(periodDayWindow('30d')).toBe(30);
    expect(periodDayWindow('all')).toBe(90);
  });
});
