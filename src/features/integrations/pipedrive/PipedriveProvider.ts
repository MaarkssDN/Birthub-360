/**
 * PipedriveProvider — CRM connector para Pipedrive (API Key ou OAuth 2.0).
 *
 * Autenticação: API Token via header `x-api-token` (não via query string — token em URL vaza
 * para logs de proxy/APM; a API do Pipedrive aceita o token nesse header) ou OAuth via Bearer.
 * Docs: https://developers.pipedrive.com/docs/api/v1
 */

import { fetchWithProviderRetry } from '@/lib/enrichment/providerFetch.js';
import {
  type CrmConnectionConfig,
  type CrmProvider,
  type NormalizedLead,
  registerCrmProvider,
} from '../shared/CrmProvider.js';

const PIPEDRIVE_BASE = 'https://api.pipedrive.com/v1';
const PIPEDRIVE_ALLOWED_HOSTS = ['api.pipedrive.com'] as const;

async function pipedriveRequest<T>(
  path: string,
  config: CrmConnectionConfig,
  options: RequestInit = {},
): Promise<T> {
  const url = `${PIPEDRIVE_BASE}${path}`;

  // Token NUNCA vai na query string (vazaria em logs de proxy/APM/URL). A API do Pipedrive
  // aceita o API token no header `x-api-token`; tokens OAuth vão em `Authorization: Bearer`.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (config.apiKey) {
    headers['x-api-token'] = config.apiKey;
  } else if (config.accessToken) {
    headers.Authorization = `Bearer ${config.accessToken}`;
  }

  const res = await fetchWithProviderRetry(
    url,
    { ...options, headers },
    { providerName: 'pipedrive', timeoutMs: 15_000, allowedHosts: PIPEDRIVE_ALLOWED_HOSTS },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Pipedrive] ${res.status} ${res.statusText}: ${body}`);
  }

  const json = (await res.json()) as { success: boolean; data: T; additional_data?: unknown };
  if (!json.success) {
    throw new Error(`[Pipedrive] API returned success=false for ${path}`);
  }
  return json.data;
}

function mapPipedriveDeal(deal: Record<string, unknown>): NormalizedLead {
  return {
    externalId: String(deal.id),
    name: String(deal.title ?? 'Sem nome'),
    email: (deal.person_id as Record<string, unknown>)?.email
      ? String(((deal.person_id as Record<string, unknown>).email as unknown[])[0] ?? '')
      : undefined,
    company: deal.org_name ? String(deal.org_name) : undefined,
    amount: deal.value ? Number(deal.value) : undefined,
    stageLabel: deal.stage_name ? String(deal.stage_name) : undefined,
    status: deal.status ? String(deal.status) : undefined,
    source: 'pipedrive',
    metadata: {
      pipelineId: deal.pipeline_id,
      stageId: deal.stage_id,
      ownerId: deal.user_id,
    },
  };
}

const PipedriveProvider: CrmProvider = {
  providerKey: 'pipedrive',
  displayName: 'Pipedrive',
  authType: 'api_key',

  async listLeads(config, lastImportedAt, cursor) {
    const start = cursor ? Number(cursor) : 0;
    const params = new URLSearchParams({
      limit: '100',
      start: start.toString(),
      status: 'open',
    });

    if (lastImportedAt) {
      // Pipedrive supports `since_timestamp` filter
      params.set('since_timestamp', lastImportedAt.toISOString().split('T')[0]);
    }

    const data = await pipedriveRequest<Record<string, unknown>[]>(`/deals?${params}`, config);

    const deals = Array.isArray(data) ? data : [];
    const nextCursor = deals.length === 100 ? String(start + 100) : undefined;

    return {
      leads: deals.map(mapPipedriveDeal),
      nextCursor,
    };
  },

  async pushLead(config, lead, externalId) {
    const body = {
      title: lead.name,
      value: lead.amount,
      status: 'open',
    };

    if (externalId) {
      await pipedriveRequest(`/deals/${externalId}`, config, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return { externalId };
    }

    const created = await pipedriveRequest<{ id: number }>('/deals', config, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      externalId: String(created.id),
      url: `https://app.pipedrive.com/deal/${created.id}`,
    };
  },

  async validateConnection(config) {
    try {
      await pipedriveRequest('/deals?limit=1', config);
      return true;
    } catch {
      return false;
    }
  },
};

registerCrmProvider(PipedriveProvider);
