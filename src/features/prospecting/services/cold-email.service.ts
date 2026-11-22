import { MailerNotConfiguredError, sendEmail } from '../../../lib/email/mailer.js';
import { logger } from '../../../lib/logger.js';
import { toE164BR } from '../../../lib/phone.js';
import { isOptedOut } from '../../cadence/application/optOutService.js';
import { prismaOptOutRepository } from '../../cadence/infra/PrismaOptOutRepository.js';
import { resolveEmailStatus } from './enrichment/domainGuess.js';

export interface ColdEmailCampaign {
  id: string;
  targetEmail: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  legalBasis: 'legitimate_interest' | 'consent';
  dataSource: string;
  /**
   * Tenant do disparo. Obrigatório para checar opt-out unificado antes do envio (ver
   * `.agents/handoffs/onda-7/17-para-05-06-12-contrato-optout.md`) — sem isso não é possível
   * consultar `OptOutRecord` de forma isolada por organização.
   */
  organizationId: string;
  /** Quando o alvo já é um lead do CRM — casamento mais forte no opt-out unificado (ver contrato). */
  leadId?: string | null;
  /**
   * Telefone bruto do mesmo contato, quando já carregado pelo chamador. Necessário para que um
   * opt-out registrado por voz/WhatsApp (mesmo lead, canal diferente) também bloqueie este
   * e-mail — é o "ponto crítico" do contrato do Agente 17: passar `email` E `phoneE164` sempre
   * que ambos já estiverem disponíveis, mesmo que o envio em si só use o e-mail.
   */
  contactPhone?: string | null;
}

/** Domínio do e-mail, para log — nunca o endereço completo (PII em texto puro). */
function emailDomain(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const at = email.lastIndexOf('@');
  return at === -1 ? undefined : email.slice(at + 1);
}

/**
 * Envia um cold email de prospecção via SMTP (mesmo transporte real de src/lib/email/mailer.ts,
 * já usado por aiPendingAction.service.ts e src/lib/auth.ts).
 *
 * Correções sobre a versão anterior:
 * 1. Honestidade: antes, a função só validava os campos, LOGAVA sucesso e retornava `true` SEM
 *    enviar nada — não existia nenhum transporte real aqui. O chamador (rota
 *    POST /api/prospecting/cold-email) respondia "Email sent" para uma campanha que nunca saiu do
 *    processo. Agora só retorna `true` quando o e-mail foi de fato entregue ao servidor SMTP; sem
 *    SMTP_HOST configurado (`MailerNotConfiguredError`), bloqueado por opt-out, ou com qualquer
 *    falha de envio, retorna `false` — o chamador (fora do escopo desta correção, ver nota abaixo)
 *    já trata `false` como falha e responde 500, o que pelo menos é uma falha REAL em vez de um
 *    sucesso fictício.
 * 2. PII em log: `to: campaign.targetEmail` gravava o endereço completo do titular em texto puro
 *    no log estruturado. Agora só o domínio do e-mail é logado (nunca o endereço completo).
 * 3. Opt-out unificado (bloqueador LGPD, `.agents/handoffs/onda-7/17-para-05-06-12-contrato-optout.md`):
 *    antes de qualquer envio real, consulta `OptOutRecord` via `isOptedOut`. Um opt-out registrado
 *    em QUALQUER canal (voz, WhatsApp, e-mail) para o mesmo lead/e-mail/telefone bloqueia este
 *    disparo quando `scope` é `'global'` ou `'email'`. A tentativa bloqueada nunca é tratada como
 *    enviada — mesma disciplina de honestidade do item 1 acima (commit `2e42a557`).
 * 4. Verificação de entregabilidade (auditoria da plataforma): antes desta correção, um e-mail
 *    sintaticamente válido mas sem domínio real (sem registro MX) ainda recebia o disparo real,
 *    gerando bounce e custo de reputação de domínio — `resolveEmailStatus` (mesma verificação já
 *    usada em `enrichment.service.ts`/`enrichmentCascade.service.ts` ao salvar Contact) roda antes
 *    do envio; `emailStatus === 'invalid'` bloqueia o disparo com a mesma disciplina de honestidade
 *    do opt-out (nunca tratado como enviado).
 *
 * NOTA para o handoff: o ideal de UX (distinguir "não enviado por falta de config"/"bloqueado por
 * opt-out" de "falhou de verdade", sem responder 500 para os dois primeiros casos) exige mudar como
 * src/features/prospecting/routes/prospecting.routes.ts interpreta o retorno desta função — esse
 * arquivo está fora do escopo de arquivos deste agente.
 */
export async function sendColdEmail(campaign: ColdEmailCampaign): Promise<boolean> {
  const toDomain = emailDomain(campaign.targetEmail);
  try {
    if (!campaign.targetEmail || !campaign.subject || !campaign.body) {
      throw new Error('Missing required fields for cold email.');
    }

    if (!campaign.legalBasis || !campaign.dataSource) {
      throw new Error('LGPD compliance requires legal basis and data source for cold outreach.');
    }

    if (!campaign.organizationId) {
      throw new Error('organizationId é obrigatório para checar opt-out antes do envio.');
    }

    // Ponto crítico do contrato: passar leadId + email + phoneE164 sempre que disponíveis —
    // é assim que um opt-out registrado por voz/WhatsApp do mesmo lead bloqueia este e-mail,
    // sem exigir uma tabela de resolução de identidade separada (ver domain/optOut.ts).
    const blocked = await isOptedOut(
      prismaOptOutRepository,
      campaign.organizationId,
      {
        leadId: campaign.leadId ?? null,
        email: campaign.targetEmail,
        phoneE164: toE164BR(campaign.contactPhone ?? undefined),
      },
      'email',
    );

    if (blocked) {
      // Nunca registrar/tratar como enviado — a tentativa foi pulada (skipped) por opt-out.
      logger.info(
        { campaignId: campaign.id, toDomain, reason: 'opt-out' },
        'Cold email não enviado: titular optou por não receber contato neste canal (opt-out).',
      );
      return false;
    }

    const emailStatus = await resolveEmailStatus(campaign.targetEmail);
    if (emailStatus === 'invalid') {
      // Mesma disciplina de honestidade do opt-out acima — nunca tratado como enviado.
      logger.info(
        { campaignId: campaign.id, toDomain, reason: 'invalid-email' },
        'Cold email não enviado: e-mail sem domínio/MX válido (checkEmailDeliverability).',
      );
      return false;
    }

    await sendEmail({ to: campaign.targetEmail, subject: campaign.subject, text: campaign.body });

    logger.info(
      { campaignId: campaign.id, toDomain, basis: campaign.legalBasis },
      'Cold email enviado',
    );
    return true;
  } catch (error: any) {
    if (error instanceof MailerNotConfiguredError) {
      logger.warn(
        { campaignId: campaign.id, toDomain },
        'Cold email não enviado: SMTP não configurado neste ambiente.',
      );
      return false;
    }
    logger.error({ err: error, campaignId: campaign.id, toDomain }, 'Failed to send cold email');
    return false;
  }
}

/** Resultado por campanha dentro de um disparo em lote. */
export type ColdEmailBatchOutcome = 'sent' | 'failed' | 'opt-out-suppressed' | 'invalid';

export interface ColdEmailBatchItemResult {
  campaignId: string;
  outcome: ColdEmailBatchOutcome;
}

export interface ColdEmailBatchResult {
  total: number;
  /** Campanhas que passaram no filtro de opt-out e tiveram o envio efetivamente tentado. */
  eligibleCount: number;
  /** Campanhas bloqueadas pelo filtro de opt-out na entrada — nunca chegam ao envio. */
  suppressedCount: number;
  sentCount: number;
  failedCount: number;
  results: ColdEmailBatchItemResult[];
}

/**
 * Ponto de entrada para disparo de cold email em LOTE (importações/listas de prospecção —
 * BT360-DT-0028 / TAREFA-SANEAMENTO-020). Antes desta correção, a única forma de disparar era
 * `sendColdEmail` item a item: a checagem de opt-out vivia só na borda do envio, então uma lista
 * inteira entrava no funil sem nenhuma visibilidade prévia de quantos contatos eram elegíveis —
 * e um titular suprimido só era descoberto no momento do disparo (ou nem isso, se o chamador
 * esquecesse de chamar `sendColdEmail`).
 *
 * Aqui o opt-out vira filtro SANITIZADOR na entrada:
 * 1. TODAS as campanhas da lista são consultadas contra `OptOutRecord` ANTES de qualquer envio;
 * 2. as suprimidas recebem outcome 'opt-out-suppressed' e nunca chegam ao transporte;
 * 3. campanhas sem `organizationId` são fail-closed ('invalid') — sem tenant não há como
 *    consultar a supressão, então não são elegíveis;
 * 4. se a consulta ao supressor falhar, o erro PROPAGA (sem fallback silencioso que trataria
 *    "não consegui verificar" como "está liberado" — LGPD exige o contrário);
 * 5. as elegíveis são enviadas via `sendColdEmail`, que mantém sua própria checagem de borda
 *    (defesa em profundidade: a lista pode ter sido montada antes de um opt-out novo chegar).
 *
 * Contagens agregadas ficam visíveis no retorno e no log — sem PII (só IDs de campanha e
 * domínios de e-mail, mesma disciplina de `sendColdEmail`).
 */
export async function sendColdEmailBatch(
  campaigns: ColdEmailCampaign[],
): Promise<ColdEmailBatchResult> {
  const total = campaigns.length;
  const results: ColdEmailBatchItemResult[] = [];
  const eligible: ColdEmailCampaign[] = [];

  // Etapa 1 — filtro sanitizador: opt-out verificado para a lista inteira antes de qualquer envio.
  for (const campaign of campaigns) {
    if (!campaign.organizationId) {
      results.push({ campaignId: campaign.id, outcome: 'invalid' });
      continue;
    }
    const blocked = await isOptedOut(
      prismaOptOutRepository,
      campaign.organizationId,
      {
        leadId: campaign.leadId ?? null,
        email: campaign.targetEmail,
        phoneE164: toE164BR(campaign.contactPhone ?? undefined),
      },
      'email',
    );
    if (blocked) {
      results.push({ campaignId: campaign.id, outcome: 'opt-out-suppressed' });
    } else {
      eligible.push(campaign);
    }
  }

  const suppressedCount = results.filter((r) => r.outcome === 'opt-out-suppressed').length;
  const invalidCount = results.filter((r) => r.outcome === 'invalid').length;
  const eligibleCount = eligible.length;

  // Etapa 2 — envio apenas dos elegíveis, em sequência (mesma disciplina de honestidade de
  // sendColdEmail: cada item reporta seu próprio outcome real).
  for (const campaign of eligible) {
    const sent = await sendColdEmail(campaign);
    results.push({ campaignId: campaign.id, outcome: sent ? 'sent' : 'failed' });
  }

  const sentCount = results.filter((r) => r.outcome === 'sent').length;
  const failedCount = results.filter((r) => r.outcome === 'failed').length;

  logger.info(
    { total, eligibleCount, suppressedCount, invalidCount, sentCount, failedCount },
    'Cold email em lote: filtro de opt-out aplicado na entrada.',
  );

  return { total, eligibleCount, suppressedCount, sentCount, failedCount, results };
}
