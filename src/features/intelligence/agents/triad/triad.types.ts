/**
 * Contratos de Tipos da Tríade de Comando do Agente Comercial de Elite (Birth Hub 360).
 *
 * Estrutura:
 * - Tagarela: Supervisor Central / Router de Alta Alçada.
 * - Giselle: Diretora de Estratégia e Inteligência (ICP, Hipótese de Dor, Valor, Abordagem).
 * - Patrícia: Diretora de Execução e Outbound (Cadência Adaptativa, Next Best Action, Comunicação).
 * - Guardião: Diretor de Governança, Risco e Policy (RBAC, Alçadas, PII/LGPD, Integridade CRM).
 */

export interface TransparentScore {
  score: number; // 0 a 100
  reason: string;
  evidence: string[];
  confidence: number; // 0 a 1
}

export interface DecisionMakerInfo {
  name: string;
  role: string;
  seniority: 'C-Level' | 'Director' | 'Manager' | 'Coordinator' | 'Specialist';
  linkedinUrl?: string;
  email?: string;
  phone?: string;
}

export interface AccountIntelligencePack {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  segment?: string;
  region?: string;
  fleetSize?: number;
  headcount?: number;
  estimatedRevenue?: number;
  decisionMakers: DecisionMakerInfo[];
  technologies: string[];
  competitors: string[];
  recentNewsOrEvents: string[];
  probablePainHypothesis: string[];
}

export interface GiselleStrategyPlan {
  strategyId: string;
  account: AccountIntelligencePack;
  scores: {
    icp: TransparentScore;
    fit: TransparentScore;
    intent: TransparentScore;
    opportunity: TransparentScore;
  };
  targetPersona: DecisionMakerInfo;
  primaryPain: string;
  valueProposition: string;
  recommendedAngle: string;
  recommendedChannel: 'EMAIL' | 'LINKEDIN' | 'PHONE_VOICE' | 'WHATSAPP';
  recommendedTiming: string;
  suggestedCta: string;
  generatedAt: string;
}

export interface CadenceStep {
  day: number;
  channel: 'EMAIL' | 'LINKEDIN' | 'PHONE_VOICE' | 'WHATSAPP';
  actionDescription: string;
  contentTemplate: string;
  status: 'PENDING' | 'SCHEDULED' | 'EXECUTED' | 'WAITING_EVENT';
}

export interface NextBestAction {
  actionId: string;
  title: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'PROPOSAL_REVIEW' | 'MEETING_PROPOSE';
  accountName: string;
  opportunityScore: TransparentScore;
  contactName: string;
  contactRole: string;
  contactPhone?: string;
  contactEmail?: string;
  windowRecommendation: string;
  reasons: string[];
  battlecardHints?: string[];
  suggestedQuestions?: string[];
}

export interface PatriciaExecutionPlan {
  executionId: string;
  strategyId: string;
  cadence: CadenceStep[];
  nextBestAction: NextBestAction;
  generatedAt: string;
}

export type PolicyCategory = 'RBAC' | 'DISCOUNT_MARGIN' | 'LGPD_PII' | 'CRM_INTEGRITY';

export interface GuardiaoPolicyVerdict {
  verdict: 'APPROVED' | 'REQUIRES_APPROVAL' | 'REJECTED';
  ruleId: string;
  category: PolicyCategory;
  details: string;
  requiredRoleForApproval?: 'GERENTE' | 'DIRETOR' | 'ADMIN';
  piiSanitized: boolean;
  auditLog: string;
}

export type AgentCenterDirector = 'TAGARELA' | 'GISELLE' | 'PATRICIA' | 'GUARDIAO';
export type AgentCenterNodeStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DENIED'
  | 'CANCELLED'
  | 'BLOCKED';
export type AgentCenterDirectorStatus = AgentCenterNodeStatus;
export type AgentCenterTraceStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'DENIED'
  | 'CANCELLED';

export interface AgentCenterTraceNode {
  id: string;
  agentCode: string;
  agentName: string;
  roleLabel: string;
  director: AgentCenterDirector;
  status: AgentCenterNodeStatus;
  resultSummary?: string;
  timestamp: string;
}

export interface AgentCenterTraceDirectors {
  giselle: {
    status: AgentCenterDirectorStatus;
    specialists: AgentCenterTraceNode[];
  };
  patricia: {
    status: AgentCenterDirectorStatus;
    specialists: AgentCenterTraceNode[];
  };
  guardiao: {
    status: AgentCenterDirectorStatus;
    specialists: AgentCenterTraceNode[];
  };
}

export interface AgentCenterTrace {
  missionId: string;
  title: string;
  accountName: string;
  status: AgentCenterTraceStatus;
  root: string;
  rootNodes: AgentCenterTraceNode[];
  directors: AgentCenterTraceDirectors;
}

export type MissionExecutionTraceStatus =
  | 'PENDING'
  | 'AUTHORIZING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'DENIED'
  | 'FAILED'
  | 'CANCELLED';

export type MissionHandoffTraceStatus =
  | 'CREATED'
  | 'AUTHORIZING'
  | 'QUEUED'
  | 'ACCEPTED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'DENIED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface MissionPolicyDecisionTrace {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
  riskLevel: string | null;
  accessLevel: string | null;
  toolCode: string | null;
  toolAvailable: boolean;
  bindingVerification: string | null;
  bindingEvidencePath: string | null;
  temporaryGrantId: string | null;
}

export interface MissionToolCallTrace {
  toolCode: string;
  startedAt?: string;
  finishedAt?: string;
  ok?: boolean;
}

export interface MissionAgentExecutionTrace {
  executionId: string;
  agentCode: string;
  agentName: string;
  agentVersion: number | null;
  capabilityCode: string;
  mission: string | null;
  status: MissionExecutionTraceStatus;
  summary: string | null;
  confidence: number | null;
  errorMessage: string | null;
  correlationId: string | null;
  policyDecision: MissionPolicyDecisionTrace | null;
  toolCalls: MissionToolCallTrace[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface MissionHandoffEvidenceTrace {
  sourceAgent: string;
  sourceExecutionId?: string;
  capabilityCode?: string;
  summary: string;
  recordedAt: string;
}

export interface MissionHandoffTrace {
  handoffId: string;
  missionId: string;
  conversationId: string;
  fromAgent: string;
  fromRole: string;
  toAgent: string;
  toRole: string;
  requestType: string;
  requestedCapability: string;
  priority: string;
  status: MissionHandoffTraceStatus;
  effectiveStatus: MissionHandoffTraceStatus;
  depth: number;
  parentHandoffId: string | null;
  executionId: string | null;
  confidence: number | null;
  errorMessage: string | null;
  evidence: MissionHandoffEvidenceTrace[];
  risksCount: number;
  knownFactsCount: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

export interface MissionOrganizationAiConsentTrace {
  granted: boolean;
  consentVersion: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  grantedByUserId: string | null;
}

export interface MissionConsentAuditChainTrace {
  status: 'VERIFIED' | 'INVALID' | 'UNAVAILABLE';
  valid: boolean | null;
  totalRecords: number | null;
  reason: string | null;
  checkedAt: string;
  events: Array<{
    id: string;
    sequence: number;
    kind: string;
    subjectRef: string;
    purpose: string;
    termsVersion: string;
    status: string;
    occurredAt: string;
    previousHash: string;
    currentHash: string;
  }>;
}

export interface MissionConsentTrace {
  organizationAiConsent: MissionOrganizationAiConsentTrace | null;
  externalPiiConsentGranted: boolean;
  auditChain: MissionConsentAuditChainTrace;
}

export interface CommercialMissionTrace extends AgentCenterTrace {
  requestedMissionId: string;
  missionKey: string;
  generatedAt: string;
  executions: MissionAgentExecutionTrace[];
  handoffs: MissionHandoffTrace[];
  consent: MissionConsentTrace;
}

export interface SellerWorkspaceOverview {
  metrics: {
    monthTarget: number;
    targetConfigured?: boolean;
    closedWon: number;
    gap: number;
    influencablePipeline: number;
    commitForecast: number;
    aiForecast: number;
    targetCompletionPercent: number;
  };
  nextBestAction: NextBestAction;
  recentMissions: Array<{
    missionId: string;
    accountName: string;
    opportunityScore: number;
    status: string;
    lastUpdated: string;
  }>;
}
