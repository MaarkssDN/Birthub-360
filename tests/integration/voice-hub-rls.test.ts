import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import {
  createPhoneSession,
  findActivePhoneSessionByCallSid,
  findSessionById,
} from '../../src/lib/voice-hub/repositories/sessionRepository.js';
import {
  findBirthub360CallResultByCallId,
  listBirthub360CallResultsForTenant,
  upsertBirthub360CallResult,
} from '../../src/lib/voice-hub/repositories/birthhub360CallResultRepository.js';
import { findTenantById } from '../../src/lib/voice-hub/repositories/tenantRepository.js';

/**
 * Handoff `.agents/handoffs/onda-3/00-para-12-voicehub-teste-integracao-rls.md`:
 * prova, contra Postgres real com RLS ligada (FORCE ROW LEVEL SECURITY), o isolamento
 * dos repositories do voice-hub adaptados aos models canônicos (PR #339):
 *
 *  - `AgentSession`      → sessionRepository (sessionRepository.ts)
 *  - `Birthub360CallResult` → birthhub360CallResultRepository.ts
 *  - `Organization`      → tenantRepository.ts (policy `tenant_isolation` = current_tenant = id)
 *
 * As policies `tenant_isolation` das tabelas de voz (migration 20260925000000_voice_hub_rls)
 * NÃO têm cláusula `bypass_rls` — diferente de Organization/AILog — então `bypassRls` no
 * requestContext não abre essas tabelas: o teste "bypassRls não abre tabelas de voz"
 * documenta esse comportamento fail-closed como parte do contrato auditado.
 *
 * ORG_A = 'test-org-id' é semeada por tests/helpers/integration-setup.ts.
 */

const RUN_ID = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const ORG_A = 'test-org-id';
const ORG_B = `test-voicehub-rls-b-${RUN_ID}`;

const CALL_SID_A = `CA-voicehub-rls-a-${RUN_ID}`;
const CALL_SID_B = `CA-voicehub-rls-b-${RUN_ID}`;
const CALL_RESULT_A = `vh-rls-call-a-${RUN_ID}`;
const CALL_RESULT_B = `vh-rls-call-b-${RUN_ID}`;

const asOrg = <T>(organizationId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId: organizationId }, fn);
const asBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);

let sessionAId = '';
let sessionBId = '';

async function cleanup() {
  // Tabelas de voz não admitem bypassRls na policy — a limpeza precisa rodar dentro do
  // tenant de cada organização, senão o RLS esconde as próprias linhas do deleteMany.
  for (const org of [ORG_A, ORG_B]) {
    await asOrg(org, async () => {
      await prisma.agentSession.deleteMany({
        where: { organizationId: org, channel: 'phone' },
      });
      await prisma.birthub360CallResult.deleteMany({
        where: { callId: { in: [CALL_RESULT_A, CALL_RESULT_B] } },
      });
    });
  }
  await asBypass(() => prisma.organization.deleteMany({ where: { id: ORG_B } }));
}

describe('voice-hub repositories — isolamento RLS real (Postgres)', () => {
  beforeAll(async () => {
    await cleanup();
    await asBypass(() =>
      prisma.organization.create({ data: { id: ORG_B, name: `Test Org VoiceHub RLS B ${RUN_ID}` } }),
    );

    const seededA = await asOrg(ORG_A, () =>
      createPhoneSession(ORG_A, 'agent-rls-a', { callSid: CALL_SID_A, direction: 'inbound' }),
    );
    sessionAId = seededA.id;
    await asOrg(ORG_A, () =>
      upsertBirthub360CallResult({
        callId: CALL_RESULT_A,
        organizationId: ORG_A,
        status: 'completed',
        completed: true,
        callLength: 42,
      }),
    );

    const seededB = await asOrg(ORG_B, () =>
      createPhoneSession(ORG_B, 'agent-rls-b', { callSid: CALL_SID_B, direction: 'inbound' }),
    );
    sessionBId = seededB.id;
    await asOrg(ORG_B, () =>
      upsertBirthub360CallResult({
        callId: CALL_RESULT_B,
        organizationId: ORG_B,
        status: 'completed',
        completed: true,
        callLength: 17,
      }),
    );
  });

  afterAll(cleanup);

  it('AgentSession: tenant A não enxerga a sessão do tenant B (findSessionById não filtra org — quem isola é a RLS)', async () => {
    const own = await asOrg(ORG_A, () => findSessionById(sessionAId));
    expect(own?.id).toBe(sessionAId);

    const cross = await asOrg(ORG_A, () => findSessionById(sessionBId));
    expect(cross).toBeNull();
  });

  it('AgentSession: lookup por CallSid respeita o tenant do requestContext', async () => {
    const own = await asOrg(ORG_B, () => findActivePhoneSessionByCallSid(CALL_SID_B));
    expect(own?.id).toBe(sessionBId);

    const cross = await asOrg(ORG_A, () => findActivePhoneSessionByCallSid(CALL_SID_B));
    expect(cross).toBeNull();
  });

  it('AgentSession: escrita cross-tenant é rejeitada pelo WITH CHECK da policy', async () => {
    await expect(
      asOrg(ORG_A, () =>
        createPhoneSession(ORG_B, 'agent-rls-a', { callSid: `CA-cross-${RUN_ID}` }),
      ),
    ).rejects.toThrow();
  });

  it('Birthub360CallResult: findUnique por callId não vaza resultado de outro tenant', async () => {
    const own = await asOrg(ORG_A, () => findBirthub360CallResultByCallId(CALL_RESULT_A));
    expect(own?.callId).toBe(CALL_RESULT_A);

    const cross = await asOrg(ORG_B, () => findBirthub360CallResultByCallId(CALL_RESULT_A));
    expect(cross).toBeNull();
  });

  it('Birthub360CallResult: listagem tenant-scoped não retorna linhas de outro tenant', async () => {
    const page = await asOrg(ORG_A, () =>
      listBirthub360CallResultsForTenant(ORG_A, { page: 1, pageSize: 50 }),
    );
    expect(page.items.some((r) => r.callId === CALL_RESULT_A)).toBe(true);
    expect(page.items.some((r) => r.callId === CALL_RESULT_B)).toBe(false);
  });

  it('Organization (tenantRepository): tenant A não resolve a org B por id', async () => {
    const own = await asOrg(ORG_A, () => findTenantById(ORG_A));
    expect(own?.id).toBe(ORG_A);

    const cross = await asOrg(ORG_A, () => findTenantById(ORG_B));
    expect(cross).toBeNull();
  });

  it('fail-closed: requestContext sem tenantId não lê nenhuma linha de voz', async () => {
    const session = await requestContext.run({}, () => findSessionById(sessionAId));
    expect(session).toBeNull();

    const callResult = await requestContext.run({}, () =>
      findBirthub360CallResultByCallId(CALL_RESULT_A),
    );
    expect(callResult).toBeNull();
  });

  it('fail-closed: requestContext sem tenantId não escreve em tabelas de voz', async () => {
    await expect(
      requestContext.run({}, () =>
        createPhoneSession(ORG_A, 'agent-rls-a', { callSid: `CA-notenant-${RUN_ID}` }),
      ),
    ).rejects.toThrow();
  });

  it('bypassRls não abre tabelas de voz (policy tenant_isolation não tem cláusula de bypass)', async () => {
    // Diferente de Organization/AILog, as policies das tabelas de voz criadas em
    // 20260925000000_voice_hub_rls não avaliam app.bypass_rls. Sob bypass sem tenantId,
    // current_setting('app.current_tenant_id') = '' e nenhuma linha casa — o caminho de
    // bypass auditado (bootstrap allowlist) não se estende ao domínio de voz.
    const session = await asBypass(() => findSessionById(sessionAId));
    expect(session).toBeNull();

    const callResult = await asBypass(() => findBirthub360CallResultByCallId(CALL_RESULT_A));
    expect(callResult).toBeNull();
  });
});
