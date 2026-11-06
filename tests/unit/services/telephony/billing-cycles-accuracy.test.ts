import { describe, expect, it } from 'vitest';
import { telephonyBillingService } from '../../../../src/services/telephony/billing.service.js';

describe('TelephonyBillingService — Billing Cycles Accuracy', () => {
  it('ciclo iniciado em 31 de janeiro fecha corretamente no ultimo dia de fevereiro e no dia 31 de marco', () => {
    // 31 de janeiro de 2026 (ano nao-bissexto)
    const jan31 = new Date(Date.UTC(2026, 0, 31, 0, 0, 0));
    const cycles = telephonyBillingService.generateSubsequentCycles(jan31, 2, 31);

    // Ciclo 1: fecha no ultimo dia de fevereiro (28 de fev)
    expect(cycles[0].cycleEnd.getUTCFullYear()).toBe(2026);
    expect(cycles[0].cycleEnd.getUTCMonth()).toBe(1); // Fevereiro
    expect(cycles[0].cycleEnd.getUTCDate()).toBe(28);

    // Ciclo 2: fecha em 31 de marco
    expect(cycles[1].cycleEnd.getUTCFullYear()).toBe(2026);
    expect(cycles[1].cycleEnd.getUTCMonth()).toBe(2); // Marco
    expect(cycles[1].cycleEnd.getUTCDate()).toBe(31);
  });

  it('lida com anos bissextos corretamente fechando em 29 de fevereiro', () => {
    // 31 de janeiro de 2028 (ano bissexto)
    const jan31Leap = new Date(Date.UTC(2028, 0, 31, 0, 0, 0));
    const cycle = telephonyBillingService.calculateNextBillingCycle(jan31Leap, 31);

    expect(cycle.cycleEnd.getUTCFullYear()).toBe(2028);
    expect(cycle.cycleEnd.getUTCMonth()).toBe(1); // Fevereiro
    expect(cycle.cycleEnd.getUTCDate()).toBe(29);
  });

  it('respeita transicoes regulares de meses com 30 e 31 dias', () => {
    // 30 de abril (mes de 30 dias)
    const apr30 = new Date(Date.UTC(2026, 3, 30, 0, 0, 0));
    const cycle = telephonyBillingService.calculateNextBillingCycle(apr30, 30);

    expect(cycle.cycleEnd.getUTCFullYear()).toBe(2026);
    expect(cycle.cycleEnd.getUTCMonth()).toBe(4); // Maio
    expect(cycle.cycleEnd.getUTCDate()).toBe(30);
  });
});
