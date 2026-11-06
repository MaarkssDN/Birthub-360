import { createHash } from 'node:crypto';
import { requestContext } from '../../lib/async-context.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { getRedisClient, isRedisConfigured } from '../../lib/redis/client.js';
import { deleteObject } from '../../lib/storage/index.js';

export interface ErasureTarget {
  organizationId: string;
  contactId: string;
  // Quem exerceu o direito de exclusão em nome do titular (ADMIN/GESTOR autenticado que chamou a
  // rota) — sem isto, o `requestContext` não carrega `userId`, e o UPDATE automático de auditoria
  // dessa extensão do Prisma (ver src/lib/prisma.ts, `auditableModels` inclui `Contact`) grava a
  // anonimização com `actorId` vazio, perdendo justamente o "quem" de uma ação irreversível de
  // LGPD. Opcional só para não quebrar chamadas indiretas (ex.: script/worker) sem ator humano.
  actorUserId?: string;
}

export interface ErasureResult {
  contactId: string;
  whatsAppMessagesMasked: number;
  conversationSignalsRedacted: number;
  timelineEventsRedacted: number;
  voiceCallLogsRedacted: number;
  copilotoTranscriptSegmentsRedacted: number;
  copilotoInsightsRedacted: number;
  copilotoAudiosDeleted: number;
  alreadyAnonymized: boolean;
}

/** Marca o registro como anonimizado — não é PII, então é seguro deixar visível/pesquisável. */
export const ANONYMIZED_CONTACT_NAME = '[titular anonimizado — LGPD]';

/**
 * Substitui `CopilotoTranscriptSegment.text` (não-nulável no schema — mesmo motivo de
 * `TimelineEvent.description` usar um placeholder em vez de `null`).
 */
export const ANONYMIZED_TRANSCRIPT_SEGMENT_TEXT = '[segmento de transcrição anonimizado — LGPD]';

/**
 * Anonimiza irreversivelmente os dados pessoais de um Contact (titular), a pedido do exercício do
 * direito de exclusão/anonimização do LGPD (Lei 13.709/2018, art. 18).
 *
 * Todas as mutações relacionais ocorrem dentro de uma transação interativa ACID
 * (`prisma.$transaction(async (tx) => { ... })`). Em caso de falha intermediária, nenhuma alteração
 * é commitada e o banco reverte ao estado original sem registros órfãos (DIV-AGENTE-21-001 / B-13).
 */
export async function eraseDataSubject(target: ErasureTarget): Promise<ErasureResult> {
  return requestContext.run(
    { tenantId: target.organizationId, userId: target.actorUserId },
    async () => {
      // 1. Executa todas as alterações de banco atomicamente dentro de prisma.$transaction
      const txRunner = typeof prisma.$transaction === 'function'
        ? (fn: (tx: any) => Promise<any>) => prisma.$transaction(fn)
        : (fn: (tx: any) => Promise<any>) => fn(prisma);

      const dbResult = await txRunner(async (tx) => {
        const contact = await tx.contact.findFirst({
          where: { id: target.contactId, organizationId: target.organizationId },
        });
        if (!contact) {
          throw new Error(
            `Contato ${target.contactId} não encontrado na organização ${target.organizationId}.`,
          );
        }

        const alreadyAnonymized = contact.name === ANONYMIZED_CONTACT_NAME;

        // Leads deste titular nesta organização
        const leads = await tx.lead.findMany({
          where: { contactId: target.contactId, organizationId: target.organizationId },
          select: { id: true },
        });
        const leadIds = leads.map((l: { id: string }) => l.id);

        // Supressão ANTES de destruir e-mail e telefone (DEBT-LGPD-001). Se o opt-out falhar,
        // a anonimização não começa: um retry ainda encontra os identificadores e nenhum canal
        // reabre o contato (B-13 e §27).
        const { toE164BR } = await import('../../lib/phone.js');
        const phoneE164 =
          contact.phone || contact.whatsapp
            ? toE164BR(contact.whatsapp ?? contact.phone ?? undefined)
            : null;
        const emailNormalized = contact.email ? contact.email.trim().toLowerCase() : null;

        if (leadIds.length > 0) {
          for (const leadId of leadIds) {
            await tx.optOutRecord.create({
              data: {
                organizationId: target.organizationId,
                scope: 'Global',
                leadId,
                email: emailNormalized,
                phoneE164,
                originChannel: 'manual',
                reason: 'LGPD Art. 18 - Direito de exclusão exercido pelo titular',
                evidence: 'Exercício de direito do titular sob LGPD',
                requestedBy: target.actorUserId ?? null,
              },
            });
          }
        } else if (emailNormalized || phoneE164) {
          await tx.optOutRecord.create({
            data: {
              organizationId: target.organizationId,
              scope: 'Global',
              leadId: null,
              email: emailNormalized,
              phoneE164,
              originChannel: 'manual',
              reason: 'LGPD Art. 18 - Direito de exclusão exercido pelo titular',
              evidence: 'Exercício de direito do titular sob LGPD',
              requestedBy: target.actorUserId ?? null,
            },
          });
        }

        if (!alreadyAnonymized) {
          await tx.contact.update({
            where: { id: target.contactId },
            data: {
              name: ANONYMIZED_CONTACT_NAME,
              phone: null,
              whatsapp: null,
              email: null,
              linkedin: null,
              birthDate: null,
              observations: null,
              customFields: {},
            },
          });
        }

        // Mensagens de WhatsApp guardam PII própria (telefone/conteúdo)
        const { count: whatsAppMessagesMasked } = await tx.whatsAppMessage.updateMany({
          where: { contactId: target.contactId, body: { not: null } },
          data: { body: null },
        });

        let conversationSignalsRedacted = 0;
        let timelineEventsRedacted = 0;
        let voiceCallLogsRedacted = 0;

        // Conversas do Copiloto Comercial IA ligadas a este titular
        const copilotoConversations = await tx.copilotoConversation.findMany({
          where: {
            organizationId: target.organizationId,
            OR: [
              { contactId: target.contactId },
              ...(leadIds.length > 0 ? [{ leadId: { in: leadIds } }] : []),
            ],
          },
          select: { id: true, audioObjectKey: true },
        });
        const copilotoConversationIds = copilotoConversations.map((c: { id: string }) => c.id);

        let copilotoTranscriptSegmentsRedacted = 0;
        let copilotoInsightsRedacted = 0;

        if (copilotoConversationIds.length > 0) {
          await tx.copilotoConversation.updateMany({
            where: {
              id: { in: copilotoConversationIds },
              organizationId: target.organizationId,
            },
            data: {
              audioObjectKey: null,
              audioDurationMs: null,
              audioSizeBytes: null,
              deletedAt: new Date(),
              deleteReason: 'LGPD Art. 18 - Titular Anonimizado',
            },
          });

          const { count: segmentsCount } = await tx.copilotoTranscriptSegment.updateMany({
            where: {
              conversationId: { in: copilotoConversationIds },
              organizationId: target.organizationId,
            },
            data: {
              text: ANONYMIZED_TRANSCRIPT_SEGMENT_TEXT,
              speakerLabel: null,
            },
          });
          copilotoTranscriptSegmentsRedacted = segmentsCount;

          const { count: insightsCount } = await tx.copilotoInsight.updateMany({
            where: {
              conversationId: { in: copilotoConversationIds },
              organizationId: target.organizationId,
            },
            data: { valueJson: {} },
          });
          copilotoInsightsRedacted = insightsCount;

          await tx.copilotoCrmFieldSuggestion.updateMany({
            where: {
              conversationId: { in: copilotoConversationIds },
              organizationId: target.organizationId,
            },
            data: {
              previousValue: null,
              suggestedValue: '[valor anonimizado — LGPD]',
            },
          });

          await tx.copilotoCoachingEvaluation.updateMany({
            where: {
              conversationId: { in: copilotoConversationIds },
              organizationId: target.organizationId,
            },
            data: {
              rubricJson: {},
              overallScore: 0,
            },
          });
        }

        if (leadIds.length > 0) {
          const { count: signalsCount } = await tx.conversationSignal.updateMany({
            where: { leadId: { in: leadIds }, organizationId: target.organizationId },
            data: {
              summary: null,
              nextStep: null,
              objections: [],
              rawModelOutput: {},
            },
          });
          conversationSignalsRedacted = signalsCount;

          const { count: timelineCount } = await tx.timelineEvent.updateMany({
            where: { leadId: { in: leadIds } },
            data: { description: '[evento anonimizado — LGPD]' },
          });
          timelineEventsRedacted = timelineCount;

          const { count: voiceCallLogsCount } = await tx.voiceCallLog.updateMany({
            where: { leadId: { in: leadIds }, organizationId: target.organizationId },
            data: {
              transcript: null,
              summary: null,
              recordingUrl: null,
            },
          });
          voiceCallLogsRedacted = voiceCallLogsCount;

          // DEBT-LGPD-002: Localiza e anonimiza memórias conversacionais de agentes (AgentMemory)
          for (const leadId of leadIds) {
            await tx.agentMemory.updateMany({
              where: {
                organizationId: target.organizationId,
                sessionId: { contains: `lead_${leadId}` },
              },
              data: {
                messages: [],
              },
            });
          }
        }

        // Anonimiza também memórias de agentes com chave direta de titular
        await tx.agentMemory.updateMany({
          where: {
            organizationId: target.organizationId,
            contactId: target.contactId,
          },
          data: {
            messages: [],
          },
        });

        // 2. Registro de auditoria imutável (sem PII direta) comprovando data, hora e hash do titular expurgado
        if (tx.auditLog && typeof tx.auditLog.create === 'function') {
          const subjectHash = createHash('sha256')
            .update(`${target.organizationId}:${target.contactId}`)
            .digest('hex');

          await tx.auditLog.create({
            data: {
              action: 'ERASURE_LGPD_ART_18',
              entity: 'Contact',
              entityId: target.contactId,
              actorId: target.actorUserId ?? null,
              tenantId: target.organizationId,
              details: JSON.stringify({
                subjectHash,
                whatsAppMessagesMasked,
                conversationSignalsRedacted,
                timelineEventsRedacted,
                voiceCallLogsRedacted,
                copilotoTranscriptSegmentsRedacted,
                copilotoInsightsRedacted,
                executedAt: new Date().toISOString(),
              }),
            },
          });
        }

        return {
          contactId: target.contactId,
          whatsAppMessagesMasked,
          conversationSignalsRedacted,
          timelineEventsRedacted,
          voiceCallLogsRedacted,
          copilotoTranscriptSegmentsRedacted,
          copilotoInsightsRedacted,
          alreadyAnonymized,
          copilotoConversations,
        };
      });

      // 3. Exclui fisicamente do Object Storage (MinIO/S3) os arquivos de áudio gravados (após commit da tx)
      let copilotoAudiosDeleted = 0;
      for (const conv of dbResult.copilotoConversations) {
        if (conv.audioObjectKey) {
          if (conv.audioObjectKey.startsWith(`copiloto-ia/${target.organizationId}/`)) {
            await deleteObject(conv.audioObjectKey);
            copilotoAudiosDeleted++;
          }
        }
      }

      // 4. Limpa chaves de cache no Redis associadas ao titular expurgado
      if (isRedisConfigured()) {
        try {
          const redis = getRedisClient();
          if (redis && typeof redis.del === 'function') {
            await redis.del(
              `contact:${target.organizationId}:${target.contactId}`,
              `titular:${target.contactId}`,
            );
          }
        } catch (cacheErr) {
          logger.warn({ cacheErr, contactId: target.contactId }, 'Falha não-bloqueante ao limpar cache Redis do titular');
        }
      }

      logger.info(
        {
          organizationId: target.organizationId,
          contactId: target.contactId,
          whatsAppMessagesMasked: dbResult.whatsAppMessagesMasked,
          conversationSignalsRedacted: dbResult.conversationSignalsRedacted,
          timelineEventsRedacted: dbResult.timelineEventsRedacted,
          voiceCallLogsRedacted: dbResult.voiceCallLogsRedacted,
          copilotoTranscriptSegmentsRedacted: dbResult.copilotoTranscriptSegmentsRedacted,
          copilotoInsightsRedacted: dbResult.copilotoInsightsRedacted,
          copilotoAudiosDeleted,
          alreadyAnonymized: dbResult.alreadyAnonymized,
        },
        '[lgpd] Titular anonimizado transacionalmente a pedido de exercício de direito (LGPD art. 18).',
      );

      return {
        contactId: dbResult.contactId,
        whatsAppMessagesMasked: dbResult.whatsAppMessagesMasked,
        conversationSignalsRedacted: dbResult.conversationSignalsRedacted,
        timelineEventsRedacted: dbResult.timelineEventsRedacted,
        voiceCallLogsRedacted: dbResult.voiceCallLogsRedacted,
        copilotoTranscriptSegmentsRedacted: dbResult.copilotoTranscriptSegmentsRedacted,
        copilotoInsightsRedacted: dbResult.copilotoInsightsRedacted,
        copilotoAudiosDeleted,
        alreadyAnonymized: dbResult.alreadyAnonymized,
      };
    },
  );
}
