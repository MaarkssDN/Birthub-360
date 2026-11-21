export const CRM360_PARITY_ENDPOINT_MAP = {
  overview: '/api/crm360/overview',
  leadDetail: '/api/crm360/leads/:leadId',
  leadTimeline: '/api/crm360/leads/:leadId/timeline',
  dealsPipeline: '/api/crm360/deals/pipeline',
  activitiesFeed: '/api/crm360/activities',
  customerHealthScore: '/api/crm360/leads/:leadId/health-score',
  omnichannelInbox: '/api/crm360/inbox',
} as const;

export type Crm360ParityCapability = keyof typeof CRM360_PARITY_ENDPOINT_MAP;

export interface MobileHttpTransportPort {
  request<TResponse>(params: {
    method: 'GET' | 'POST' | 'PATCH';
    path: string;
    tenantId: string;
    query?: Record<string, string | number | undefined>;
    body?: unknown;
  }): Promise<TResponse>;
}

export function resolveCrm360EndpointPath(
  capability: Crm360ParityCapability,
  params?: { leadId?: string },
): string {
  const template = CRM360_PARITY_ENDPOINT_MAP[capability];
  if (template.includes(':leadId')) {
    const cleanLeadId = params?.leadId?.trim();
    if (!cleanLeadId) {
      throw new Error(`leadId é obrigatório para o endpoint CRM360 "${capability}".`);
    }
    return template.replace(':leadId', encodeURIComponent(cleanLeadId));
  }
  return template;
}

export class MobileCrm360ParityClient {
  constructor(private readonly transport: MobileHttpTransportPort) {}

  async fetchOverview<T>(tenantId: string): Promise<T> {
    return this.transport.request<T>({
      method: 'GET',
      path: resolveCrm360EndpointPath('overview'),
      tenantId,
    });
  }

  async fetchLeadTimeline<T>(params: {
    tenantId: string;
    leadId: string;
    cursor?: string;
    limit?: number;
  }): Promise<T> {
    return this.transport.request<T>({
      method: 'GET',
      path: resolveCrm360EndpointPath('leadTimeline', { leadId: params.leadId }),
      tenantId: params.tenantId,
      query: { cursor: params.cursor, limit: params.limit },
    });
  }

  async fetchDealsPipeline<T>(tenantId: string): Promise<T> {
    return this.transport.request<T>({
      method: 'GET',
      path: resolveCrm360EndpointPath('dealsPipeline'),
      tenantId,
    });
  }
}
