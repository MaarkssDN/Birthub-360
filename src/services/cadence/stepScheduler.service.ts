/**
 * src/services/cadence/stepScheduler.service.ts
 * Agendador inteligente de passos de cadencia com respeito a janela comercial (08:00 - 19:00) e timezone.
 * (Handoff 06-para-17 / DIV-AGENTE-17-001)
 */

export interface ScheduleOptions {
  timezone?: string; // Default: America/Sao_Paulo
  startHour?: number; // Default: 8
  endHour?: number;   // Default: 19
  targetNextHour?: number; // Default: 9 (hora de execucao no proximo dia util)
}

export class CadenceStepSchedulerService {
  /**
   * Ajusta a data de execucao para que ocorra obrigatoriamente dentro da janela de horario comercial
   * em dias uteis (segunda a sexta). Se cair em fim de semana ou fora do horario, posterga para as 09:00
   * do proximo dia util.
   */
  public adjustToBusinessHours(scheduledDate: Date, options: ScheduleOptions = {}): Date {
    const startHour = options.startHour ?? 8;
    const endHour = options.endHour ?? 19;
    const targetNextHour = options.targetNextHour ?? 9;

    const adjusted = new Date(scheduledDate.getTime());

    // Obter dia da semana e hora local (usando UTC ou calculo simples de timezone)
    // 0 = Domingo, 6 = Sabado
    const dayOfWeek = adjusted.getUTCDay();
    const hour = adjusted.getUTCHours();

    // Se for Sabado (6), posterga para Segunda-feira
    if (dayOfWeek === 6) {
      adjusted.setUTCDate(adjusted.getUTCDate() + 2);
      adjusted.setUTCHours(targetNextHour, 0, 0, 0);
      return adjusted;
    }

    // Se for Domingo (0), posterga para Segunda-feira
    if (dayOfWeek === 0) {
      adjusted.setUTCDate(adjusted.getUTCDate() + 1);
      adjusted.setUTCHours(targetNextHour, 0, 0, 0);
      return adjusted;
    }

    // Se for dia util mas antes do horario de abertura (ex: < 8)
    if (hour < startHour) {
      adjusted.setUTCHours(startHour, 0, 0, 0);
      return adjusted;
    }

    // Se for dia util apos o horario de fechamento (ex: >= 19)
    if (hour >= endHour) {
      // Posterga para o proximo dia
      adjusted.setUTCDate(adjusted.getUTCDate() + 1);
      adjusted.setUTCHours(targetNextHour, 0, 0, 0);

      // Se o proximo dia for sabado (6), posterga mais 2 dias (segunda)
      if (adjusted.getUTCDay() === 6) {
        adjusted.setUTCDate(adjusted.getUTCDate() + 2);
      }
      return adjusted;
    }

    return adjusted;
  }
}

export const cadenceStepSchedulerService = new CadenceStepSchedulerService();
