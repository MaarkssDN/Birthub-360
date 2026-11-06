/**
 * src/services/telephony/billing.service.ts
 * Calculo e tarifacao precisa de ciclos de faturamento de telefonia (Handoff 04-para-12 / DIV-AGENTE-04-001).
 * Elimina incremento ingenuo de 30 dias usando manipulacao exata de meses de calendario com ajuste ao dia de corte.
 */

export interface BillingCyclePeriod {
  cycleStart: Date;
  cycleEnd: Date;
  cutOffDay: number;
}

export class TelephonyBillingService {
  /**
   * Calcula o proximo fechamento de ciclo de faturamento a partir de uma data de inicio e do dia de corte alvo.
   */
  public calculateNextBillingCycle(startDate: Date, cutOffDay?: number): BillingCyclePeriod {
    const cycleStart = new Date(startDate.getTime());
    const targetCutOff = cutOffDay ?? cycleStart.getUTCDate();

    // Avanca 1 mes a partir do inicio do ciclo
    let year = cycleStart.getUTCFullYear();
    let month = cycleStart.getUTCMonth();

    // Se a data de inicio ja esta no dia de corte (ou depois do dia de corte do mes atual), fecha no proximo mes
    const daysInCurrentMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const effectiveDayCurrent = Math.min(targetCutOff, daysInCurrentMonth);

    if (cycleStart.getUTCDate() >= effectiveDayCurrent) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    const daysInTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const effectiveDay = Math.min(targetCutOff, daysInTargetMonth);

    const cycleEnd = new Date(Date.UTC(year, month, effectiveDay, 23, 59, 59, 999));

    return {
      cycleStart,
      cycleEnd,
      cutOffDay: targetCutOff,
    };
  }

  /**
   * Converte uma sequencia de ciclos de faturamento para validacao de fechamentos consecutivos.
   */
  public generateSubsequentCycles(initialStartDate: Date, cyclesCount: number, cutOffDay?: number): BillingCyclePeriod[] {
    const cycles: BillingCyclePeriod[] = [];
    let currentStart = new Date(initialStartDate.getTime());
    const cutOff = cutOffDay ?? currentStart.getUTCDate();

    for (let i = 0; i < cyclesCount; i++) {
      const cycle = this.calculateNextBillingCycle(currentStart, cutOff);
      cycles.push(cycle);
      // O proximo ciclo comeca no inicio do dia seguinte
      currentStart = new Date(Date.UTC(
        cycle.cycleEnd.getUTCFullYear(),
        cycle.cycleEnd.getUTCMonth(),
        cycle.cycleEnd.getUTCDate() + 1,
        0, 0, 0, 0
      ));
    }

    return cycles;
  }
}

export const telephonyBillingService = new TelephonyBillingService();
