import { api } from '../../../lib/api.js';

export interface VoiceHubConnectionSummary {
  id: string;
  label: string;
  baseUrl: string;
  agentId: string | null;
  enabled: boolean;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  createdAt: string | Date;
}

export interface ColdCallStatusData {
  enabled: boolean;
  window: { startHour: number; endHour: number; daysOfWeek: number[] };
  policy: { maxDailyCalls: number; retryIntervalMinutes: number };
  recentRuns: Array<{
    id: string;
    runAt: string | Date;
    totalAttempted: number;
    totalAnswered: number;
    totalScheduled: number;
    errorSummary?: string | null;
  }>;
}

export interface OutboundCallResult {
  sessionId?: string;
  callSid?: string;
  status: string;
}

export interface SuppressionItem {
  id: string;
  phone: string;
  source: string;
  reason?: string | null;
  leadId?: string | null;
  createdAt: string | Date;
}

export interface ThreeCXConnectionSummary {
  id: string;
  label: string;
  pbxUrl: string;
  extension: string;
  autoDialEnabled: boolean;
  createdAt: string | Date;
}

export interface VoiceCallSummary {
  id: string;
  leadId: string;
  leadTitle: string | null;
  outcome: string;
  durationSeconds: number;
  summary: string | null;
  recordingUrl: string | null;
  createdAt: string | Date;
}

export interface VoiceCallDetail extends VoiceCallSummary {
  transcript: string | null;
  providerCallId?: string;
}

export interface VoiceCallListPage {
  calls: VoiceCallSummary[];
  nextCursor: string | null;
}

export interface VoiceCadenceRunSummary {
  id: string;
  leadId: string;
  sequenceId: string;
  status: string;
  currentTouchIndex: number;
  attempts: Array<{
    touchOrder: number;
    channel: string;
    attemptedAt: string;
    result: string;
    error?: string | null;
  }>;
}

export const voiceHubApi = {
  /** Lista conexões ativas do Birth Voices Hub por organização.
   *  Falhas propagam (throw) — engolir o erro aqui fazia a UI exibir "Aguardando
   *  Configuração"/listas vazias como se fosse estado real do tenant. */
  getConnections: async (): Promise<VoiceHubConnectionSummary[]> => {
    const response = await api.get<
      VoiceHubConnectionSummary[] | { data?: VoiceHubConnectionSummary[] }
    >('/api/integrations/birth-voice/connections');
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  },

  /** Consulta o status da campanha e fila de prospecção fria do SDR de voz */
  getColdCallStatus: async (): Promise<ColdCallStatusData | null> => {
    const response = await api.get<ColdCallStatusData | { data?: ColdCallStatusData }>(
      '/api/integrations/birth-voice/cold-call/status',
    );
    if (response && 'enabled' in response) return response as ColdCallStatusData;
    if (response?.data) return response.data;
    return null;
  },

  /** Dispara uma chamada telefônica do SDR de voz para o lead informado */
  callLead: async (
    leadId: string,
    agentType: 'sdr' | 'nps' | 'reactivation' = 'sdr',
  ): Promise<OutboundCallResult> => {
    const response = await api.post<{ data?: OutboundCallResult; success?: boolean }>(
      `/api/integrations/birth-voice/call/${encodeURIComponent(leadId)}`,
      { agentType },
    );
    if (response && 'status' in response) return response as unknown as OutboundCallResult;
    if (response?.data) return response.data;
    return { status: 'accepted' };
  },

  /** Consulta a lista interna de telefones em opt-out/bloqueio */
  getSuppressions: async (): Promise<SuppressionItem[]> => {
    const response = await api.get<SuppressionItem[] | { data?: SuppressionItem[] }>(
      '/api/integrations/birth-voice/suppressions',
    );
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  },

  /** Registra bloqueio manual de telefone (opt-out imediato LGPD) */
  addSuppression: async (input: {
    phone: string;
    reason?: string;
    leadId?: string;
  }): Promise<void> => {
    await api.post('/api/integrations/birth-voice/suppressions', input);
  },

  /** Lista conexões ativas do PABX 3CX */
  get3CXConnections: async (): Promise<ThreeCXConnectionSummary[]> => {
    const response = await api.get<
      ThreeCXConnectionSummary[] | { data?: ThreeCXConnectionSummary[] }
    >('/api/integrations/3cx/connections');
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  },

  /** Lista as chamadas de voz IA registradas (VoiceCallLog) do tenant — endpoint canônico
   *  `/api/integrations/birth-voice/calls`, que substitui o legado gated `/api/voice-hub/call-logs`
   *  (503 MODULE_NOT_READY — ver handoff 65-para-00-voicehub-503-gate). */
  getVoiceCalls: async (limit = 50): Promise<VoiceCallListPage> => {
    const response = await api.get<
      VoiceCallListPage | { data?: VoiceCallListPage } | { calls?: VoiceCallSummary[] }
    >(`/api/integrations/birth-voice/calls?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const payload =
      response && typeof response === 'object' && 'data' in response && response.data
        ? response.data
        : response;
    const calls =
      payload && typeof payload === 'object' && 'calls' in payload && Array.isArray(payload.calls)
        ? payload.calls
        : [];
    const nextCursor =
      payload && typeof payload === 'object' && 'nextCursor' in payload
        ? ((payload as VoiceCallListPage).nextCursor ?? null)
        : null;
    return { calls, nextCursor };
  },

  /** Detalhe de uma chamada (inclui transcrição integral e URL de gravação). */
  getVoiceCall: async (id: string): Promise<VoiceCallDetail | null> => {
    const response = await api.get<VoiceCallDetail | { data?: VoiceCallDetail }>(
      `/api/integrations/birth-voice/calls/${encodeURIComponent(id)}`,
    );
    if (response && typeof response === 'object' && 'data' in response && response.data) {
      return response.data;
    }
    return (response as VoiceCallDetail) ?? null;
  },

  /** Consulta cadências ativas para verificar toques de voz pendentes */
  getActiveVoiceCadences: async (): Promise<VoiceCadenceRunSummary[]> => {
    const response = await api.get<VoiceCadenceRunSummary[] | { data?: VoiceCadenceRunSummary[] }>(
      '/api/cadence/runs?status=Active',
    );
    const runs = (
      Array.isArray(response) ? response : response?.data || []
    ) as VoiceCadenceRunSummary[];
    return runs.filter((run: VoiceCadenceRunSummary) =>
      run.attempts?.some((attempt: { channel: string }) => attempt.channel === 'voice'),
    );
  },
};
