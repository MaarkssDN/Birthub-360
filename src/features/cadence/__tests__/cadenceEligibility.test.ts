import { beforeEach, describe, expect, it } from 'vitest';
import { checkCadenceStartEligibility } from '../application/cadenceEligibility.js';
import type { LeadSubjectResolver } from '../application/cadenceService.js';
import { recordOptOut } from '../application/optOutService.js';
import type { OptOutRepository, OptOutSubject } from '../domain/optOut.js';
import { InMemoryOptOutRepository } from '../infra/InMemoryOptOutRepository.js';

/**
 * TAREFA-SANEAMENTO-035 / BT360-DT-0080 — filtro prévio de opt-out em lote no início da cadência.
 * Cobre o caminho de sucesso (lead elegível para todos os canais da sequência) e os de falha
 * (opt-out global, opt-out de canal presente na sequência, lead sem contato — só leadId).
 */

const ORG = 'org-1';
const OTHER_ORG = 'org-2';
const LEAD_ID = 'lead-1';

function resolverFor(subject: OptOutSubject): LeadSubjectResolver {
  return { resolve: async () => subject };
}

function depsFor(repo: OptOutRepository, subject: OptOutSubject) {
  return { optOutRepo: repo, subjectResolver: resolverFor(subject) };
}

describe('checkCadenceStartEligibility', () => {
  let repo: InMemoryOptOutRepository;

  beforeEach(() => {
    repo = new InMemoryOptOutRepository();
  });

  it('lead sem nenhum opt-out é elegível para uma sequência multicanal', async () => {
    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID, email: 'lead@empresa.com', phoneE164: '+5511999998888' }),
      ORG,
      LEAD_ID,
      ['email', 'whatsapp', 'voice'],
    );

    expect(result).toEqual({ eligible: true, blockedChannel: null, reason: null });
  });

  it('opt-out global bloqueia o início independente dos canais da sequência', async () => {
    await recordOptOut(repo, {
      organizationId: ORG,
      scope: 'global',
      subject: { leadId: LEAD_ID },
      originChannel: 'whatsapp',
    });

    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID }),
      ORG,
      LEAD_ID,
      ['email'],
    );

    expect(result.eligible).toBe(false);
    expect(result.blockedChannel).toBe('email');
  });

  it('opt-out de canal presente na sequência bloqueia (ex.: voice em run email→voice)', async () => {
    await recordOptOut(repo, {
      organizationId: ORG,
      scope: 'voice',
      subject: { leadId: LEAD_ID },
      originChannel: 'voice',
    });

    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID }),
      ORG,
      LEAD_ID,
      ['email', 'voice'],
    );

    expect(result.eligible).toBe(false);
    expect(result.blockedChannel).toBe('voice');
  });

  it('opt-out de canal FORA da sequência não bloqueia (escopo por canal, não veto total)', async () => {
    await recordOptOut(repo, {
      organizationId: ORG,
      scope: 'voice',
      subject: { leadId: LEAD_ID },
      originChannel: 'voice',
    });

    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID }),
      ORG,
      LEAD_ID,
      ['email', 'whatsapp'],
    );

    expect(result.eligible).toBe(true);
  });

  it('lead sem contactId (só leadId) continua coberto — opt-out por leadId bloqueia', async () => {
    await recordOptOut(repo, {
      organizationId: ORG,
      scope: 'email',
      subject: { leadId: LEAD_ID },
      originChannel: 'email',
    });

    // Sujeito resolvido sem e-mail/telefone — o caso que a checagem antiga (só via contactId)
    // não alcançava.
    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID, email: null, phoneE164: null }),
      ORG,
      LEAD_ID,
      ['email'],
    );

    expect(result.eligible).toBe(false);
    expect(result.blockedChannel).toBe('email');
  });

  it('opt-out casa por e-mail/telefone mesmo quando o leadId é outro', async () => {
    await recordOptOut(repo, {
      organizationId: ORG,
      scope: 'whatsapp',
      subject: { email: 'lead@empresa.com' },
      originChannel: 'whatsapp',
    });

    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: 'outro-lead', email: 'LEAD@empresa.com' }),
      ORG,
      'outro-lead',
      ['whatsapp'],
    );

    expect(result.eligible).toBe(false);
  });

  it('opt-out de OUTRA organização não bloqueia (isolamento de tenant)', async () => {
    await recordOptOut(repo, {
      organizationId: OTHER_ORG,
      scope: 'global',
      subject: { leadId: LEAD_ID },
      originChannel: 'manual',
    });

    const result = await checkCadenceStartEligibility(
      depsFor(repo, { leadId: LEAD_ID }),
      ORG,
      LEAD_ID,
      ['email', 'whatsapp', 'voice'],
    );

    expect(result.eligible).toBe(true);
  });

  it('canais duplicados na sequência são consultados uma única vez', async () => {
    let probes = 0;
    const countingRepo: OptOutRepository = {
      create: (r) => repo.create(r),
      findMatches: async (org, subject) => {
        probes += 1;
        return repo.findMatches(org, subject);
      },
      list: (org, limit) => repo.list(org, limit),
    };

    await checkCadenceStartEligibility(depsFor(countingRepo, { leadId: LEAD_ID }), ORG, LEAD_ID, [
      'email',
      'email',
      'whatsapp',
    ]);

    // 2 canais distintos → 2 consultas (1 findMatches por canal via isOptedOut).
    expect(probes).toBe(2);
  });

  it('erro do resolvedor de sujeito propaga — nunca trata falha como elegível', async () => {
    const failingResolver: LeadSubjectResolver = {
      resolve: async () => {
        throw new Error('banco indisponível');
      },
    };

    await expect(
      checkCadenceStartEligibility(
        { optOutRepo: repo, subjectResolver: failingResolver },
        ORG,
        LEAD_ID,
        ['email'],
      ),
    ).rejects.toThrow('banco indisponível');
  });
});
