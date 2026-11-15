// Auditoria de tenancy do Voice Hub (Agente 12 — Onda F2, handoff
// .agents/handoffs/00-para-12-17-voicehub-reactivacao.md).
//
// Estes testes congelam o invariante que o handoff exige antes de reabrir o
// legacyModuleGate: toda leitura/escrita por id DEVE passar por uma busca
// prévia com `organizationId` (ou `userId` derivado da sessão) e responder
// 404/NotFound — nunca 403 (não vazar a existência do recurso de outro tenant)
// e nunca executar o update/delete quando o recurso não pertence ao tenant.
//
// Escopo: services + a garantia estrutural de que cada router de
// src/lib/voice-hub/routes aplica `requireTenant` (ou autenticação equivalente
// documentada — assinatura Twilio em telephony.routes.ts).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

vi.mock('../repositories/callLogRepository.js', () => ({
  listCallLogsForTenant: vi.fn(),
  createCallLog: vi.fn(),
  findCallLogForTenant: vi.fn(),
  updateCallLog: vi.fn(),
  deleteCallLog: vi.fn(),
  deleteCallLogsOlderThan: vi.fn(),
}));

vi.mock('../repositories/sessionRepository.js', () => ({
  listSessionsForUser: vi.fn(),
  createSession: vi.fn(),
  findSessionForUser: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  createPhoneSession: vi.fn(),
  findSessionById: vi.fn(),
  findActivePhoneSessionByCallSid: vi.fn(),
  createInboundPhoneSessionIfNoneForCallSid: vi.fn(),
  createOutboundPhoneSessionIfNoneInFlight: vi.fn(),
}));

vi.mock('../repositories/agentRepository.js', () => ({
  listAgentsForTenant: vi.fn(),
  getAgent: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgentForTenant: vi.fn(),
  findAgentByPhoneNumber: vi.fn(),
  findAgentById: vi.fn(),
}));

vi.mock('../repositories/apiKeyRepository.js', () => ({
  createApiKey: vi.fn(),
  listApiKeysForTenant: vi.fn(),
  findApiKeyForTenant: vi.fn(),
  findApiKeyByHash: vi.fn(),
  revokeApiKey: vi.fn(),
  touchLastUsed: vi.fn(),
}));

vi.mock('../repositories/userRepository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  findMembershipWithRole: vi.fn(),
  createMembership: vi.fn(),
  listUsersForTenant: vi.fn(),
  updateUser: vi.fn(),
  softDeleteUser: vi.fn(),
  anonymizeUser: vi.fn(),
  updateMembershipRole: vi.fn(),
}));

vi.mock('../repositories/roleRepository.js', () => ({
  getOrCreateSystemRole: vi.fn(),
  getPermissionsForRoleName: vi.fn(),
  permissionNamesOf: vi.fn(() => []),
}));

vi.mock('../repositories/webhookEndpointRepository.js', () => ({
  countActiveEndpointsForTenant: vi.fn(),
  createEndpoint: vi.fn(),
  listEndpointsForTenant: vi.fn(),
  listActiveEndpointsForTenant: vi.fn(),
  findEndpointForTenant: vi.fn(),
  findActiveEndpointById: vi.fn(),
  deleteEndpoint: vi.fn(),
  regenerateSecret: vi.fn(),
  recordDeliveryResult: vi.fn(),
}));

import * as callLogRepository from '../repositories/callLogRepository.js';
import * as sessionRepository from '../repositories/sessionRepository.js';
import * as agentRepository from '../repositories/agentRepository.js';
import * as apiKeyRepository from '../repositories/apiKeyRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import * as webhookEndpointRepository from '../repositories/webhookEndpointRepository.js';
import {
  updateCallLog,
  deleteCallLog,
  NotFoundError as CallLogNotFoundError,
} from '../services/callLogService.js';
import {
  updateSession,
  deleteSession,
  NotFoundError as SessionNotFoundError,
} from '../services/sessionService.js';
import { updateAgentConfig, getAgent, deleteAgent } from '../services/agentService.js';
import {
  revokeApiKeyForTenant,
  authenticateApiKey,
  ApiKeyServiceError,
} from '../services/apiKeyService.js';
import {
  updateUserProfile,
  deleteUser,
  anonymizeUserData,
  UserServiceError,
} from '../services/userService.js';
import {
  deleteWebhookEndpointForTenant,
  regenerateWebhookEndpointSecret,
  WebhookEndpointServiceError,
} from '../services/webhookEndpointService.js';

beforeEach(() => vi.clearAllMocks());

const ORG_A = 'org-tenant-a';
const ORG_B = 'org-tenant-b';

describe('callLogService — isolamento por organizationId', () => {
  it('updateCallLog nega update cross-tenant e não toca o repositório', async () => {
    vi.mocked(callLogRepository.findCallLogForTenant).mockResolvedValue(null);

    await expect(updateCallLog('log-de-A', ORG_B, { status: 'ok' })).rejects.toBeInstanceOf(
      CallLogNotFoundError,
    );
    expect(callLogRepository.findCallLogForTenant).toHaveBeenCalledWith('log-de-A', ORG_B);
    expect(callLogRepository.updateCallLog).not.toHaveBeenCalled();
  });

  it('deleteCallLog nega delete cross-tenant e não toca o repositório', async () => {
    vi.mocked(callLogRepository.findCallLogForTenant).mockResolvedValue(null);

    await expect(deleteCallLog('log-de-A', ORG_B)).rejects.toBeInstanceOf(CallLogNotFoundError);
    expect(callLogRepository.deleteCallLog).not.toHaveBeenCalled();
  });

  it('updateCallLog do próprio tenant prossegue normalmente', async () => {
    vi.mocked(callLogRepository.findCallLogForTenant).mockResolvedValue({ id: 'log-1' } as any);
    vi.mocked(callLogRepository.updateCallLog).mockResolvedValue({ id: 'log-1' } as any);

    await updateCallLog('log-1', ORG_A, { status: 'ok' });
    expect(callLogRepository.updateCallLog).toHaveBeenCalledWith('log-1', { status: 'ok' });
  });
});

describe('sessionService — isolamento por organizationId + userId', () => {
  it('updateSession nega sessão de outro tenant/usuário', async () => {
    vi.mocked(sessionRepository.findSessionForUser).mockResolvedValue(null);

    await expect(
      updateSession('sess-de-A', ORG_B, 'user-b', { status: 'ended' }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
    expect(sessionRepository.findSessionForUser).toHaveBeenCalledWith('sess-de-A', ORG_B, 'user-b');
    expect(sessionRepository.updateSession).not.toHaveBeenCalled();
  });

  it('deleteSession nega sessão de outro tenant/usuário', async () => {
    vi.mocked(sessionRepository.findSessionForUser).mockResolvedValue(null);

    await expect(deleteSession('sess-de-A', ORG_B, 'user-b')).rejects.toBeInstanceOf(
      SessionNotFoundError,
    );
    expect(sessionRepository.deleteSession).not.toHaveBeenCalled();
  });
});

describe('agentService — isolamento por organizationId', () => {
  it('getAgent sempre consulta com o organizationId da sessão', async () => {
    vi.mocked(agentRepository.getAgent).mockResolvedValue(null);

    await getAgent('agent-1', ORG_A);
    expect(agentRepository.getAgent).toHaveBeenCalledWith('agent-1', ORG_A);
  });

  it('updateAgentConfig de outro tenant falha antes de escrever', async () => {
    vi.mocked(agentRepository.getAgent).mockResolvedValue(null);

    await expect(updateAgentConfig('agent-de-A', ORG_B, { voice: 'x' } as any)).rejects.toThrow(
      'Agente não encontrado',
    );
    expect(agentRepository.updateAgent).not.toHaveBeenCalled();
  });

  it('deleteAgent delega com escopo de tenant (updateMany where id+organizationId)', async () => {
    vi.mocked(agentRepository.deleteAgentForTenant).mockResolvedValue({ count: 0 } as any);

    await deleteAgent('agent-1', ORG_B);
    expect(agentRepository.deleteAgentForTenant).toHaveBeenCalledWith('agent-1', ORG_B);
  });
});

describe('apiKeyService — isolamento por organizationId', () => {
  it('revokeApiKeyForTenant nega revogação cross-tenant (404, não 403)', async () => {
    vi.mocked(apiKeyRepository.findApiKeyForTenant).mockResolvedValue(null);

    await expect(revokeApiKeyForTenant(ORG_B, 'key-de-A')).rejects.toBeInstanceOf(
      ApiKeyServiceError,
    );
    expect(apiKeyRepository.findApiKeyForTenant).toHaveBeenCalledWith('key-de-A', ORG_B);
    expect(apiKeyRepository.revokeApiKey).not.toHaveBeenCalled();
  });

  it('authenticateApiKey falha fechado quando o dono da chave não pertence mais ao tenant da chave', async () => {
    vi.mocked(apiKeyRepository.findApiKeyByHash).mockResolvedValue({
      id: 'key-1',
      organizationId: ORG_A,
      createdByUserId: 'user-1',
      revokedAt: null,
      expiresAt: null,
    } as any);
    // Usuário real hoje pertence a OUTRO tenant — chave não pode mais autenticar.
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      organizationId: ORG_B,
    } as any);

    const result = await authenticateApiKey('bh360_test_key_value');
    expect(result).toBeNull();
  });
});

describe('userService — isolamento por organizationId', () => {
  const adminA = { id: 'admin-a', role: 'admin' };

  it('updateUserProfile nega alteração de usuário de outro tenant', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-de-A',
      organizationId: ORG_A,
    } as any);

    await expect(
      updateUserProfile('user-de-A', ORG_B, adminA, { companyName: 'Invadido' }),
    ).rejects.toBeInstanceOf(UserServiceError);
    expect(userRepository.updateUser).not.toHaveBeenCalled();
  });

  it('deleteUser nega exclusão de usuário de outro tenant', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-de-A',
      organizationId: ORG_A,
    } as any);

    await expect(deleteUser('user-de-A', ORG_B, 'admin-b')).rejects.toBeInstanceOf(
      UserServiceError,
    );
    expect(userRepository.softDeleteUser).not.toHaveBeenCalled();
  });

  it('anonymizeUserData (LGPD) nega anonimização cross-tenant', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-de-A',
      organizationId: ORG_A,
    } as any);

    await expect(anonymizeUserData('user-de-A', ORG_B, adminA)).rejects.toBeInstanceOf(
      UserServiceError,
    );
    expect(userRepository.anonymizeUser).not.toHaveBeenCalled();
  });
});

describe('webhookEndpointService — isolamento por organizationId', () => {
  it('deleteWebhookEndpointForTenant nega delete cross-tenant (404)', async () => {
    vi.mocked(webhookEndpointRepository.findEndpointForTenant).mockResolvedValue(null);

    await expect(deleteWebhookEndpointForTenant(ORG_B, 'ep-de-A')).rejects.toBeInstanceOf(
      WebhookEndpointServiceError,
    );
    expect(webhookEndpointRepository.findEndpointForTenant).toHaveBeenCalledWith('ep-de-A', ORG_B);
    expect(webhookEndpointRepository.deleteEndpoint).not.toHaveBeenCalled();
  });

  it('regenerateWebhookEndpointSecret nega rotação de segredo cross-tenant', async () => {
    vi.mocked(webhookEndpointRepository.findEndpointForTenant).mockResolvedValue(null);

    await expect(regenerateWebhookEndpointSecret(ORG_B, 'ep-de-A')).rejects.toBeInstanceOf(
      WebhookEndpointServiceError,
    );
    expect(webhookEndpointRepository.regenerateSecret).not.toHaveBeenCalled();
  });
});

describe('garantia estrutural — todo router de voz exige requireTenant', () => {
  // Exceções documentadas:
  // - telephony.routes.ts: webhooks Twilio autenticados por assinatura X-Twilio-Signature
  //   (validateTwilioSignature), não por sessão — o tenant é resolvido pelo Agent.phoneNumber.
  // - health.routes.ts: health/readiness probes, sem dados de tenant (e nem é montado em
  //   routes/index.ts — createHealthRouter é exportado para uso externo).
  const ROUTES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'routes');
  const EXEMPT = new Set(['telephony.routes.ts', 'health.routes.ts']);

  const routeFiles = readdirSync(ROUTES_DIR).filter(
    (f) => f.endsWith('.routes.ts') && !EXEMPT.has(f),
  );

  it('encontra os routers de voz para auditar', () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(15);
  });

  for (const file of routeFiles) {
    it(`${file} aplica requireTenant`, () => {
      const src = readFileSync(join(ROUTES_DIR, file), 'utf8');
      expect(src).toContain('requireTenant');
    });
  }
});
