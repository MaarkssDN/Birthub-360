export type SwarmAgent = 'supervisor' | 'sdr' | 'bdr' | 'closer' | 'crm' | 'ops';
export type SwarmEventType = 'routing' | 'agent_result' | 'agent_error' | 'final';

export interface SwarmEvent {
  type: SwarmEventType;
  agent: SwarmAgent;
  content: string;
  step: number;
  reasoning?: string;
  nextAgent?: 'sdr' | 'bdr' | 'closer' | 'crm' | 'ops';
}

export interface SwarmMessage {
  id: string;
  agent: SwarmAgent;
  text: string;
  timestamp: Date;
  status: 'thinking' | 'done' | 'error';
  kind: 'routing' | 'result' | 'final';
  step: number;
}

export interface SloRate {
  value: number | null;
  numerator: number;
  denominator: number;
  emptyReason?: string;
}

export interface AgentSloMetrics {
  role: 'SDR' | 'BDR' | 'CLOSER' | 'CRM' | 'OPS';
  coverage: number;
  conversion: SloRate;
  humanOverride: SloRate;
  errorRate: SloRate;
  avgExecutionLatencyMs: number | null;
  dataSourceNote?: string;
}

export interface SwarmSloSnapshot {
  organizationId: string;
  windowDays: number;
  generatedAt: string;
  agents: AgentSloMetrics[];
  cost: {
    windowDays: number;
    totalCostUsd: number;
    totalTokens: number;
    requestCount: number;
    avgLatencyMs: number | null;
    note: string;
  };
}

export interface PipelineAgent {
  key: SwarmAgent;
  label: string;
}

export interface SwarmSloPanelProps {
  snapshot: SwarmSloSnapshot | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export type SwarmDashboardView = 'mission' | 'slo' | 'connectors' | 'studio';
