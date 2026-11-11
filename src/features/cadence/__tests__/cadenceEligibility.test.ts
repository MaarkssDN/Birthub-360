import { describe, expect, it } from 'vitest';
import { evaluateLeadCadenceEligibility } from '../domain/cadenceEligibility.js';
import type { CadenceChannel, OptOutRecord, OptOutScope } from '../domain/optOut.js';

// TAREFA-SANEAMENTO-035 / BT360-DT-0080 — regra pura de elegibilidade de lead para entrada em
// cadência. Cobre as mesmas fontes de bloqueio de checkOptOutStatus (anonimização LGPD, flags em
// customFields de lead/contato, OptOutRecord por leadId/e-mail/telefone com escopo por canal),
// agora também para leads SEM contactId — o gap que a checagem por contato não cobria.

const ORG = 'org-1';
const CHANNELS: CadenceChannel[] = ['email', 'whatsapp'];

function optOutRecord(overrides: Partial<OptOutRecord> = {}): OptOutRecord {
  return {
    id: 'rec-1',
    organizationId: ORG,
    scope: 'global' as OptOutScope,
    leadId: null,
    email: null,
    phoneE164: null,
    originChannel: 'manual',
    reason: null,
    evidence: null,
    requestedBy: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

const baseInput = {
  leadId: 'lead-1',
  subject: { leadId: 'lead-1', email: 'lead@empresa.com', phoneE164: '+5511999998888' },
};

describe('evaluateLeadCadenceEligibility', () => {
  it('lead limpo sem registros de opt-out é elegível', () => {
    const verdict = evaluateLeadCadenceEligibility(baseInput, [], CHANNELS);
    expect(verdict).toEqual({ eligible: true });
  });

  it('contato anonimizado/excluído bloqueia (LGPD Art. 18)', () => {
    const verdict = evaluateLeadCadenceEligibility(
      { ...baseInput, contact: { anonymizedOrDeleted: true, customFields: null } },
      [],
      CHANNELS,
    );
    expect(verdict).toEqual({ eligible: false, reason: 'contact-anonymized' });
  });

  it('flag genérica optOut no lead bloqueia qualquer canal', () => {
    const verdict = evaluateLeadCadenceEligibility(
      { ...baseInput, leadCustomFields: { optOut: true } },
      [],
      CHANNELS,
    );
    expect(verdict).toEqual({ eligible: false, reason: 'opt-out-flag' });
  });

  it('flag por canal no contato só bloqueia quando o canal está na sequência', () => {
    const contact = { anonymizedOrDeleted: false, customFields: { optOutEmail: true } };
    const comEmail = evaluateLeadCadenceEligibility(
      { ...baseInput, contact },
      [],
      ['email', 'whatsapp'],
    );
    expect(comEmail).toEqual({ eligible: false, reason: 'opt-out-flag' });

    const soVoz = evaluateLeadCadenceEligibility({ ...baseInput, contact }, [], ['voice']);
    expect(soVoz).toEqual({ eligible: true });
  });

  it('OptOutRecord por leadId com escopo global bloqueia', () => {
    const verdict = evaluateLeadCadenceEligibility(
      baseInput,
      [optOutRecord({ leadId: 'lead-1', scope: 'global' })],
      CHANNELS,
    );
    expect(verdict).toEqual({ eligible: false, reason: 'opt-out-record', matchedScope: 'global' });
  });

  it('OptOutRecord por e-mail só bloqueia se o escopo cobrir um canal da sequência', () => {
    const record = optOutRecord({ email: 'lead@empresa.com', scope: 'whatsapp' });
    const bloqueado = evaluateLeadCadenceEligibility(baseInput, [record], ['whatsapp']);
    expect(bloqueado.eligible).toBe(false);
    expect(bloqueado.matchedScope).toBe('whatsapp');

    const naoBloqueado = evaluateLeadCadenceEligibility(baseInput, [record], ['email']);
    expect(naoBloqueado).toEqual({ eligible: true });
  });

  it('subjectsMatch NÃO compara organizationId — o isolamento é responsabilidade da query em lote', () => {
    // Documenta o contrato: se um registro de outro tenant chegar até a regra pura, ele casa
    // (subjectsMatch só compara leadId/email/phoneE164). Por isso quem chama DEVE passar apenas
    // registros da própria org — `prismaOptOutRepository.list(organizationId)` já filtra por
    // tenant no banco, e RLS é a segunda camada.
    const verdict = evaluateLeadCadenceEligibility(
      baseInput,
      [optOutRecord({ organizationId: 'org-2', leadId: 'lead-1' })],
      CHANNELS,
    );
    expect(verdict.eligible).toBe(false);
  });

  it('lead sem contactId continua sendo avaliado por leadId/e-mail (gap do checkOptOutStatus)', () => {
    const verdict = evaluateLeadCadenceEligibility(
      {
        leadId: 'lead-99',
        subject: { leadId: 'lead-99', email: null, phoneE164: null },
      },
      [optOutRecord({ leadId: 'lead-99', scope: 'email' })],
      ['email'],
    );
    expect(verdict).toEqual({
      eligible: false,
      reason: 'opt-out-record',
      matchedScope: 'email',
    });
  });
});
