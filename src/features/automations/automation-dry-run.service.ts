import type { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import {
  fromPrismaActivityType,
  fromPrismaLeadStatus,
  toPrismaActivityStatus,
} from '../../lib/enumMap.js';
import { prisma } from '../../lib/prisma.js';
import {
  type AutomationActionType,
  type AutomationTrigger,
  matchesConditions,
  renderTemplate,
} from './automation.engine.js';
import type {
  CadenceActionConfig,
  UpdateCustomFieldActionConfig,
  WebhookActionConfig,
} from './automation.types.js';
import type { Automation } from './domain/Automation.js';

/**
 * Simulação ("dry-run") de uma automação: dado o estado ATUAL dos dados da organização, mostra o
 * que a regra FARIA se disparasse agora — sem nunca executar a ação de verdade (nenhum e-mail
 * enviado, nenhuma atividade criada, nenhuma ligação disparada). Onda 42 (dossiê CPI, DEC-14,
 * opção A).
 *
 * ## Decisão: contra dado real, não fixture sintética
 *
 * O motor (`automation.engine.ts`) é 100% orientado a evento — não existe uma "consulta" que liste
 * "todo lead que bateria a condição hoje" sem reconstituir, para cada registro candidato, o mesmo
 * formato de `AutomationEvent.data` que o disparo real usaria. Duas opções foram avaliadas:
 *
 * 1. Fixture sintética (dados fabricados, sem tocar o Postgres real): mais "seguro" no sentido de
 *    nunca vazar dado real na tela de preview, mas o preview perde exatamente o que o usuário quer
 *    responder ("quantos e QUAIS dos MEUS leads seriam afetados?") — uma automação com condição
 *    `status = 'Proposta Enviada'` contra 3 leads fabricados não diz nada sobre a base real.
 * 2. Amostra do dado real da organização, só leitura, com teto de tamanho — a opção escolhida
 *    aqui. Já é o padrão estabelecido nesta mesma feature para o mesmo tipo de problema (reavaliar
 *    condições contra dado atual): `stagnation-scanner.service.ts` já faz exatamente isso
 *    (`SCAN_LIMIT_PER_AUTOMATION = 200`) para decidir quando disparar de verdade. O dry-run usa o
 *    mesmo raciocínio, com um teto menor (é uma prévia sob demanda numa tela, não um scan em
 *    background) e SEM nunca chamar `runAction`.
 *
 * Risco de rodar contra produção real mitigado por: (a) somente leitura — nenhuma escrita, nenhuma
 * chamada externa (e-mail/voz) é efetivamente disparada, mesmo quando a ação "dispararia"; (b)
 * teto de amostra (`DEFAULT_DRY_RUN_LIMIT`/`MAX_DRY_RUN_LIMIT`) para não escanear a organização
 * inteira numa chamada síncrona de tela; (c) RBAC igual ao resto da feature (ADMIN/GESTOR, ver
 * `automation.routes.ts`) — quem pode ver o preview já podia ver os mesmos leads/atividades em
 * outras telas do CRM, então não há exposição de dado nova.
 *
 * ## Modo sandbox (cobertura de TODAS as ações do motor)
 *
 * O dry-run é o "sandbox" do motor: `runAction` NUNCA é chamado neste arquivo, então nenhum efeito
 * colateral pode escapar por construção — não é uma execução com rollback, é uma prévia que
 * espelha as MESMAS validações de config do `runAction` real (campos obrigatórios, lead vinculado,
 * janela de ligação, opt-out) e descreve o efeito que SERIA produzido. Isso cobre as 7 ações do
 * catálogo (`automation.engine.ts`), inclusive as de alto impacto que a prévia original não
 * alcançava e que antes caíam em "Ação desconhecida":
 *
 * - "Chamar webhook externo" → registra método/URL renderizados; o `fetch` HTTP nunca acontece.
 * - "Atualizar campo customizado" → registra entidade/campo/valor renderizados; o `prisma.*.update`
 *   nunca acontece.
 * - "Enrich lead" → registra o lead que seria enriquecido; o `domainEventMesh.publish` (job
 *   enfileirado) nunca acontece.
 * - "Mover para outra etapa de cadência" → registra a mutação pretendida na cadência; o
 *   `cadenceIntegrationService.executeCadenceAction` nunca roda — logo nenhum enrollment é
 *   alterado e nenhum envio multicanal (WhatsApp/e-mail) que a cadência dispara é agendado.
 *
 * Efeitos que já eram cobertos e continuam sem execução: e-mail SMTP ("Notificar equipe" canal
 * e-mail), notificação in-app, atividade criada no CRM e ligação do SDR de Voz (`callLead`).
 * A abordagem escolhida foi estender a prévia existente (sandbox por construção) em vez de executar
 * `runAction` dentro de transação com rollback: efeitos externos pagos (voz, SMTP, HTTP, filas)
 * não são revertíveis por rollback de banco, então interceptá-los antes de executar é o único
 * sandbox realmente seguro — e é o que este serviço já fazia para as 3 ações originais.
 *
 * ## Reuso, não duplicação
 *
 * A decisão de "bate a condição?" usa `matchesConditions` (a MESMA função do motor real,
 * importada, nunca reimplementada). A única lógica nova aqui é (1) montar a amostra de registros
 * candidatos com o mesmo formato de `data` que o disparo real usaria, e (2) prever o que cada tipo
 * de ação faria — essa segunda parte não pode reusar `runAction` diretamente porque `runAction` TEM
 * efeito colateral (grava atividade, envia e-mail, liga); ela reusa as MESMAS checagens de
 * validação (destinatário ausente, lead sem vínculo, janela de ligação, opt-out) através das
 * funções puras/somente-leitura que `runAction` também usa, para o preview nunca divergir do
 * comportamento real por reimplementar a regra errado.
 */

const DEFAULT_DRY_RUN_LIMIT = 25;
const MAX_DRY_RUN_LIMIT = 100;

export interface DryRunOptions {
  /** Tamanho da amostra de registros candidatos. Padrão 25, teto 100 (ver justificativa acima). */
  limit?: number;
}

export interface DryRunActionPreview {
  action: AutomationActionType;
  /** false quando a condição bate mas a ação NÃO dispararia mesmo assim (config inválida, fora
   *  da janela comercial, número em opt-out…) — mesmo critério dos bloqueios permanentes do
   *  motor real (`PermanentAutomationError`) e das saídas antecipadas silenciosas dele. */
  wouldFire: boolean;
  /** Motivo textual quando `wouldFire` é false. */
  blockedReason?: string;
  /** Detalhes específicos da ação (título/corpo já renderizados, destinatário, tipo de
   *  atividade, prazo, telefone alvo…) — o que o usuário vê na lista "o que aconteceria". */
  details: Record<string, unknown>;
}

export interface DryRunRecord {
  entity: 'Lead' | 'Activity';
  entityId: string;
  /** Rótulo curto para a lista (nome do lead, ou "Atividade <tipo> de <owner>"). */
  label: string;
  outcome: DryRunActionPreview;
}

export interface DryRunResult {
  automationId: string;
  automationName: string;
  trigger: AutomationTrigger;
  action: AutomationActionType;
  enabled: boolean;
  generatedAt: string;
  /** Quantos registros a amostra examinou (não necessariamente todos os que existem — ver
   *  `limit`). */
  sampleSize: number;
  /** Quantos da amostra bateram a condição da regra. */
  matchedCount: number;
  /** Quantos dos que bateram a condição TAMBÉM disparariam a ação de verdade (`wouldFire`). */
  wouldFireCount: number;
  records: DryRunRecord[];
  /** Explica a metodologia usada nesta execução — ver seção "Decisão" acima. */
  methodologyNote: string;
}

const METHODOLOGY_NOTE =
  'Simulação contra uma amostra dos dados reais e atuais da organização (mais recentes primeiro), ' +
  'não contra dados fabricados — em modo sandbox nenhuma ação é executada de verdade: e-mails, ' +
  'ligações de voz, chamadas HTTP de webhook, escritas no CRM, publicações em fila e mutações de ' +
  'cadência (incluindo os envios de WhatsApp que uma cadência dispara) são apenas registradas ' +
  'como efeitos simulados. Se a amostra não cobrir todos os registros da organização, o resultado ' +
  'pode não refletir 100% dos casos reais.';

function daysSince(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit) || !limit || limit <= 0) return DEFAULT_DRY_RUN_LIMIT;
  return Math.min(Math.floor(limit), MAX_DRY_RUN_LIMIT);
}

interface Candidate {
  entity: 'Lead' | 'Activity';
  entityId: string;
  label: string;
  data: Record<string, unknown>;
}

/** Amostra de Leads para os gatilhos "Lead criado"/"Lead mudou de status" — mesmos campos que
 *  `LeadController.fireAutomations` envia num disparo real (o lead inteiro), mais
 *  `daysSinceLastInteraction` (só usado por regras de estagnação — nunca presente no evento em
 *  tempo real, ver `stagnation-scanner.service.ts`, mas incluído aqui porque o dry-run precisa
 *  simular os dois mecanismos que podem disparar esta mesma regra). */
async function sampleLeads(organizationId: string, limit: number): Promise<Candidate[]> {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: { organizationId, deletedAt: null },
    select: {
      id: true,
      status: true,
      owner: true,
      temperature: true,
      score: true,
      funnel: true,
      companyId: true,
      contactId: true,
      createdAt: true,
      updatedAt: true,
      lastInteraction: true,
      contact: { select: { name: true, phone: true, whatsapp: true } },
      company: { select: { tradeName: true, legalName: true, phones: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return leads.map((lead) => {
    const referenceDate = lead.lastInteraction ?? lead.createdAt;
    const label =
      lead.contact?.name || lead.company?.tradeName || lead.company?.legalName || lead.id;
    return {
      entity: 'Lead' as const,
      entityId: lead.id,
      label,
      data: {
        id: lead.id,
        status: fromPrismaLeadStatus(lead.status),
        owner: lead.owner,
        temperature: lead.temperature,
        score: lead.score,
        funnel: lead.funnel,
        companyId: lead.companyId,
        contactId: lead.contactId,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        lastInteraction: lead.lastInteraction,
        daysSinceLastInteraction: daysSince(referenceDate, now),
        // Guardados fora do `data` de condição normal (nomes que o motor não usa para
        // condição) só para a etapa de preview de ação (telefone discável do SDR de voz).
        _contact: lead.contact,
        _company: lead.company,
      },
    };
  });
}

/** Amostra de Activities concluídas para o gatilho "Atividade concluída" — MESMOS 3 campos que
 *  `activity.service.ts` envia no disparo real (`type`, `owner`, `leadId`), nada a mais: incluir
 *  campos extras aqui criaria condições que passariam no dry-run e nunca bateriam no disparo real. */
async function sampleActivities(organizationId: string, limit: number): Promise<Candidate[]> {
  const activities = await prisma.activity.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: toPrismaActivityStatus('Concluída') as unknown as Prisma.ActivityWhereInput['status'],
    },
    select: { id: true, type: true, owner: true, leadId: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return activities.map((activity) => ({
    entity: 'Activity' as const,
    entityId: activity.id,
    label: `Atividade ${fromPrismaActivityType(activity.type)} de ${activity.owner}`,
    data: {
      type: fromPrismaActivityType(activity.type),
      owner: activity.owner,
      leadId: activity.leadId,
    },
  }));
}

async function sampleFor(
  organizationId: string,
  trigger: AutomationTrigger,
  limit: number,
): Promise<Candidate[]> {
  if (trigger === 'Atividade concluída') return sampleActivities(organizationId, limit);
  // "Lead criado" e "Lead mudou de status" — os dois únicos gatilhos restantes — sempre partem
  // de um evento de Lead.
  return sampleLeads(organizationId, limit);
}

interface NotifyPreviewConfig {
  title?: string;
  body?: string;
  kind?: string;
  channel?: 'in_app' | 'email';
  to?: string;
}

interface CreateActivityPreviewConfig {
  type?: string;
  owner?: string;
  dueInDays?: number;
  observations?: string;
}

/** Prevê "Notificar equipe" sem enviar nada — mesma validação de `runAction` (destinatário
 *  obrigatório no canal e-mail), mas em vez de lançar, retorna `wouldFire: false` com o motivo. */
function previewNotify(
  automationName: string,
  config: NotifyPreviewConfig,
  data: Record<string, unknown>,
): DryRunActionPreview {
  const title = renderTemplate(config.title || automationName, data);
  const body = config.body ? renderTemplate(config.body, data) : null;
  const channel = config.channel ?? 'in_app';

  if (channel === 'email') {
    const to = config.to ? renderTemplate(config.to, data) : '';
    if (!to) {
      return {
        action: 'Notificar equipe',
        wouldFire: false,
        blockedReason:
          'Canal de e-mail configurado sem destinatário ("to") — a regra falharia como configuração inválida.',
        details: { channel, title, body },
      };
    }
    // Mesma checagem que `sendEmail`/`mailer.ts` faz antes de tentar enviar (SMTP_HOST ausente
    // = e-mail não sai, só a notificação interna é criada). Checado aqui sem importar
    // `mailer.ts` (evita puxar o transporte SMTP real para dentro de um caminho de leitura).
    if (!env.SMTP_HOST) {
      return {
        action: 'Notificar equipe',
        wouldFire: true,
        blockedReason:
          'SMTP_HOST não configurado: a notificação interna seria criada normalmente, mas o e-mail não sairia.',
        details: { channel, to, title, body },
      };
    }
    return { action: 'Notificar equipe', wouldFire: true, details: { channel, to, title, body } };
  }

  return { action: 'Notificar equipe', wouldFire: true, details: { channel, title, body } };
}

/** Prevê "Criar atividade" sem gravar nada — mesma resolução de leadId que `runAction` usa. */
function previewCreateActivity(
  automationName: string,
  config: CreateActivityPreviewConfig,
  candidate: Candidate,
): DryRunActionPreview {
  const leadId =
    candidate.entity === 'Lead'
      ? candidate.entityId
      : typeof candidate.data.leadId === 'string'
        ? candidate.data.leadId
        : null;
  if (!leadId) {
    return {
      action: 'Criar atividade',
      wouldFire: false,
      blockedReason:
        'Nenhum lead vinculado a este registro — a ação "Criar atividade" exige um lead.',
      details: {},
    };
  }
  const dueInDays = Number(config.dueInDays) || 1;
  const date = new Date();
  date.setDate(date.getDate() + dueInDays);
  return {
    action: 'Criar atividade',
    wouldFire: true,
    details: {
      leadId,
      type: config.type || 'Follow_up',
      owner: config.owner || String(candidate.data.owner ?? 'Não atribuído'),
      dueDate: date.toISOString(),
      observations: renderTemplate(
        config.observations || `Criada pela automação "${automationName}".`,
        candidate.data,
      ),
    },
  };
}

/** Prevê "Ligar via SDR de Voz" sem discar — reusa as MESMAS checagens somente-leitura que
 *  `runAction`/`callLead` fariam antes de discar (janela comercial, telefone discável, opt-out),
 *  importadas dos mesmos módulos, nunca reimplementadas aqui. `callLead` em si (que de fato inicia
 *  a chamada) nunca é importado/chamado neste arquivo. */
async function previewCallSdrVoz(
  organizationId: string,
  candidate: Candidate,
): Promise<DryRunActionPreview> {
  if (candidate.entity !== 'Lead') {
    return {
      action: 'Ligar via SDR de Voz',
      wouldFire: false,
      blockedReason: 'A ação "Ligar via SDR de Voz" só se aplica a eventos de lead.',
      details: {},
    };
  }

  const { isWithinCallWindow } = await import('../integrations/birth-voice/coldCall.policy.js');
  const { callWindowFromEnv } = await import('../integrations/birth-voice/coldCall.service.js');
  const { pickCallablePhone } = await import('../integrations/birth-voice/birthVoice.helpers.js');
  const { isSuppressed } = await import('../integrations/birth-voice/callSuppression.service.js');

  if (!isWithinCallWindow(new Date(), callWindowFromEnv())) {
    return {
      action: 'Ligar via SDR de Voz',
      wouldFire: false,
      blockedReason: 'Fora da janela comercial de ligações no momento desta simulação.',
      details: {},
    };
  }

  const contact = (candidate.data._contact ?? null) as {
    name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  const company = (candidate.data._company ?? null) as {
    tradeName?: string | null;
    legalName?: string | null;
    phones?: string[] | null;
  } | null;
  const targetNumber = pickCallablePhone(contact, company);
  if (!targetNumber) {
    return {
      action: 'Ligar via SDR de Voz',
      wouldFire: false,
      blockedReason: 'Lead sem telefone em formato discável.',
      details: {},
    };
  }

  const suppressed = await isSuppressed(organizationId, targetNumber, {
    leadId: candidate.entityId,
    email: null,
  });
  if (suppressed) {
    return {
      action: 'Ligar via SDR de Voz',
      wouldFire: false,
      blockedReason:
        'Número na lista interna de bloqueio (opt-out): a ligação não seria disparada.',
      details: { targetNumber },
    };
  }

  return { action: 'Ligar via SDR de Voz', wouldFire: true, details: { targetNumber } };
}

/** Prevê "Chamar webhook externo" sem disparar nenhum `fetch` — mesma validação de config do
 *  `runAction` real (url obrigatória), mas a chamada HTTP NUNCA acontece neste arquivo. O preview
 *  registra método/URL já renderizados como efeito simulado; o status remoto é desconhecido por
 *  definição (a chamada não foi feita). */
function previewWebhook(
  config: WebhookActionConfig,
  candidate: Candidate,
): DryRunActionPreview {
  if (!config.url) {
    return {
      action: 'Chamar webhook externo',
      wouldFire: false,
      blockedReason: 'Ação "Chamar webhook externo" requer o campo "url".',
      details: {},
    };
  }
  return {
    action: 'Chamar webhook externo',
    wouldFire: true,
    details: {
      method: config.method ?? 'POST',
      url: renderTemplate(config.url, candidate.data),
      simulatedEffect: 'chamada HTTP externa (webhook)',
      note: 'A requisição HTTP NÃO foi enviada — apenas registrada como efeito simulado.',
    },
  };
}

/** Prevê "Atualizar campo customizado" sem gravar nada — mesmas validações do `runAction` real
 *  (field obrigatório; na prática o motor só grava quando o alvo é Lead, demais entidades retornam
 *  sem efeito). O `prisma.*.update` nunca acontece aqui. */
function previewUpdateCustomField(
  config: UpdateCustomFieldActionConfig,
  candidate: Candidate,
): DryRunActionPreview {
  if (!config.field) {
    return {
      action: 'Atualizar campo customizado',
      wouldFire: false,
      blockedReason: 'Ação "Atualizar campo customizado" requer o campo "field".',
      details: {},
    };
  }
  const targetEntity = config.entity ?? candidate.entity;
  const targetEntityId = config.entityId ?? candidate.entityId;
  if (targetEntity !== 'Lead') {
    return {
      action: 'Atualizar campo customizado',
      wouldFire: false,
      blockedReason:
        'O motor só aplica esta ação a Lead — para outros alvos a execução real termina sem efeito.',
      details: { entity: targetEntity, entityId: targetEntityId, field: config.field },
    };
  }
  const value =
    typeof config.value === 'string' ? renderTemplate(config.value, candidate.data) : config.value;
  return {
    action: 'Atualizar campo customizado',
    wouldFire: true,
    details: {
      entity: 'Lead',
      entityId: targetEntityId,
      field: config.field,
      value,
      simulatedEffect: 'escrita no CRM (lead)',
      note: 'A atualização NÃO foi gravada — apenas registrada como efeito simulado.',
    },
  };
}

/** Prevê "Enrich lead" sem enfileirar nada — mesma resolução de leadId do `runAction` real.
 *  O `domainEventMesh.publish` (que dispara o job de enriquecimento) NUNCA acontece aqui. */
function previewEnrichLead(candidate: Candidate): DryRunActionPreview {
  const leadId =
    candidate.entity === 'Lead'
      ? candidate.entityId
      : typeof candidate.data.leadId === 'string'
        ? candidate.data.leadId
        : null;
  if (!leadId) {
    return {
      action: 'Enrich lead',
      wouldFire: false,
      blockedReason: 'Ação "Enrich lead" precisa de um lead vinculado ao evento.',
      details: {},
    };
  }
  return {
    action: 'Enrich lead',
    wouldFire: true,
    details: {
      leadId,
      queuedEvent: 'LEAD_ENRICHMENT_REQUESTED',
      simulatedEffect: 'publicação em fila (job de enriquecimento)',
      note: 'O evento NÃO foi publicado na fila — nenhum job de enriquecimento foi enfileirado.',
    },
  };
}

/** Prevê "Mover para outra etapa de cadência" sem tocar em enrollment nenhum — mesmas
 *  validações do `runAction` real (`cadenceId` obrigatório; leadId via config, entidade Lead ou
 *  `data.leadId`). O `cadenceIntegrationService.executeCadenceAction` NUNCA é chamado aqui: logo
 *  nenhum enrollment é criado/alterado e nenhum envio multicanal (WhatsApp/e-mail) que a cadência
 *  dispara é agendado. */
function previewCadenceAction(
  config: CadenceActionConfig,
  candidate: Candidate,
): DryRunActionPreview {
  if (!config.cadenceId) {
    return {
      action: 'Mover para outra etapa de cadência',
      wouldFire: false,
      blockedReason:
        'Ação "Mover para outra etapa de cadência" requer "cadenceId".',
      details: {},
    };
  }
  const leadId =
    config.leadId ??
    (candidate.entity === 'Lead'
      ? candidate.entityId
      : typeof candidate.data.leadId === 'string'
        ? candidate.data.leadId
        : undefined);
  if (!leadId) {
    return {
      action: 'Mover para outra etapa de cadência',
      wouldFire: false,
      blockedReason:
        'Ação "Mover para outra etapa de cadência" precisa de um leadId.',
      details: { cadenceId: config.cadenceId },
    };
  }
  return {
    action: 'Mover para outra etapa de cadência',
    wouldFire: true,
    details: {
      cadenceId: config.cadenceId,
      leadId,
      cadenceAction: config.action ?? 'move_to_step',
      stepIndex: config.stepIndex ?? null,
      pauseDays: config.pauseDays ?? null,
      simulatedEffect: 'mutação de cadência multicanal',
      note: 'A cadência NÃO foi alterada — nenhum enrollment mudou e nenhum envio de WhatsApp/e-mail foi agendado.',
    },
  };
}

async function previewAction(
  organizationId: string,
  automation: { name: string; action: AutomationActionType; actionConfig: unknown },
  candidate: Candidate,
): Promise<DryRunActionPreview> {
  const config = (automation.actionConfig ?? {}) as Record<string, unknown>;

  if (automation.action === 'Notificar equipe') {
    return previewNotify(automation.name, config as NotifyPreviewConfig, candidate.data);
  }
  if (automation.action === 'Criar atividade') {
    return previewCreateActivity(automation.name, config as CreateActivityPreviewConfig, candidate);
  }
  if (automation.action === 'Ligar via SDR de Voz') {
    return previewCallSdrVoz(organizationId, candidate);
  }
  if (automation.action === 'Chamar webhook externo') {
    return previewWebhook(config as unknown as WebhookActionConfig, candidate);
  }
  if (automation.action === 'Atualizar campo customizado') {
    return previewUpdateCustomField(
      config as unknown as UpdateCustomFieldActionConfig,
      candidate,
    );
  }
  if (automation.action === 'Enrich lead') {
    return previewEnrichLead(candidate);
  }
  if (automation.action === 'Mover para outra etapa de cadência') {
    return previewCadenceAction(config as unknown as CadenceActionConfig, candidate);
  }
  return {
    action: automation.action,
    wouldFire: false,
    blockedReason: `Ação desconhecida: ${automation.action}`,
    details: {},
  };
}

/**
 * Executa o dry-run de uma automação: monta a amostra, filtra por `matchesConditions` (reusada do
 * motor real) e prevê a ação para cada registro que bate — sem NUNCA chamar `runAction`.
 */
export async function dryRunAutomation(
  organizationId: string,
  automation: Pick<
    Automation,
    'id' | 'name' | 'enabled' | 'trigger' | 'conditions' | 'action' | 'actionConfig'
  >,
  options: DryRunOptions = {},
): Promise<DryRunResult> {
  const limit = clampLimit(options.limit);
  const candidates = await sampleFor(organizationId, automation.trigger, limit);

  const matched = candidates.filter((candidate) =>
    matchesConditions(automation.conditions, candidate.data),
  );

  const records: DryRunRecord[] = [];
  for (const candidate of matched) {
    const outcome = await previewAction(organizationId, automation, candidate);
    records.push({
      entity: candidate.entity,
      entityId: candidate.entityId,
      label: candidate.label,
      outcome,
    });
  }

  return {
    automationId: automation.id,
    automationName: automation.name,
    trigger: automation.trigger,
    action: automation.action,
    enabled: automation.enabled,
    generatedAt: new Date().toISOString(),
    sampleSize: candidates.length,
    matchedCount: matched.length,
    wouldFireCount: records.filter((r) => r.outcome.wouldFire).length,
    records,
    methodologyNote: METHODOLOGY_NOTE,
  };
}
