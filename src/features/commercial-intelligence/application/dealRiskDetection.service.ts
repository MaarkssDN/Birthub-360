import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LeadStatus } from '@prisma/client';
import { cleanAndParseJson, getAiModel, logAiUsage } from '../../../lib/ai/gateway.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import { notificationService } from '../../notifications/notification.service.js';
import type { LiveCallInsight } from '../domain/CommercialIntelligence.js';

/**
 * Detecção de deal em risco (item 5 de "IA Agêntica de Vendas"): três sinais — silêncio do lead,
 * mudança de tom na conversa e menção de concorrente — geram um alerta direto ao(s) gestor(es) da
 * organização, antes da perda ser registrada.
 *
 * Na Onda 15, integra eventos em tempo real de chamadas telefônicas/WebRTC (`LiveCallInsight`),
 * permitindo reação imediata a objeções graves, concorrentes citados e sentimento negativo.
 *
 * Escopo deliberado desta versão: os sinais de tom/concorrente NÃO viram coluna nova em
 * `ConversationSignal` (schema é propriedade exclusiva do Agente 01 — ver AGENTS.md raiz) nem
 * tocam `conversation-intelligence.service.ts` (propriedade exclusiva do Agente 06, coordenação
 * de IA com o Agente 07 — ver `src/features/integrations/AGENTS.md`). Em vez disso, é uma
 * segunda leitura independente, própria deste serviço, sobre as mesmas `WhatsAppMessage` já
 * persistidas e sobre eventos de `LiveCallInsight`. O alerta em si usa `notificationService`.
 */

const OPEN_STATUSES_EXCLUDED: LeadStatus[] = [
  'Negocios_Ganhos',
  'Negocios_Perdidos',
  'Lead_Desqualificado',
];
const SILENCE_THRESHOLD_DAYS = 5;
const ALERT_COOLDOWN_HOURS = 48;
const MAX_LEADS_SCANNED_FOR_SILENCE = 200;
/** Teto de leads por rodada de análise de tom/concorrente — controla custo/latência de uma única
 * chamada de IA em lote, não a qualidade do sinal (leads fora do teto entram na próxima rodada). */
const MAX_LEADS_SCANNED_FOR_CONVERSATION = 15;
const RECENT_MESSAGE_WINDOW_HOURS = 24;
const MESSAGES_PER_LEAD_ANALYZED = 6;

export type DealRiskReason =
  | 'silencio'
  | 'tom_negativo'
  | 'concorrente_mencionado'
  | 'objecao_chamada'
  | 'sentimento_negativo_chamada';

export interface RiskCandidate {
  leadId: string;
  reason: DealRiskReason;
  detail: string;
}

export interface DetectDealRisksResult {
  scanned: number;
  alertsCreated: number;
  skippedCooldown: number;
  errors: number;
}

interface ConversationAnalysis {
  toneNegative: boolean;
  competitorMentioned: string | null;
}

function titlePrefix(reason: DealRiskReason): string {
  if (reason === 'silencio') return 'Risco de perda — silêncio do lead';
  if (reason === 'tom_negativo') return 'Risco de perda — mudança de tom';
  if (reason === 'sentimento_negativo_chamada')
    return 'Risco de perda — sentimento negativo em chamada';
  if (reason === 'objecao_chamada') return 'Risco de perda — objeção crítica em chamada';
  return 'Risco de perda — concorrente mencionado';
}

async function findSilentLeads(organizationId: string, now: Date): Promise<RiskCandidate[]> {
  const cutoff = new Date(now.getTime() - SILENCE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: {
      organizationId,
      status: { notIn: OPEN_STATUSES_EXCLUDED },
      OR: [
        { lastInteraction: { lte: cutoff } },
        { lastInteraction: null, createdAt: { lte: cutoff } },
      ],
    },
    take: MAX_LEADS_SCANNED_FOR_SILENCE,
    select: {
      id: true,
      lastInteraction: true,
      createdAt: true,
      company: { select: { tradeName: true } },
    },
  });

  return leads.map((lead) => {
    const since = lead.lastInteraction ?? lead.createdAt;
    const days = Math.floor((now.getTime() - since.getTime()) / (24 * 60 * 60 * 1000));
    return {
      leadId: lead.id,
      reason: 'silencio' as const,
      detail: `${lead.company?.tradeName ?? 'Lead sem empresa identificada'} — sem interação há ${days} dias.`,
    };
  });
}

async function findLeadsWithRecentInbound(organizationId: string, now: Date): Promise<string[]> {
  const since = new Date(now.getTime() - RECENT_MESSAGE_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = await prisma.whatsAppMessage.findMany({
    where: {
      organizationId,
      direction: 'inbound',
      receivedAt: { gte: since },
      leadId: { not: null },
    },
    orderBy: { receivedAt: 'desc' },
    distinct: ['leadId'],
    take: MAX_LEADS_SCANNED_FOR_CONVERSATION,
    select: { leadId: true },
  });
  return rows.map((row) => row.leadId).filter((id): id is string => Boolean(id));
}

async function loadRecentConversation(organizationId: string, leadId: string): Promise<string> {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { organizationId, leadId },
    orderBy: { receivedAt: 'desc' },
    take: MESSAGES_PER_LEAD_ANALYZED,
    select: { direction: true, body: true },
  });
  return messages
    .reverse()
    .map(
      (message) =>
        `${message.direction === 'inbound' ? 'Lead' : 'Vendedor'}: ${message.body?.trim() || '(mídia/anexo)'}`,
    )
    .join('\n');
}

async function findConversationRisks(organizationId: string, now: Date): Promise<RiskCandidate[]> {
  const leadIds = await findLeadsWithRecentInbound(organizationId, now);
  if (leadIds.length === 0) return [];

  const conversations = await Promise.all(
    leadIds.map(async (leadId) => ({
      leadId,
      text: await loadRecentConversation(organizationId, leadId),
    })),
  );

  const system = `Você analisa conversas de WhatsApp entre um vendedor e um lead comercial B2B. Para CADA conversa numerada abaixo, avalie SOMENTE o que está escrito — nunca invente.

Responda com um array JSON, na MESMA ORDEM das conversas recebidas, um item por conversa:
[
  {
    "toneNegative": true ou false — true SOMENTE se o lado do LEAD demonstrar claramente frustração, insatisfação ou tom hostil nas mensagens mais recentes (não é "toneNegative" só por objeção comercial normal, tipo pedir desconto),
    "competitorMentioned": nome do concorrente EXATAMENTE como mencionado pelo lead, ou null se nenhum concorrente foi citado — nunca invente um nome que não apareça no texto
  }
]`;

  const human = `Conversas (${conversations.length}):\n${JSON.stringify(
    conversations.map((c, i) => ({ conversa: i + 1, mensagens: c.text })),
    null,
    2,
  )}`;

  const model = getAiModel('local-llama3-fast', 0.1, 'deal-risk-detection');
  const startTime = Date.now();

  try {
    const response = await model.invoke([new SystemMessage(system), new HumanMessage(human)]);
    await logAiUsage({
      model: response.response_metadata.model,
      usage: response.response_metadata.tokenUsage,
      latencyMs: Date.now() - startTime,
      promptId: 'deal-risk-detection',
    });

    const results = cleanAndParseJson<ConversationAnalysis[]>(response.content);
    if (!Array.isArray(results) || results.length !== conversations.length) {
      logger.warn(
        { organizationId, expected: conversations.length, got: results?.length },
        'Detecção de risco de deal: IA devolveu formato inesperado, descartando esta rodada de análise de tom/concorrente.',
      );
      return [];
    }

    const candidates: RiskCandidate[] = [];
    conversations.forEach((conversation, index) => {
      const analysis = results[index];
      if (analysis.toneNegative) {
        candidates.push({
          leadId: conversation.leadId,
          reason: 'tom_negativo',
          detail: 'Tom negativo/frustrado detectado nas mensagens mais recentes do WhatsApp.',
        });
      }
      if (analysis.competitorMentioned) {
        candidates.push({
          leadId: conversation.leadId,
          reason: 'concorrente_mencionado',
          detail: `Concorrente mencionado pelo lead: "${analysis.competitorMentioned}".`,
        });
      }
    });
    return candidates;
  } catch (error: any) {
    logger.error(
      { err: error, organizationId },
      'Falha ao analisar tom/concorrente das conversas recentes.',
    );
    return [];
  }
}

/** Não repete o mesmo alerta pro mesmo lead+motivo dentro da janela de cooldown. */
async function isWithinCooldown(
  organizationId: string,
  leadId: string,
  reason: DealRiskReason,
  now: Date,
): Promise<boolean> {
  return isCoolingDown(await loadRecentDealRiskAlerts(organizationId, now), leadId, reason);
}

/**
 * Janela de cooldown do alerta de risco — UMA query para a organização inteira (entity 'Lead',
 * `createdAt` dentro das últimas `ALERT_COOLDOWN_HOURS`). Antes da correção de N+1, cada
 * candidato da rodada pagava um `notification.findFirst` sequencial (até ~215 candidatos × 1
 * query cada, mais um `user.findMany` por notificação em `notifyManagers`).
 */
async function loadRecentDealRiskAlerts(
  organizationId: string,
  now: Date,
): Promise<Array<{ entityId: string | null; title: string }>> {
  const cutoff = new Date(now.getTime() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
  return prisma.notification.findMany({
    where: { organizationId, entity: 'Lead', createdAt: { gte: cutoff } },
    select: { entityId: true, title: true },
  });
}

/** Mesma regra de `isWithinCooldown`, mas sobre o lote já carregado — sem I/O. */
function isCoolingDown(
  recentAlerts: ReadonlyArray<{ entityId: string | null; title: string }>,
  leadId: string,
  reason: DealRiskReason,
): boolean {
  const prefix = titlePrefix(reason);
  return recentAlerts.some((a) => a.entityId === leadId && a.title.startsWith(prefix));
}

/** Gestores/admins reais da organização — carregados UMA vez por rodada (ver `detectDealRisks`). */
async function loadManagers(organizationId: string): Promise<Array<{ id: string }>> {
  return prisma.user.findMany({
    where: { organizationId, role: { in: ['ADMIN', 'GESTOR'] } },
    select: { id: true },
  });
}

/** Alerta vai para os gestores/admins reais da organização, um por pessoa — nunca broadcast
 * silencioso quando existe destinatário certo. Só cai no broadcast (toda a organização) se a
 * organização genuinamente não tiver nenhum ADMIN/GESTOR cadastrado. */
async function notifyManagers(
  organizationId: string,
  candidate: RiskCandidate,
  managers?: Array<{ id: string }>,
): Promise<void> {
  // `managers` pré-carregado pelo chamador em lote (`detectDealRisks`) evita um `user.findMany`
  // por candidato; omitido, mantém o comportamento anterior (usado por `ingestLiveCallInsight`,
  // que processa no máximo alguns candidatos por chamada ao vivo).
  const recipients = managers ?? (await loadManagers(organizationId));

  const title = `${titlePrefix(candidate.reason)}`;
  if (recipients.length === 0) {
    await notificationService.create({
      organizationId,
      title,
      body: candidate.detail,
      kind: 'Alerta',
      entity: 'Lead',
      entityId: candidate.leadId,
    });
    return;
  }

  await Promise.all(
    recipients.map((manager) =>
      notificationService.create({
        organizationId,
        title,
        body: candidate.detail,
        kind: 'Alerta',
        entity: 'Lead',
        entityId: candidate.leadId,
        userId: manager.id,
      }),
    ),
  );
}

/**
 * Avalia um LiveCallInsight recebido em tempo real e identifica potenciais candidatos a risco.
 * Mapeia sentimento negativo, menção a concorrente e objeções comerciais críticas.
 */
export function evaluateLiveCallInsightRisk(insight: LiveCallInsight): RiskCandidate[] {
  const candidates: RiskCandidate[] = [];

  // 1. Sentimento negativo: se a escala for [-1, 1], negativo < -0.15; se for [0, 100], negativo < 45
  const isNegative =
    (insight.sentimentScore <= 1 && insight.sentimentScore < -0.15) ||
    (insight.sentimentScore > 1 && insight.sentimentScore < 45);

  if (isNegative) {
    candidates.push({
      leadId: insight.dealId,
      reason: 'sentimento_negativo_chamada',
      detail: `Sentimento negativo detectado em chamada ao vivo (${insight.callId}): score ${insight.sentimentScore}.`,
    });
  }

  // 2. Concorrente citado na chamada
  if (insight.competitorMentioned || insight.objectionCategory?.toLowerCase() === 'concorrente') {
    const competitor = insight.competitorMentioned ?? 'Concorrente';
    candidates.push({
      leadId: insight.dealId,
      reason: 'concorrente_mencionado',
      detail: `Concorrente mencionado durante chamada (${insight.callId}): "${competitor}".${
        insight.suggestedRebuttal ? ` Sugestão de contorno: "${insight.suggestedRebuttal}"` : ''
      }`,
    });
  }

  // 3. Objeção crítica levantada, exceto quando classificada como concorrente
  if (insight.objectionCategory && insight.objectionCategory.toLowerCase() !== 'concorrente') {
    candidates.push({
      leadId: insight.dealId,
      reason: 'objecao_chamada',
      detail: `Objeção detectada em chamada ao vivo (${insight.callId}): categoria "${insight.objectionCategory}".${
        insight.suggestedRebuttal ? ` Sugestão de contorno: "${insight.suggestedRebuttal}"` : ''
      }`,
    });
  }

  return candidates;
}

export interface IngestLiveCallInsightResult {
  candidates: RiskCandidate[];
  alertsCreated: number;
  skippedCooldown: number;
}

/**
 * Ingestão reativa de um insight de chamada ao vivo (Onda 15).
 * Identifica riscos de fechamento, filtra por cooldown e notifica gestores imediatamente.
 */
export async function ingestLiveCallInsight(
  organizationId: string,
  insight: LiveCallInsight,
  now: Date = new Date(),
  options: { notify?: boolean } = { notify: true },
): Promise<IngestLiveCallInsightResult> {
  const candidates = evaluateLiveCallInsightRisk(insight);
  let alertsCreated = 0;
  let skippedCooldown = 0;

  for (const candidate of candidates) {
    const inCooldown = await isWithinCooldown(
      organizationId,
      candidate.leadId,
      candidate.reason,
      now,
    );

    if (inCooldown) {
      skippedCooldown++;
      continue;
    }

    if (options.notify !== false) {
      await notifyManagers(organizationId, candidate);
      alertsCreated++;
    }
  }

  return { candidates, alertsCreated, skippedCooldown };
}

/**
 * Sumário executivo da negociação integrando dados comerciais e insights de chamadas ao vivo.
 */
export interface DealNegotiationExecutiveSummary {
  dealId: string;
  title?: string | null;
  amount: number;
  stageName?: string | null;
  healthScore: number;
  riskStatus: 'baixo_risco' | 'atencao' | 'alto_risco';
  sentimentLabel: 'positivo' | 'neutro' | 'negativo' | 'sem_chamadas';
  activeObjections: { category: string; suggestedRebuttal: string | null }[];
  competitorsMentioned: string[];
  executiveTakeaway: string;
}

export function buildDealNegotiationExecutiveSummary(
  deal: {
    id: string;
    title?: string | null;
    amount: number;
    stageName?: string | null;
    probability?: number | null;
  },
  liveInsights: LiveCallInsight[] = [],
): DealNegotiationExecutiveSummary {
  const competitors: string[] = [];
  const activeObjections: { category: string; suggestedRebuttal: string | null }[] = [];

  let totalSentiment = 0;
  for (const insight of liveInsights) {
    const normalizedSentiment =
      insight.sentimentScore > 1 ? (insight.sentimentScore - 50) / 50 : insight.sentimentScore;
    totalSentiment += normalizedSentiment;

    if (insight.competitorMentioned && !competitors.includes(insight.competitorMentioned)) {
      competitors.push(insight.competitorMentioned);
    }
    if (insight.objectionCategory) {
      activeObjections.push({
        category: insight.objectionCategory,
        suggestedRebuttal: insight.suggestedRebuttal ?? null,
      });
    }
  }

  const avgSentiment = liveInsights.length > 0 ? totalSentiment / liveInsights.length : 0;
  const sentimentLabel: DealNegotiationExecutiveSummary['sentimentLabel'] =
    liveInsights.length === 0
      ? 'sem_chamadas'
      : avgSentiment > 0.2
        ? 'positivo'
        : avgSentiment < -0.15
          ? 'negativo'
          : 'neutro';

  // Base de probabilidade ou 50 como fallback
  let healthScore = deal.probability ?? 50;
  if (sentimentLabel === 'negativo') healthScore -= 20;
  if (sentimentLabel === 'positivo') healthScore += 15;
  healthScore -= Math.min(25, activeObjections.length * 8);
  if (competitors.length > 0) healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  const riskStatus: DealNegotiationExecutiveSummary['riskStatus'] =
    healthScore >= 70 ? 'baixo_risco' : healthScore >= 40 ? 'atencao' : 'alto_risco';

  let executiveTakeaway = `Negociação "${deal.title ?? deal.id}" em estágio ${deal.stageName ?? 'em andamento'}. `;
  if (riskStatus === 'alto_risco') {
    executiveTakeaway += `Risco elevado detectado (Score ${healthScore}/100). `;
  } else if (riskStatus === 'atencao') {
    executiveTakeaway += `Negociação requer acompanhamento ativo (Score ${healthScore}/100). `;
  } else {
    executiveTakeaway += `Negociação com boa saúde e tração positiva (Score ${healthScore}/100). `;
  }

  if (competitors.length > 0) {
    executiveTakeaway += `Concorrente(s) citado(s): ${competitors.join(', ')}. `;
  }
  if (activeObjections.length > 0) {
    executiveTakeaway += `${activeObjections.length} objeção(ões) registrada(s). `;
  }

  return {
    dealId: deal.id,
    title: deal.title,
    amount: deal.amount,
    stageName: deal.stageName,
    healthScore,
    riskStatus,
    sentimentLabel,
    activeObjections,
    competitorsMentioned: competitors,
    executiveTakeaway: executiveTakeaway.trim(),
  };
}

/**
 * Uma rodada de detecção de deal em risco. Cada candidato passa pelo cooldown antes de gerar
 * notificação — nunca span o gestor com o mesmo alerta a cada execução do worker.
 */
export async function detectDealRisks(
  organizationId: string,
  now: Date = new Date(),
  liveInsights?: LiveCallInsight[],
): Promise<DetectDealRisksResult> {
  const result: DetectDealRisksResult = {
    scanned: 0,
    alertsCreated: 0,
    skippedCooldown: 0,
    errors: 0,
  };

  // N+1 (auditoria BI): cooldown e lista de gestores eram reconsultados por candidato dentro do
  // loop abaixo — até ~215 candidatos × (1 findFirst + 1 findMany) sequenciais por rodada. Agora
  // ambos são carregados UMA vez, em paralelo com a coleta de candidatos; o loop só decide em
  // memória e grava notificações. `alerted` cobre o caso de dois candidatos idênticos na mesma
  // rodada (ex.: o mesmo LiveCallInsight repetido) — antes, o segundo era barrado pelo cooldown
  // porque lia a notificação recém-gravada do primeiro.
  const [silentLeads, conversationRisks, recentAlerts, managers] = await Promise.all([
    findSilentLeads(organizationId, now),
    findConversationRisks(organizationId, now),
    loadRecentDealRiskAlerts(organizationId, now),
    loadManagers(organizationId),
  ]);

  const liveCandidates: RiskCandidate[] = [];
  if (liveInsights && liveInsights.length > 0) {
    for (const insight of liveInsights) {
      liveCandidates.push(...evaluateLiveCallInsightRisk(insight));
    }
  }

  const candidates = [...silentLeads, ...conversationRisks, ...liveCandidates];
  result.scanned = candidates.length;

  const alertedThisRound = new Set<string>();
  for (const candidate of candidates) {
    try {
      const cooldownKey = `${candidate.leadId}|${titlePrefix(candidate.reason)}`;
      if (
        alertedThisRound.has(cooldownKey) ||
        isCoolingDown(recentAlerts, candidate.leadId, candidate.reason)
      ) {
        result.skippedCooldown++;
        continue;
      }
      await notifyManagers(organizationId, candidate, managers);
      alertedThisRound.add(cooldownKey);
      result.alertsCreated++;
    } catch (error: any) {
      result.errors++;
      logger.error(
        { err: error, organizationId, leadId: candidate.leadId, reason: candidate.reason },
        'Falha ao processar alerta de risco de deal para um lead.',
      );
    }
  }

  return result;
}
