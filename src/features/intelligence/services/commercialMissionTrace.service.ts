import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { consentAuditChain } from '../../../lib/security/consentChainFactory.js';
import {
  ConsentChainUnavailableError,
  type StoredConsentAuditEvent,
} from '../../../lib/security/consentAuditChain.service.js';
import type { getTenantPrisma } from '../../../lib/tenant-prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { hasPiiExternalConsent } from '../../../shared/services/aiPiiConsent.service.js';
import { redactResidualPii } from '../../../shared/security/piiRedaction.js';
import { classifyAgentFromCatalog } from '../agents/triad/agentGraphTaxonomy.js';
import type {
  AgentCenterDirector,
  AgentCenterDirectorStatus,
  AgentCenterNodeStatus,
  AgentCenterTraceNode,
  AgentCenterTraceStatus,
  CommercialMissionTrace,
  MissionAgentExecutionTrace,
  MissionConsentAuditChainTrace,
  MissionConsentTrace,
  MissionHandoffEvidenceTrace,
  MissionHandoffTrace,
  MissionHandoffTraceStatus,
  MissionOrganizationAiConsentTrace,
  MissionPolicyDecisionTrace,
  MissionToolCallTrace,
} from '../agents/triad/triad.types.js';

// Mesmo motivo de pending-actions.service.ts: a união `prisma | getTenantPrisma()` estoura o
// typecheck ao chamar delegates direto (Exact<> interno do $extends). As duas metades são
// runtime-compatíveis; o cast acontece uma única vez antes das queries.
type Db = typeof prisma | ReturnType<typeof getTenantPrisma>;

function asClient(db: Db): typeof prisma {
  return db as typeof prisma;
}

const HANDOFF_SELECT = {
  id: true,
  organizationId: true,
  missionId: true,
  conversationId: true,
  fromAgent: true,
  fromRole: true,
  toAgent: true,
  toRole: true,
  requestType: true,
  requestedCapability: true,
  resourceScope: true,
  knownFacts: true,
  evidence: true,
  risks: true,
  priority: true,
  status: true,
  response: true,
  confidence: true,
  errorMessage: true,
  parentHandoffId: true,
  depth: true,
  executionId: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  completedAt: true,
  expiresAt: true,
} as const;

const EXECUTION_INCLUDE = {
  agentDefinition: { select: { name: true, domain: true } },
  agentVersion: { select: { version: true } },
} as const;

const CONSENT_EVENTS_LIMIT = 20;

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && v.length > 0))];
}

function safeText(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return redactResidualPii(value).redactedText;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function resourceLeadId(resourceScope: unknown): string | null {
  const scope = asRecord(resourceScope);
  if (!scope) return null;
  if (typeof scope.leadId === 'string' && scope.leadId.length > 0) return scope.leadId;
  if (scope.type === 'LEAD' && typeof scope.id === 'string' && scope.id.length > 0) {
    return scope.id;
  }
  return null;
}

function toPolicyDecision(raw: unknown): MissionPolicyDecisionTrace | null {
  const decision = asRecord(raw);
  if (!decision) return null;
  return {
    allowed: decision.allowed === true,
    reason: typeof decision.reason === 'string' ? decision.reason : 'UNSPECIFIED',
    requiresApproval: decision.requiresApproval === true,
    riskLevel: typeof decision.riskLevel === 'string' ? decision.riskLevel : null,
    accessLevel: typeof decision.accessLevel === 'string' ? decision.accessLevel : null,
    toolCode: typeof decision.toolCode === 'string' ? decision.toolCode : null,
    toolAvailable: decision.toolAvailable === true,
    bindingVerification:
      typeof decision.bindingVerification === 'string' ? decision.bindingVerification : null,
    bindingEvidencePath:
      typeof decision.bindingEvidencePath === 'string' ? decision.bindingEvidencePath : null,
    temporaryGrantId:
      typeof decision.temporaryGrantId === 'string' ? decision.temporaryGrantId : null,
  };
}

function toToolCalls(raw: unknown): MissionToolCallTrace[] {
  return asArray(raw).flatMap((item) => {
    const call = asRecord(item);
    if (!call || typeof call.toolCode !== 'string') return [];
    return [
      {
        toolCode: call.toolCode,
        startedAt: typeof call.startedAt === 'string' ? call.startedAt : undefined,
        finishedAt: typeof call.finishedAt === 'string' ? call.finishedAt : undefined,
        ok: typeof call.ok === 'boolean' ? call.ok : undefined,
      },
    ];
  });
}

type ExecutionRow = Prisma.AgentExecutionGetPayload<{ include: typeof EXECUTION_INCLUDE }>;
type HandoffRow = Prisma.AgentHandoffMessageGetPayload<{ select: typeof HANDOFF_SELECT }>;

function toExecutionTrace(row: ExecutionRow): MissionAgentExecutionTrace {
  return {
    executionId: row.id,
    agentCode: row.agentCode,
    agentName: row.agentDefinition?.name ?? row.agentCode,
    agentVersion: row.agentVersion?.version ?? null,
    capabilityCode: row.capabilityCode,
    mission: row.mission,
    status: row.status,
    summary: safeText(row.summary),
    confidence: row.confidence,
    errorMessage: safeText(row.errorMessage),
    correlationId: row.correlationId,
    policyDecision: toPolicyDecision(row.policyDecision),
    toolCalls: toToolCalls(row.toolCalls),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: iso(row.completedAt),
  };
}

function toEvidenceTrace(raw: unknown): MissionHandoffEvidenceTrace[] {
  return asArray(raw).flatMap((item) => {
    const evidence = asRecord(item);
    if (!evidence || typeof evidence.sourceAgent !== 'string') return [];
    const summary = safeText(evidence.summary);
    if (!summary) return [];
    return [
      {
        sourceAgent: evidence.sourceAgent,
        sourceExecutionId:
          typeof evidence.sourceExecutionId === 'string' ? evidence.sourceExecutionId : undefined,
        capabilityCode:
          typeof evidence.capabilityCode === 'string' ? evidence.capabilityCode : undefined,
        summary,
        recordedAt:
          typeof evidence.recordedAt === 'string' ? evidence.recordedAt : new Date(0).toISOString(),
      },
    ];
  });
}

function handoffEffectiveStatus(
  row: Pick<HandoffRow, 'status' | 'expiresAt'>,
): MissionHandoffTraceStatus {
  const pending: MissionHandoffTraceStatus[] = ['CREATED', 'AUTHORIZING', 'QUEUED'];
  if (pending.includes(row.status) && row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    return 'EXPIRED';
  }
  return row.status;
}

function toHandoffTrace(row: HandoffRow): MissionHandoffTrace {
  const effectiveStatus = handoffEffectiveStatus(row);
  return {
    handoffId: row.id,
    missionId: row.missionId,
    conversationId: row.conversationId,
    fromAgent: row.fromAgent,
    fromRole: row.fromRole,
    toAgent: row.toAgent,
    toRole: row.toRole,
    requestType: row.requestType,
    requestedCapability: row.requestedCapability,
    priority: row.priority,
    status: row.status,
    effectiveStatus,
    depth: row.depth,
    parentHandoffId: row.parentHandoffId,
    executionId: row.executionId,
    confidence: row.confidence,
    errorMessage: safeText(row.errorMessage),
    evidence: toEvidenceTrace(row.evidence),
    risksCount: asArray(row.risks).length,
    knownFactsCount: asArray(row.knownFacts).length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedAt: iso(row.acceptedAt),
    completedAt: iso(row.completedAt),
    expiresAt: iso(row.expiresAt),
  };
}

function nodeStatusFromExecution(
  status: MissionAgentExecutionTrace['status'],
): AgentCenterNodeStatus {
  switch (status) {
    case 'SUCCEEDED':
      return 'COMPLETED';
    case 'RUNNING':
    case 'AUTHORIZING':
      return 'RUNNING';
    case 'DENIED':
      return 'DENIED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

function nodeStatusFromHandoff(status: MissionHandoffTraceStatus): AgentCenterNodeStatus {
  switch (status) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'RUNNING':
    case 'AUTHORIZING':
    case 'QUEUED':
    case 'ACCEPTED':
      return 'RUNNING';
    case 'DENIED':
      return 'DENIED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

function executionNode(row: ExecutionRow): AgentCenterTraceNode {
  const summary = safeText(row.summary);
  const error = safeText(row.errorMessage);
  return {
    id: `exec-${row.id}`,
    agentCode: row.agentCode,
    agentName: row.agentDefinition?.name ?? row.agentCode,
    roleLabel: `Execução ${row.capabilityCode}`,
    director: 'GISELLE',
    status: nodeStatusFromExecution(row.status),
    resultSummary:
      summary ?? error ?? `Execução ${row.status.toLowerCase()} para ${row.capabilityCode}.`,
    timestamp: (row.completedAt ?? row.updatedAt ?? row.createdAt).toISOString(),
  };
}

function handoffNode(row: HandoffRow, agentNames: Map<string, string>): AgentCenterTraceNode {
  const effectiveStatus = handoffEffectiveStatus(row);
  const error = safeText(row.errorMessage);
  return {
    id: `handoff-${row.id}`,
    agentCode: row.toAgent,
    agentName: agentNames.get(row.toAgent) ?? row.toAgent,
    roleLabel: `Handoff ${row.fromAgent} → ${row.toAgent} • ${row.requestType}`,
    director: 'GISELLE',
    status: nodeStatusFromHandoff(effectiveStatus),
    resultSummary:
      error ??
      safeText(
        `Handoff ${row.requestType} para ${row.requestedCapability}: ${effectiveStatus.toLowerCase()}.`,
      ) ??
      `Handoff ${effectiveStatus.toLowerCase()} para ${row.requestedCapability}.`,
    timestamp: (row.completedAt ?? row.updatedAt ?? row.createdAt).toISOString(),
  };
}

function classifyNode(
  node: AgentCenterTraceNode,
  domains: Map<string, string | null>,
): AgentCenterDirector {
  return classifyAgentFromCatalog(node.agentCode, domains.get(node.agentCode) ?? undefined)
    .director;
}

function aggregateDirectorStatus(nodes: AgentCenterTraceNode[]): AgentCenterDirectorStatus {
  if (nodes.length === 0) return 'PENDING';
  const statuses = nodes.map((node) => node.status);
  if (statuses.includes('RUNNING')) return 'RUNNING';
  if (statuses.includes('PENDING')) return 'PENDING';
  if (statuses.every((status) => status === 'COMPLETED')) return 'COMPLETED';
  if (statuses.includes('FAILED')) return 'FAILED';
  if (statuses.includes('DENIED')) return 'DENIED';
  if (statuses.includes('BLOCKED')) return 'BLOCKED';
  return 'CANCELLED';
}

function missionStatus(
  executions: MissionAgentExecutionTrace[],
  handoffs: MissionHandoffTrace[],
): AgentCenterTraceStatus {
  const executionInProgress = executions.some(
    (row) => row.status === 'AUTHORIZING' || row.status === 'RUNNING',
  );
  const handoffInProgress = handoffs.some((row) =>
    ['AUTHORIZING', 'QUEUED', 'ACCEPTED', 'RUNNING'].includes(row.effectiveStatus),
  );
  if (executionInProgress || handoffInProgress) return 'IN_PROGRESS';

  const pending =
    executions.some((row) => row.status === 'PENDING') ||
    handoffs.some((row) => row.effectiveStatus === 'CREATED');
  if (pending) return 'PENDING';

  const failed =
    executions.some((row) => row.status === 'FAILED') ||
    handoffs.some((row) => row.effectiveStatus === 'FAILED');
  if (failed) return 'FAILED';

  const denied =
    executions.some((row) => row.status === 'DENIED') ||
    handoffs.some((row) => row.effectiveStatus === 'DENIED');
  if (denied) return 'DENIED';

  const cancelled =
    executions.some((row) => row.status === 'CANCELLED') ||
    handoffs.some((row) => ['CANCELLED', 'EXPIRED'].includes(row.effectiveStatus));
  if (cancelled) return 'CANCELLED';

  const allSucceeded =
    executions.every((row) => row.status === 'SUCCEEDED') &&
    handoffs.every((row) => row.effectiveStatus === 'COMPLETED');
  return allSucceeded ? 'COMPLETED' : 'PENDING';
}

function toConsentEventTrace(event: StoredConsentAuditEvent) {
  return {
    id: event.id,
    sequence: event.sequence,
    kind: event.kind,
    subjectRef: event.subjectRef,
    purpose: event.purpose,
    termsVersion: event.termsVersion,
    status: event.status,
    occurredAt: event.occurredAt,
    previousHash: event.previousHash,
    currentHash: event.currentHash,
  };
}

async function loadConsentTrace(organizationId: string): Promise<MissionConsentTrace> {
  const [consentRow, chainEvents, verification] = await Promise.all([
    asClient(prisma).organizationAiConsent.findUnique({ where: { organizationId } }),
    consentAuditChain.getChain(organizationId),
    consentAuditChain.verifyChainIntegrity(organizationId),
  ]).catch((error: unknown) => {
    if (error instanceof ConsentChainUnavailableError) {
      throw new AppError('Cadeia de auditoria de consentimento indisponível.', 503);
    }
    throw error;
  });

  const organizationAiConsent: MissionOrganizationAiConsentTrace | null = consentRow
    ? {
        granted: consentRow.granted,
        consentVersion: consentRow.consentVersion,
        grantedAt: iso(consentRow.grantedAt),
        revokedAt: iso(consentRow.revokedAt),
        grantedByUserId: consentRow.grantedByUserId,
      }
    : null;

  const auditChain: MissionConsentAuditChainTrace = verification.valid
    ? {
        status: 'VERIFIED',
        valid: true,
        totalRecords: verification.totalRecords,
        reason: null,
        checkedAt: new Date().toISOString(),
        events: chainEvents.slice(-CONSENT_EVENTS_LIMIT).map(toConsentEventTrace),
      }
    : {
        status: 'INVALID',
        valid: false,
        totalRecords: verification.totalRecords,
        reason: verification.reason ?? null,
        checkedAt: new Date().toISOString(),
        events: [],
      };

  return {
    organizationAiConsent,
    externalPiiConsentGranted: hasPiiExternalConsent(organizationId),
    auditChain,
  };
}

/**
 * Rastro auditável real de uma missão autônoma: handoffs e execuções persistidos por
 * `organizationId`, nunca lead/status de CRM reclassificado como "missão de IA".
 *
 * `missionId` é o identificador usado por `AgentHandoffMessage.missionId` e por
 * `AgentExecution.correlationId` (o Agent Bus grava `correlationId = handoffId`, então a união
 * por executionId dos handoffs + correlationId cobre os dois caminhos de ligação). `default`
 * resolve para a missão mais recente persistida; sem nenhum registro retorna `null` (404),
 * nunca uma trinca sintética.
 */
export async function getCommercialMissionTrace(input: {
  db: Db;
  organizationId: string;
  requestedMissionId: string;
}): Promise<CommercialMissionTrace | null> {
  const { organizationId, requestedMissionId } = input;
  const client = asClient(input.db);

  let missionId = requestedMissionId;
  if (requestedMissionId === 'default') {
    const latestHandoff = await client.agentHandoffMessage.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: { missionId: true },
    });
    if (latestHandoff) {
      missionId = latestHandoff.missionId;
    } else {
      const latestExecution = await client.agentExecution.findFirst({
        where: { organizationId, correlationId: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { correlationId: true },
      });
      if (!latestExecution?.correlationId) return null;
      missionId = latestExecution.correlationId;
    }
  }

  const handoffs = await client.agentHandoffMessage.findMany({
    where: { organizationId, missionId },
    select: HANDOFF_SELECT,
    orderBy: { createdAt: 'asc' },
  });

  const handoffExecutionIds = unique(handoffs.map((row) => row.executionId));
  const correlationIds = unique([missionId, ...handoffs.map((row) => row.id)]);
  const executionWhere: Prisma.AgentExecutionWhereInput[] = [];
  if (handoffExecutionIds.length > 0) {
    executionWhere.push({ id: { in: handoffExecutionIds } });
  }
  if (correlationIds.length > 0) {
    executionWhere.push({ correlationId: { in: correlationIds } });
  }

  const executions =
    executionWhere.length > 0
      ? await client.agentExecution.findMany({
          where: { organizationId, OR: executionWhere },
          include: EXECUTION_INCLUDE,
          orderBy: { createdAt: 'asc' },
        })
      : [];

  if (handoffs.length === 0 && executions.length === 0) return null;

  const agentCodes = unique([
    ...handoffs.flatMap((row) => [row.fromAgent, row.toAgent]),
    ...executions.map((row) => row.agentCode),
  ]);
  const [agentDefinitions, consent] = await Promise.all([
    agentCodes.length > 0
      ? client.agentDefinition.findMany({
          where: { code: { in: agentCodes } },
          select: { code: true, name: true, domain: true },
        })
      : Promise.resolve([]),
    loadConsentTrace(organizationId),
  ]);

  const agentNames = new Map(agentDefinitions.map((row) => [row.code, row.name]));
  const agentDomains = new Map(agentDefinitions.map((row) => [row.code, row.domain]));
  for (const execution of executions) {
    if (!agentNames.has(execution.agentCode)) {
      agentNames.set(execution.agentCode, execution.agentDefinition?.name ?? execution.agentCode);
    }
    if (!agentDomains.has(execution.agentCode)) {
      agentDomains.set(execution.agentCode, execution.agentDefinition?.domain ?? null);
    }
  }

  const leadIds = unique(handoffs.map((row) => resourceLeadId(row.resourceScope)));
  const leads =
    leadIds.length > 0
      ? await client.lead.findMany({
          where: { organizationId, id: { in: leadIds }, deletedAt: null },
          include: { company: true, contact: true },
        })
      : [];
  const accountName =
    leads
      .map(
        (lead) =>
          lead.company?.tradeName || lead.company?.legalName || lead.contact?.name || lead.title,
      )
      .find((name): name is string => typeof name === 'string' && name.length > 0) ??
    'Conta não identificada';

  const executionTraces = executions.map(toExecutionTrace);
  const handoffTraces = handoffs.map(toHandoffTrace);

  const rawNodes = [
    ...executions.map((row) => {
      const node = executionNode(row);
      const director = classifyNode(node, agentDomains);
      return { ...node, director };
    }),
    ...handoffs.map((row) => {
      const node = handoffNode(row, agentNames);
      const director = classifyNode(node, agentDomains);
      return { ...node, director };
    }),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const rootNodes = rawNodes.filter((node) => node.director === 'TAGARELA');
  const specialists = {
    giselle: rawNodes.filter((node) => node.director === 'GISELLE'),
    patricia: rawNodes.filter((node) => node.director === 'PATRICIA'),
    guardiao: rawNodes.filter((node) => node.director === 'GUARDIAO'),
  };

  const hasTagarela = rootNodes.length > 0;
  const status = missionStatus(executionTraces, handoffTraces);

  return {
    missionId,
    requestedMissionId,
    missionKey: missionId,
    generatedAt: new Date().toISOString(),
    title:
      accountName === 'Conta não identificada'
        ? `Missão autônoma ${missionId}`
        : `Missão autônoma ${missionId} — ${accountName}`,
    accountName,
    status,
    root: hasTagarela ? 'Tagarela (Supervisor Geral)' : 'Agent Runtime (execução persistida)',
    rootNodes,
    directors: {
      giselle: {
        status: aggregateDirectorStatus(specialists.giselle),
        specialists: specialists.giselle,
      },
      patricia: {
        status: aggregateDirectorStatus(specialists.patricia),
        specialists: specialists.patricia,
      },
      guardiao: {
        status: aggregateDirectorStatus(specialists.guardiao),
        specialists: specialists.guardiao,
      },
    },
    executions: executionTraces,
    handoffs: handoffTraces,
    consent,
  };
}
