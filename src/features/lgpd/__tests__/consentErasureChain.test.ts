import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConsentAuditChainService,
  InMemoryConsentAuditChainRepository,
  type StoredConsentAuditEvent,
} from '../../../lib/security/consentAuditChain.service.js';
import {
  EnvTenantPepperProvider,
  InMemorySubjectKeyStore,
  SubjectTokenizer,
} from '../../../lib/security/subjectTokenizer.js';

/**
 * MEL-11 (Onda 2, Agente 21): prova ponta a ponta do ciclo de direitos do titular na cadeia de
 * consentimento — consentimento → revogação por exclusão (ERASURE_REQUEST) → outbox ConsentPurgeTask
 * → expurgo executado (dados do titular removidos dos consumidores) → RETRACTION → integridade.
 * Usa repositório/keystore em memória (mesma engine de produção, sem Prisma).
 */
describe('LGPD — consentimento → purge → remoção → integridade da cadeia', () => {
  const ORG = 'org-lgpd-e2e';
  const TITULAR = 'titular@example.com';
  const PEPPER = 'p'.repeat(48); // valor de teste, não é segredo

  let repo: InMemoryConsentAuditChainRepository;
  let chain: ConsentAuditChainService;
  let tokenizer: SubjectTokenizer;
  let keys: InMemorySubjectKeyStore;
  const purgedSubjects: string[] = [];

  beforeEach(() => {
    repo = new InMemoryConsentAuditChainRepository();
    purgedSubjects.length = 0;
    keys = new InMemorySubjectKeyStore();
    tokenizer = new SubjectTokenizer(new EnvTenantPepperProvider(PEPPER), keys);
    chain = new ConsentAuditChainService({ repo, tokenizer });
    // Consumidor de expurgo registrado como no bootstrap (consentPurgeWiring): "dados removidos".
    chain.registerPurger('subject-state', async (_org, subjectRef) => {
      purgedSubjects.push(subjectRef);
      return { flywheelApproaches: 2, autopsyReports: 1 };
    });
  });

  it('consentimento → revogação ERASURE_REQUEST → purge executado → titular removido', async () => {
    // 1. Consentimento registrado (mesmo subjectRef usado por publicLead.service: e-mail).
    await chain.recordConsent({
      organizationId: ORG,
      subjectRef: TITULAR,
      purpose: 'LANDING_DEMO',
      termsVersion: 'landing-demo-v1',
    });

    // 2. Titular exerce exclusão: revogação agenda outbox + shred da chave.
    await chain.revokeConsent(ORG, TITULAR, 'ERASURE_REQUEST', 'admin-1');

    // 3. Outbox processada: `revokeConsent` já tenta processNow; a reconciliação periódica
    // (processPendingPurges) é idempotente — reprocessar não duplica RETRACTION nem purge.
    expect(purgedSubjects).toContain(TITULAR);
    const rerun = await chain.processPendingPurges();
    expect(rerun.done).toBe(0); // já DONE — nada a refazer
    expect(purgedSubjects.filter((s) => s === TITULAR)).toHaveLength(1);

    // 4. Tarefa concluída: subjectRef ANULADO (minimização), status DONE, sem PII residual.
    const tasks = [...repo.purges.values()].filter((t) => t.organizationId === ORG);
    const doneTask = tasks.find((t) => t.status === 'DONE');
    expect(doneTask).toBeDefined();
    expect(doneTask?.subjectRef).toBeNull();
    expect(doneTask?.completedAt).toBeDefined();

    // 5. RETRACTION gravada na cadeia com contagens (sem PII), após o evento REVOCATION.
    const events = (await chain.getChain(ORG)) as StoredConsentAuditEvent[];
    const kinds = events.map((e) => e.kind);
    expect(kinds).toEqual(['GENESIS', 'CONSENT', 'REVOCATION', 'RETRACTION']);
    const retraction = events.at(-1);
    expect(retraction?.status).toBe('REVOKED');
    expect(retraction?.purpose).toContain('revocationEventId');
    expect(retraction?.subjectRef).toMatch(/^hs256:/); // token, nunca e-mail cru

    // 6. Chave do titular destruída (crypto-shredding): isShredded=true e tokenFor falha —
    // o pseudônimo HMAC (lookupId) continua existindo por desenho, mas não religa ao titular.
    expect(await tokenizer.isShredded(ORG, TITULAR)).toBe(true);
    await expect(tokenizer.tokenFor(ORG, TITULAR)).rejects.toThrow(/chave destruída/i);

    // 7. Cadeia íntegra após todo o ciclo.
    const verification = await chain.verifyChainIntegrity(ORG);
    expect(verification).toMatchObject({ valid: true });
  });

  it('cadeia adulterada é detectada pela verificação de integridade', async () => {
    await chain.recordConsent({
      organizationId: ORG,
      subjectRef: TITULAR,
      purpose: 'LANDING_DEMO',
      termsVersion: 'landing-demo-v1',
    });
    await chain.revokeConsent(ORG, TITULAR, 'TITULAR_REQUEST', 'admin-1');
    await chain.processPendingPurges();

    expect((await chain.verifyChainIntegrity(ORG)).valid).toBe(true);

    // Adultera um elo histórico direto no repositório (simula escrita fora da aplicação).
    const tampered = repo.rawChain(ORG);
    const consentEvent = tampered.find((e) => e.kind === 'CONSENT');
    expect(consentEvent).toBeDefined();
    consentEvent!.termsVersion = 'adulterado-pos-fato';

    const verification = await chain.verifyChainIntegrity(ORG);
    expect(verification.valid).toBe(false);
    expect(verification.brokenAtId).toBe(consentEvent!.id);
    expect(['HASH_MISMATCH', 'PREVIOUS_HASH_MISMATCH']).toContain(verification.reason);
  });

  it('truncamento da cauda é detectado via ConsentAuditChainHead', async () => {
    await chain.recordConsent({
      organizationId: ORG,
      subjectRef: TITULAR,
      purpose: 'LANDING_DEMO',
      termsVersion: 'landing-demo-v1',
    });
    await chain.recordConsent({
      organizationId: ORG,
      subjectRef: 'outro@example.com',
      purpose: 'LANDING_DEMO',
      termsVersion: 'landing-demo-v1',
    });

    const head = await repo.getHead(ORG);
    expect(head).not.toBeNull();
    expect(head!.lastSequence).toBeGreaterThan(0);

    // Remove o último elo direto no repositório (simula DELETE malicioso na cauda).
    const chainArr = repo.rawChain(ORG);
    chainArr.pop();

    const verification = await chain.verifyChainIntegrity(ORG);
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe('TRUNCATED');
  });
});
