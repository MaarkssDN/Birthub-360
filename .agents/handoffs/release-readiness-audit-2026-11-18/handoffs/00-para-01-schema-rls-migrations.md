- De: 00
- Para: 01 (Schema/Migrations/RLS)
- Status: ABERTO
- Prioridade: P1

## Achados

### DEBT-0006 (co) — Fallback global BITRIX24_WEBHOOK_URL — P1, env-dependente
`LeadUseCases.ts:570-576`: org sem BitrixConnection importa de portal global via env não declarada em env.ts. **Verificar se env existe em produção** — se sim, é P0 cross-tenant.
**Ação 01:** remover fallback ou allowlist; declarar env em env.ts. Execução com 06.

### DEBT-0018 (co) — Contact.companyId sem validação de tenant — P1
`PrismaContactRepository.ts:50-85`. Validar `company.findFirst({id, organizationId})`; ideal FK composta `(companyId, organizationId)` no schema — **schema é seu**.

### DEBT-0020 (co) — Importação Bitrix não atômica — P1
`bitrix/service/leads.ts:321-377`, `deals.ts:436-502`. Company/Contact/Lead/Audit sequenciais fora de $transaction → órfãos. Apoiar 06 na migração para `runInTransaction` por item; enrichment só pós-commit.

### DEBT-0056 — Soft delete opt-in inconsistente — P2
`prisma-interceptors.ts:157-176,316-346`: AUDITABLE_MODELS cobre 9 de ~14 models com deletedAt. Derivar do schema ou ampliar + teste de paridade.

### DEBT-0057 — Gate RLS estático com pontos cegos — P2
`check-rls-coverage.ts:39-105`: não cobre tabelas filhas (Note, TimelineEvent, EnrichmentLog, DocumentChunk, CrmPipelineStage, WorkflowVersion, CallAttempt) nem DROP POLICY posterior. Inventário explícito ou verificação runtime vs pg_policy.

### DEBT-0058 — Skips/gaps de schema — P2
`proposalVersioning.test.ts` skips fluxo "Pago"; `piiSearchIndex-contactHash.test.ts` citado em doc mas ausente — verificar se migration existe.

### DEBT-DB-08 — Lacunas FK/tenant no schema — P3
`DataSubjectRequest.contactId` sem FK; `Setting.organizationId` nullable+unique NULL; `Activity` FK só p/ Lead; filhas com orgId sem FK composta.

## Lembrete
Não criar migrations em branches de integração — handoff formal para você. Slot exclusivo: não rodar 01A em paralelo no mesmo domínio.
