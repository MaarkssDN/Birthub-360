import { createCipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { requestContext } from '../../lib/async-context.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';

export interface PortabilityRequest {
  organizationId: string;
  contactId: string;
  requestedByUserId?: string;
  encryptionPassword?: string;
}

export interface DataSubjectDossier {
  metadata: {
    exportId: string;
    organizationId: string;
    contactId: string;
    exportedAt: string;
    legalBasis: string;
    dataSubjectHash: string;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    birthDate: Date | null;
    observations: string | null;
    customFields: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
  leads: Array<{
    id: string;
    title: string | null;
    status: string;
    createdAt: Date;
  }>;
  whatsAppMessages: Array<{
    id: string;
    direction: string;
    body: string | null;
    receivedAt: Date;
  }>;
  voiceCalls: Array<{
    id: string;
    startedAt: Date;
    durationSeconds: number | null;
    outcome: string | null;
    transcript: string | null;
    summary: string | null;
  }>;
  copilotoConversations: Array<{
    id: string;
    startedAt: Date;
    transcriptSegments: Array<{
      speakerLabel: string | null;
      text: string;
      startMs: number;
      endMs: number;
    }>;
    insights: Array<{
      type: string;
      value: unknown;
    }>;
  }>;
  timelineEvents: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
  }>;
}

export interface PortabilityExportResult {
  dossier: DataSubjectDossier;
  jsonPackage: string;
  encryptedPackage?: {
    ciphertext: string;
    iv: string;
    tag: string;
    salt: string;
    algorithm: string;
  };
}

/**
 * Criptografa o payload do dossiê com AES-256-GCM para transporte seguro.
 */
function encryptPayload(
  payloadText: string,
  secretPassword: string,
): { ciphertext: string; iv: string; tag: string; salt: string; algorithm: string } {
  const salt = randomBytes(16);
  const key = scryptSync(secretPassword, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(payloadText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
    algorithm: 'aes-256-gcm',
  };
}

/**
 * Agrega e exporta todos os dados pessoais e históricos vinculados a um titular (Contact)
 * para cumprimento do Direito de Portabilidade dos Dados (LGPD Artigo 18, inciso V).
 *
 * Cobertura de entidades:
 * - Contact (dados cadastrais e custom fields)
 * - Lead(s) associados ao titular
 * - WhatsAppMessage (mensagens trocadas)
 * - VoiceCallLog (transcrições e sumários telefônicos)
 * - CopilotoConversation + CopilotoTranscriptSegment + CopilotoInsight
 * - TimelineEvent (eventos da jornada do lead)
 *
 * Exclui deliberadamente dados de terceiros, prompts internos de sistema e segredos organizacionais.
 */
export async function exportDataSubjectDossier(
  request: PortabilityRequest,
): Promise<PortabilityExportResult> {
  return requestContext.run(
    { tenantId: request.organizationId, userId: request.requestedByUserId },
    async () => {
      // 1. Busca os dados cadastrais centrais do contato
      const contact = await prisma.contact.findFirst({
        where: { id: request.contactId, organizationId: request.organizationId },
      });

      if (!contact) {
        throw new Error(
          `Contato ${request.contactId} não encontrado na organização ${request.organizationId}.`,
        );
      }

      // 2. Localiza todos os leads pertencentes a este titular na organização
      const leads = await prisma.lead.findMany({
        where: { contactId: request.contactId, organizationId: request.organizationId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      });
      const leadIds = leads.map((l) => l.id);

      // 3. Localiza histórico de WhatsApp vinculado diretamente ao contato
      const whatsAppMessages = await prisma.whatsAppMessage.findMany({
        where: { contactId: request.contactId },
        select: {
          id: true,
          direction: true,
          body: true,
          receivedAt: true,
        },
        orderBy: { receivedAt: 'asc' },
      });

      // 4. Localiza ligações de telefonia vinculadas aos leads deste titular
      let voiceCalls: Array<{
        id: string;
        startedAt: Date;
        durationSeconds: number | null;
        outcome: string | null;
        transcript: string | null;
        summary: string | null;
      }> = [];

      if (leadIds.length > 0) {
        const rawCalls = await prisma.voiceCallLog.findMany({
          where: {
            organizationId: request.organizationId,
            leadId: { in: leadIds },
          },
          select: {
            id: true,
            createdAt: true,
            durationSeconds: true,
            outcome: true,
            transcript: true,
            summary: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        voiceCalls = rawCalls.map((c) => ({
          id: c.id,
          startedAt: c.createdAt,
          durationSeconds: c.durationSeconds,
          outcome: c.outcome,
          transcript: c.transcript,
          summary: c.summary,
        }));
      }

      // 5. Localiza conversas e transcrições do Copiloto Comercial IA
      const copilotoConversationsRaw = await prisma.copilotoConversation.findMany({
        where: {
          organizationId: request.organizationId,
          OR: [
            { contactId: request.contactId },
            ...(leadIds.length > 0 ? [{ leadId: { in: leadIds } }] : []),
          ],
        },
        select: {
          id: true,
          createdAt: true,
          transcriptSegments: {
            select: {
              speakerLabel: true,
              text: true,
              startMs: true,
              endMs: true,
            },
            orderBy: { startMs: 'asc' },
          },
          insights: {
            select: {
              type: true,
              valueJson: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const copilotoConversations = copilotoConversationsRaw.map((conv) => ({
        id: conv.id,
        startedAt: conv.createdAt,
        transcriptSegments: (conv.transcriptSegments || []).map((seg) => ({
          speakerLabel: seg.speakerLabel,
          text: seg.text,
          startMs: seg.startMs,
          endMs: seg.endMs,
        })),
        insights: (conv.insights || []).map((ins) => ({
          type: ins.type,
          value: ins.valueJson,
        })),
      }));

      // 6. Timeline Events ligados aos leads
      let timelineEvents: Array<{
        id: string;
        type: string;
        description: string;
        createdAt: Date;
      }> = [];

      if (leadIds.length > 0) {
        timelineEvents = await prisma.timelineEvent.findMany({
          where: { leadId: { in: leadIds } },
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // 7. Compilação do Dossiê Estruturado
      const exportId = `portability-${randomBytes(8).toString('hex')}`;
      const dataSubjectHash = createHash('sha256')
        .update(`${request.organizationId}:${request.contactId}:${contact.email || contact.phone || ''}`)
        .digest('hex');

      const dossier: DataSubjectDossier = {
        metadata: {
          exportId,
          organizationId: request.organizationId,
          contactId: request.contactId,
          exportedAt: new Date().toISOString(),
          legalBasis: 'LGPD Lei 13.709/2018 - Artigo 18, Inciso V (Portabilidade de Dados)',
          dataSubjectHash,
        },
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          birthDate: contact.birthDate,
          observations: contact.observations,
          customFields: (contact.customFields as Record<string, unknown>) ?? {},
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        },
        leads,
        whatsAppMessages,
        voiceCalls,
        copilotoConversations,
        timelineEvents,
      };

      const jsonPackage = JSON.stringify(dossier, null, 2);

      let encryptedPackage: PortabilityExportResult['encryptedPackage'] | undefined;
      if (request.encryptionPassword && request.encryptionPassword.trim().length >= 8) {
        encryptedPackage = encryptPayload(jsonPackage, request.encryptionPassword);
      }

      // 8. Registro de Auditoria Imutável de Portabilidade
      if (prisma.auditLog && typeof prisma.auditLog.create === 'function') {
        try {
          await prisma.auditLog.create({
            data: {
              action: 'PORTABILITY_EXPORT_LGPD_ART_18',
              entity: 'Contact',
              entityId: request.contactId,
              actorId: request.requestedByUserId ?? null,
              tenantId: request.organizationId,
              details: JSON.stringify({
                exportId,
                dataSubjectHash,
                leadsCount: leads.length,
                whatsAppCount: whatsAppMessages.length,
                voiceCallsCount: voiceCalls.length,
                copilotoCount: copilotoConversations.length,
                encrypted: Boolean(encryptedPackage),
                exportedAt: dossier.metadata.exportedAt,
              }),
            },
          });
        } catch (auditErr) {
          logger.warn({ auditErr }, 'Falha ao gravar auditLog de portabilidade LGPD');
        }
      }

      logger.info(
        {
          exportId,
          organizationId: request.organizationId,
          contactId: request.contactId,
          encrypted: Boolean(encryptedPackage),
        },
        '[lgpd] Dossiê de portabilidade do titular gerado com sucesso.',
      );

      return {
        dossier,
        jsonPackage,
        encryptedPackage,
      };
    },
  );
}
