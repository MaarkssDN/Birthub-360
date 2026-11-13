import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { consentAuditChain } from '../../lib/security/consentChainFactory.js';
import { eraseDataSubject } from '../../shared/services/dataSubjectErasure.service.js';
import { exportDataSubjectDossier } from '../../shared/services/dataSubjectPortability.service.js';
import {
  checkOptOutStatus,
  assertOptOutStatus,
  recordContactOptOut,
  OptOutSuppressedError,
  isOptOutKeyword,
  type OptOutChannel,
  type OptOutCheckResult,
} from './services/optOutCheck.service.js';

export class LgpdService {
  /**
   * Apaga / Anonimiza dados de um titular (LGPD Art. 18)
   *
   * Além da anonimização transacional do PII (`eraseDataSubject`), encadeia a revogação do
   * consentimento na cadeia de auditoria (`ConsentAuditChain`, REMED-06): o evento REVOCATION +
   * a tarefa de expurgo (outbox `ConsentPurgeTask`) + crypto-shredding da chave do titular são
   * gravados na mesma transação da cadeia. Sem este elo, o titular tinha os dados apagados mas
   * o consentimento continuava "vivo" na cadeia — violando minimização e o direito de revogação
   * (art. 8º §5º). Best-effort DEPOIS do commit da anonimização: falha na cadeia nunca reverte
   * uma exclusão já concluída, mas fica registrada no log para reconciliação.
   */
  async eraseContact(organizationId: string, contactId: string, actorUserId?: string) {
    // O e-mail do titular é a `subjectRef` usada pela cadeia ao registrar consentimentos de
    // leads públicos (ver publicLead.service.ts). Precisa ser capturado ANTES da anonimização,
    // que zera `contact.email` — depois disso o vínculo com a cadeia seria impossível.
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: { email: true },
    });
    const titularEmail = contact?.email?.trim().toLowerCase() || null;

    const result = await eraseDataSubject({ organizationId, contactId, actorUserId });

    if (titularEmail) {
      try {
        await consentAuditChain.revokeConsent(
          organizationId,
          titularEmail,
          'ERASURE_REQUEST',
          actorUserId,
          // processNow padrão (true): tenta o expurgo imediatamente; se falhar, a tarefa fica
          // PENDING na outbox para o worker de reconciliação (startConsentPurgeRuntime).
        );
      } catch (err) {
        // A anonimização já foi commitada — não podemos "desfazer". A revogação pendente é
        // registrada para reconciliação manual/operacional; o AuditLog da rota já prova a
        // exclusão. Log sem PII (só ids).
        logger.error(
          { err, organizationId, contactId },
          '[LGPD] Falha ao revogar consentimento na cadeia após exclusão do titular — reconciliar manualmente',
        );
      }
    } else {
      logger.warn(
        { organizationId, contactId },
        '[LGPD] Titular sem e-mail: revogação na cadeia de consentimento não aplicável (subjectRef é e-mail)',
      );
    }

    return result;
  }

  /**
   * Verifica se o contato está bloqueado por opt-out antes de qualquer disparo.
   */
  async checkOptOut(contactId: string, channel: OptOutChannel, organizationId: string) {
    return await checkOptOutStatus(contactId, channel, organizationId);
  }

  /**
   * Registra opt-out instantâneo para o contato e seus canais/leads.
   */
  async recordOptOut(input: {
    organizationId: string;
    contactId: string;
    channel?: OptOutChannel;
    scope?: 'global' | 'email' | 'whatsapp' | 'voice';
    originChannel: string;
    reason?: string;
    evidence?: string;
    actorUserId?: string;
  }) {
    return await recordContactOptOut(input);
  }

  /**
   * Exporta os dados do titular para portabilidade (LGPD Art. 18, inciso V).
   *
   * Delega ao `exportDataSubjectDossier` (shared/services), que cobre TODAS as categorias de
   * dados pessoais do titular: cadastro + customFields, leads, mensagens WhatsApp, ligações de
   * voz (transcrição/resumo), conversas do Copiloto IA (transcrições e insights), timeline de
   * eventos — com trilha de auditoria própria e opção de pacote criptografado AES-256-GCM.
   * A versão anterior deste método retornava um recorte incompleto (sem voz, copiloto, timeline
   * nem corpo das mensagens) — a rota existia mas a portabilidade não era de fato atendida.
   */
  async exportContactData(
    organizationId: string,
    contactId: string,
    options?: { requestedByUserId?: string; encryptionPassword?: string },
  ) {
    const result = await exportDataSubjectDossier({
      organizationId,
      contactId,
      requestedByUserId: options?.requestedByUserId,
      encryptionPassword: options?.encryptionPassword,
    });

    logger.info(
      {
        organizationId,
        contactId,
        exportId: result.dossier.metadata.exportId,
        encrypted: Boolean(result.encryptedPackage),
      },
      '[LGPD] Exportação de portabilidade do titular realizada',
    );

    return result;
  }
}

export const lgpdService = new LgpdService();

export {
  checkOptOutStatus,
  assertOptOutStatus,
  recordContactOptOut,
  OptOutSuppressedError,
  isOptOutKeyword,
  type OptOutChannel,
  type OptOutCheckResult,
};
