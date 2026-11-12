export interface CallLogEntry {
  id: string;
  contactName?: string;
  duration?: string;
  agent?: string;
  status?: string;
  time?: string;
  timestamp?: string;
}

export interface AgentRecord {
  id: string;
  name: string;
  model: string;
  phoneNumber?: string;
  updatedAt?: string;
}

export interface ReadyChecks {
  database: 'ok' | 'error';
  redis: 'ok' | 'error';
}

// One row of GET /api/metrics — see prisma/schema.prisma `Metric`. For SLA we only care about
// `name === 'platform_ready_check'` rows (Agente 10, src/services/slaScheduler.ts): a real
// Postgres+Redis health check sampled every ~5 minutes and persisted per tenant, never fabricated.
export interface MetricEntry {
  id: string;
  name: string;
  value: number;
  tags?: Record<string, unknown>;
  timestamp: string;
}

export type FetchStatus = 'loading' | 'ready' | 'error';

export interface CallsFetchState {
  status: FetchStatus;
  calls: CallLogEntry[];
}

export interface AgentsFetchState {
  status: FetchStatus;
  agents: AgentRecord[];
}

export interface ReadyFetchState {
  status: FetchStatus;
  checks: ReadyChecks | null;
}

export interface MetricsFetchState {
  status: FetchStatus;
  metrics: MetricEntry[];
}
