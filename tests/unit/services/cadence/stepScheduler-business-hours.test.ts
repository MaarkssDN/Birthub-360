import { describe, expect, it } from 'vitest';
import { cadenceStepSchedulerService } from '../../../../src/services/cadence/stepScheduler.service.js';

describe('CadenceStepSchedulerService — Business Hours Protection', () => {
  it('passo calculado para domingo as 23:00 eh agendado para segunda-feira as 09:00', () => {
    // 08 de fevereiro de 2026 (Domingo) as 23:00 UTC
    const sundayNight = new Date(Date.UTC(2026, 1, 8, 23, 0, 0));
    expect(sundayNight.getUTCDay()).toBe(0);

    const adjusted = cadenceStepSchedulerService.adjustToBusinessHours(sundayNight);

    expect(adjusted.getUTCDay()).toBe(1); // Segunda-feira
    expect(adjusted.getUTCDate()).toBe(9); // 09 de fevereiro
    expect(adjusted.getUTCHours()).toBe(9); // 09:00
  });

  it('passo calculado para sexta-feira as 20:30 eh agendado para segunda-feira as 09:00', () => {
    // 06 de fevereiro de 2026 (Sexta-feira) as 20:30 UTC
    const fridayNight = new Date(Date.UTC(2026, 1, 6, 20, 30, 0));
    expect(fridayNight.getUTCDay()).toBe(5);

    const adjusted = cadenceStepSchedulerService.adjustToBusinessHours(fridayNight);

    expect(adjusted.getUTCDay()).toBe(1); // Segunda-feira
    expect(adjusted.getUTCDate()).toBe(9); // 09 de fevereiro
    expect(adjusted.getUTCHours()).toBe(9); // 09:00
  });

  it('passo dentro do horario comercial em dia util permanece inalterado', () => {
    // 10 de fevereiro de 2026 (Terca-feira) as 14:00 UTC
    const tuesdayAfternoon = new Date(Date.UTC(2026, 1, 10, 14, 0, 0));
    const adjusted = cadenceStepSchedulerService.adjustToBusinessHours(tuesdayAfternoon);

    expect(adjusted.getTime()).toBe(tuesdayAfternoon.getTime());
  });
});
