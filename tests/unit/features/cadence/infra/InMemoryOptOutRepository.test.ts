import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryOptOutRepository } from '../../../../../src/features/cadence/infra/InMemoryOptOutRepository.js';

describe('InMemoryOptOutRepository — Resolução Handoff 01A-para-17', () => {
  let repo: InMemoryOptOutRepository;
  const orgA = 'tenant-alpha';
  const orgB = 'tenant-beta';

  beforeEach(() => {
    repo = new InMemoryOptOutRepository();
  });

  it('list(orgId) sem limit retorna todos os registros do tenant sem truncar (ex: >200 registros)', async () => {
    // Insere 250 registros para provar que não há truncamento default em 200
    for (let i = 0; i < 250; i++) {
      await repo.create({
        organizationId: orgA,
        scope: 'email',
        email: `lead${i}@empresa.com`,
        phoneE164: null,
        leadId: `lead-${i}`,
        reason: 'Solicitação formal de opt-out',
        evidenceRef: 'msg-ref',
        originChannel: 'email',
      });
    }

    const records = await repo.list(orgA);
    expect(records).toHaveLength(250);
  });

  it('list(orgId, limit) com limit especificado aplica clamp entre 1 e 500', async () => {
    for (let i = 0; i < 50; i++) {
      await repo.create({
        organizationId: orgA,
        scope: 'whatsapp',
        email: null,
        phoneE164: `+55119999900${i.toString().padStart(2, '0')}`,
        leadId: `lead-${i}`,
        reason: 'Descadastro',
        originChannel: 'whatsapp',
      });
    }

    const limited = await repo.list(orgA, 10);
    expect(limited).toHaveLength(10);

    const clampedMin = await repo.list(orgA, 0);
    expect(clampedMin).toHaveLength(1);
  });

  it('list(orgId) isola estritamente por organizationId', async () => {
    await repo.create({
      organizationId: orgA,
      scope: 'global',
      email: 'a@empresa.com',
      phoneE164: null,
      leadId: 'lead-a',
      originChannel: 'email',
    });
    await repo.create({
      organizationId: orgB,
      scope: 'global',
      email: 'b@empresa.com',
      phoneE164: null,
      leadId: 'lead-b',
      originChannel: 'email',
    });

    const recordsA = await repo.list(orgA);
    const recordsB = await repo.list(orgB);

    expect(recordsA).toHaveLength(1);
    expect(recordsA[0].organizationId).toBe(orgA);
    expect(recordsB).toHaveLength(1);
    expect(recordsB[0].organizationId).toBe(orgB);
  });

  it('findMatches localiza opt-outs por leadId, email ou telefone com isolamento de tenant', async () => {
    await repo.create({
      organizationId: orgA,
      scope: 'global',
      email: 'contato@cliente.com',
      phoneE164: '+5511988887777',
      leadId: 'lead-match-1',
      originChannel: 'email',
    });

    const matchEmail = await repo.findMatches(orgA, {
      leadId: null,
      email: 'contato@cliente.com',
      phoneE164: null,
    });
    expect(matchEmail).toHaveLength(1);

    const matchPhone = await repo.findMatches(orgA, {
      leadId: null,
      email: null,
      phoneE164: '+5511988887777',
    });
    expect(matchPhone).toHaveLength(1);

    const matchOtherOrg = await repo.findMatches(orgB, {
      leadId: null,
      email: 'contato@cliente.com',
      phoneE164: null,
    });
    expect(matchOtherOrg).toHaveLength(0);
  });

  it('clear esvazia todos os registros em memória', async () => {
    await repo.create({
      organizationId: orgA,
      scope: 'global',
      email: 'clear@teste.com',
      phoneE164: null,
      leadId: 'lead-clear',
      originChannel: 'email',
    });

    repo.clear();
    const records = await repo.list(orgA);
    expect(records).toHaveLength(0);
  });
});
