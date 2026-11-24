import { prisma } from '../../../lib/prisma.js';
import { logger } from '../../../lib/logger.js';
import { advanceCadenceRunPendingTouch } from '../application/cadenceService.js';
import { buildDeps, parseCadenceSequenceDefinition } from '../jobs/cadenceRun.worker.js';

/**
 * DEBT-0009 — o enum `CadenceTouchResult` do banco não tem `Pending` (handoff ao Agente 01);
 * o adaptador Prisma persiste a tentativa pendente de voz como `Skipped` mantendo
 * `providerMessageId`. Portanto, no banco, "pendente de confirmação" = resultado `Skipped` (ou
 * `Pending`, caso o enum venha a existir) COM o `providerMessageId` do webhook — `skipped`
 * legítimos (janela comercial/rate limit) nunca têm `providerMessageId`.
 */
function isUnresolvedPendingAttempt(attempt: {
  result: unknown;
  providerMessageId: string | null;
}): boolean {
  const result = String(attempt.result);
  return attempt.providerMessageId != null && (result === 'Pending' || result === 'Skipped');
}

export async function resolveCadencePendingVoiceTouch(
  organizationId: string,
  leadId: string,
  providerMessageId: string,
  outcome: { result: 'sent' | 'failed'; error?: string | null },
): Promise<void> {
  // Find any active or paused cadence run for this lead that has this providerMessageId as a pending attempt
  const runs = await prisma.cadenceRun.findMany({
    where: {
      organizationId,
      leadId,
      status: { in: ['Active', 'Paused'] },
    },
    select: {
      id: true,
      sequenceId: true,
      touchAttempts: { select: { result: true, providerMessageId: true } },
    },
  });

  for (const row of runs) {
    const hasPending = row.touchAttempts.some(
      (a) => a.providerMessageId === providerMessageId && isUnresolvedPendingAttempt(a),
    );
    if (!hasPending) continue;

    // Defesa em profundidade (auditoria ONDA3-44): a FK run→sequence não é composta por
    // tenant — o lookup precisa do mesmo organizationId do run, nunca só o id.
    const sequenceRow = await prisma.cadenceSequence.findFirst({
      where: { id: row.sequenceId, organizationId },
      select: { id: true, name: true, touches: true },
    });
    if (!sequenceRow) continue;

    const sequence = parseCadenceSequenceDefinition(sequenceRow);
    if (!sequence) continue;

    const deps = buildDeps();
    try {
      await advanceCadenceRunPendingTouch(
        deps,
        organizationId,
        row.id,
        sequence,
        providerMessageId,
        new Date(),
        outcome,
      );
    } catch (err) {
      logger.error({ err, runId: row.id }, 'Falha ao resolver toque pendente de voz via webhook');
    }
  }
}
