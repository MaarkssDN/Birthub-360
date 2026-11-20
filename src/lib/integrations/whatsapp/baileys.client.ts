/**
 * WhatsApp Anti-Ban Governance & Humanized Jitter Throttler
 * Bloqueador B-08 / Requisito Luna (Squad 50 - Agente 56)
 *
 * Configura delay aleatório humanizado (3.000ms a 8.000ms) entre disparos em massa via Baileys.
 * Previne bloqueios/banimentos de números por comportamento robótico e rajadas de tráfego.
 */

import { logger } from '../../logger.js';

export const MIN_ANTI_BAN_DELAY_MS = 3000;
export const MAX_ANTI_BAN_DELAY_MS = 8000;

export interface AntiBanThrottleRecord {
  lastDispatchedAt: number;
  totalDispatched: number;
}

/**
 * Calcula um intervalo pseudoaleatório humanizado estritamente no intervalo [minMs, maxMs].
 */
export function calculateAntiBanDelay(
  minMs: number = MIN_ANTI_BAN_DELAY_MS,
  maxMs: number = MAX_ANTI_BAN_DELAY_MS,
): number {
  const safeMin = Math.max(0, minMs);
  const safeMax = Math.max(safeMin, maxMs);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

export class WhatsAppAntiBanThrottler {
  private organizationRecords = new Map<string, AntiBanThrottleRecord>();

  /**
   * Pausa a execução com o delay especificado.
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Aplica throttling com jitter humanizado antes do próximo disparo para a organização especificada.
   * Retorna os milissegundos esperados.
   */
  public async throttle(
    organizationId: string,
    customDelayMs?: number,
  ): Promise<number> {
    const record = this.organizationRecords.get(organizationId);
    const now = Date.now();
    const plannedDelay = customDelayMs ?? calculateAntiBanDelay();

    if (record) {
      const elapsed = now - record.lastDispatchedAt;
      if (elapsed < plannedDelay) {
        const sleepDuration = plannedDelay - elapsed;
        logger.info(
          {
            organizationId,
            plannedDelayMs: plannedDelay,
            elapsedMs: elapsed,
            sleepDurationMs: sleepDuration,
            totalDispatched: record.totalDispatched + 1,
          },
          'WhatsApp Anti-Ban: aplicando delay pseudoaleatório humanizado entre disparos consecutivos via Baileys.',
        );
        await this.sleep(sleepDuration);
      }
    }

    const completionTime = Date.now();
    this.organizationRecords.set(organizationId, {
      lastDispatchedAt: completionTime,
      totalDispatched: (record?.totalDispatched ?? 0) + 1,
    });

    return plannedDelay;
  }

  public getRecord(organizationId: string): AntiBanThrottleRecord | undefined {
    return this.organizationRecords.get(organizationId);
  }

  public reset(organizationId?: string): void {
    if (organizationId) {
      this.organizationRecords.delete(organizationId);
    } else {
      this.organizationRecords.clear();
    }
  }
}

export const whatsAppAntiBanThrottler = new WhatsAppAntiBanThrottler();
