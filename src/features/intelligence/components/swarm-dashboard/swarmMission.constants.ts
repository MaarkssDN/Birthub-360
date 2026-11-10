import type { AgentSloMetrics, PipelineAgent, SloRate, SwarmAgent } from './swarm.types.js';

export const MISSION_SUGGESTIONS: readonly string[] = [
  'Acabei de importar um lead da empresa "TransLogística Express" (frota de 50 caminhões, faturamento alto). Qualifique o risco, avalie o fit outbound e sugira a próxima ação.',
  'Analise os negócios em risco no funil desta semana e recomende os próximos passos para cada um.',
  'Preciso de uma linha de abordagem fria para um lead do segmento logístico que ainda não respondeu.',
  'Temos uma proposta enviada e o comprador levantou objeção de preço. Monte a estratégia de fechamento sem sacrificar margem.',
  'Varra nossos e-mails (Outlook, Gmail e IMAP) para identificar oportunidades quentes, crie tarefas no Trello/Monday/Notion e dispare um alerta rápido no Celular e no Relógio (Smartwatch).',
  'Descubra empresas de Logística e Indústria em SP, enriqueça os decisores no CRM, gere uma planilha Excel (.xlsx) de prospecção e salve os scripts de Cold Call e WhatsApp.',
];

export const PIPELINE_AGENTS: PipelineAgent[] = [
  { key: 'sdr', label: 'SDR' },
  { key: 'bdr', label: 'BDR' },
  { key: 'closer', label: 'CLOSER' },
  { key: 'crm', label: 'CRM' },
  { key: 'ops', label: 'OPS' },
];

export const AGENT_NAMES: Record<SwarmAgent, string> = {
  supervisor: 'Supervisor (Orquestrador)',
  sdr: 'SDR Autônomo',
  bdr: 'BDR (Outbound)',
  closer: 'Closer Autônomo',
  crm: 'Gestor de CRM',
  ops: 'Agente de Operações',
};

export function getAgentName(agent: string): string {
  if (agent in AGENT_NAMES) {
    return AGENT_NAMES[agent as SwarmAgent];
  }
  return 'Agente';
}

export const SLO_ROLE_LABEL: Record<AgentSloMetrics['role'], string> = {
  SDR: 'SDR Autônomo',
  BDR: 'BDR (Outbound)',
  CLOSER: 'Closer Autônomo',
  CRM: 'Gestor de CRM',
  OPS: 'Agente de Operações',
};

export const SLO_ROLE_COLOR: Record<AgentSloMetrics['role'], string> = {
  SDR: 'var(--color-heading-cyan)',
  BDR: 'var(--color-heading-success)',
  CLOSER: 'var(--color-heading-pink)',
  CRM: 'var(--color-heading-iris)',
  OPS: 'var(--color-heading-gold)',
};

export function formatPercent(rate: SloRate): string {
  if (rate.value === null) return '—';
  return `${Math.round(rate.value * 100)}%`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1_000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
