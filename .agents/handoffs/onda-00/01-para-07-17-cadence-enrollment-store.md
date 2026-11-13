# Handoff — Migrar consumidores de cadência multicanal para o store durável

De: 01 — Plataforma, Segurança e Dados
Para: 07 — IA e Automações e 17 — Cadência Multicanal e Ciclo de Receita
Onda: 00 (coordenador-20261112)
Status: aberto
Prioridade: alto
Bloqueador-ref: handoff original `.agents/handoffs/onda-00/07-para-00-automation-dryrun-sandbox.md` item 3
Sprint destino: próxima onda de endurecimento

## Problema

`sharedCadenceEnrollmentsStore` (`src/shared/contracts/multichannelCadence.contract.ts`) era um
`Map` em memória por processo: enrollments de cadência multicanal se perdiam em restart/deploy e
divergiam entre réplicas. O 01 entregou a persistência durável; falta migrar os dois consumidores,
que são de propriedade de vocês e usam o Map de forma **síncrona** — por isso a interface antiga
não pôde ser substituída sem quebrá-los.

## O que o 01 entregou (nesta branch `agente/01-cadence-enrollment-store`)

1. **Schema + migration** (propriedade do 01):
   - `prisma/schema.prisma`: enum `MultichannelCadenceEnrollmentStatus` + model
     `MultichannelCadenceEnrollment` + back-relation em `Organization`.
   - `prisma/migrations/20261112120000_multichannel_cadence_enrollment/migration.sql` — aditiva,
     RLS `tenant_isolation` estrita (ENABLE + FORCE), rollback documentado no próprio arquivo.
   - `leadId` é string simples **sem FK** para `Lead` (automações podem matricular ids que ainda
     não existem como Lead local); isolamento é por `organizationId` + RLS.
   - `src/lib/tenant-scoping-registry.ts`: model adicionado a `TENANT_INJECTED_MODELS`.
2. **Contrato**: nova porta assíncrona `IMultichannelCadenceEnrollmentStore` em
   `multichannelCadence.contract.ts` com `enroll`, `get`, `findByLead`, `update`,
   `updateByLead` — todas filtram `organizationId`. `sharedCadenceEnrollmentsStore` segue
   exportado, marcado `@deprecated`.
3. **Implementação**: `src/shared/infra/PrismaMultichannelCadenceEnrollmentStore.ts`
   (`prismaMultichannelCadenceEnrollmentStore`) — singleton sobre `prisma.multichannelCadenceEnrollment`,
   mapeia status domínio↔enum e datas ISO↔TIMESTAMPTZ. O store gera `enrollmentId`
   (`enr-<uuid>`), mesmo formato atual.
4. **Testes**: `src/shared/infra/__tests__/PrismaMultichannelCadenceEnrollmentStore.test.ts`
   (7 testes) — inclui prova de sobrevivência a "restart" (nova instância do store sobre o mesmo
   backend) e não-vazamento cross-tenant.

## Alteração necessária (nos seus arquivos)

### Agente 17 — `src/features/cadence/services/adaptiveMultichannelCadence.service.ts`

- Trocar `private enrollmentsStore = sharedCadenceEnrollmentsStore` por
  `prismaMultichannelCadenceEnrollmentStore` (import de `src/shared/infra/`).
- Os métodos do store são assíncronos — adicionar `await` onde hoje há `.get/.set/.entries`:
  - `enrollLead`: `await store.enroll({...})` (store já gera o id — remover o
    `enr-${randomUUID()}` local ou manter o objeto retornado).
  - `executeNextStep`: `await store.get(org, id)`; mutações de `currentStep/status/lastActionAt`
    viram `await store.update(org, id, patch)` — **não mutar o objeto retornado** (ele é cópia
    do banco, não referência viva como no Map).
  - `registerOptOutAndHalt`: o loop `for (const [key, enrollment] of store.entries())` vira
    `await store.updateByLead(org, leadId, { status: 'opted_out' })`.
  - `getEnrollment`/`findEnrollmentByLead`: hoje síncronos e públicos — precisam virar `async`
    (verificar chamadores; se houver caller síncrono, abrir handoff antes de mudar a assinatura).
  - `isLeadOptOut`/`optOutRegistry`: **atenção** — esse registry também é em memória e tem o mesmo
    problema de volatilidade. A tabela `OptOutRecord` + `optOutService` (domínio `optOut.ts`,
    `PrismaOptOutRepository`) já existem para isso; considere delegar `isLeadOptOut` a eles em
    vez de manter o `Map` local. Decisão é sua; registrar no handoff de resolução.
- `clear()`: com store durável, `clear()` não deve mais esvaziar o "banco" — avaliar se vira no-op
  de cache ou se deve ser removido (testes usam `adaptiveMultichannelCadenceService.clear()` em
  `beforeEach`; com Postgres real isso exigirá limpeza por tenant nos testes ou mock do store).

### Agente 07 — `src/features/automations/cadenceIntegration.service.ts`

- `findEnrollmentByLead`/`enrollLead` privados usam o Map — migrar para o store assíncrono
  (`await store.findByLead`, `await store.enroll`). `executeCadenceAction` já é `async`.
- Mutações (`enrollment.currentStep = step`, `status = 'paused'/'active'`) viram
  `await store.update(org, enrollment.enrollmentId, {...})`.
- `contactEmail`/`contactPhone`: o service hoje grava `''` — o store aceita opcional (default `''`).
  Se quiser enriquecer depois a partir do Lead, é melhoria à parte.

## Arquivo(s) envolvido(s)

- `src/features/cadence/services/adaptiveMultichannelCadence.service.ts` (17)
- `src/features/automations/cadenceIntegration.service.ts` (07)
- Testes que tocam o store: `src/features/automations/__tests__/cadenceIntegration.service.test.ts`,
  `tests/unit/cadence/adaptiveMultichannelCadence.service.test.ts`,
  `tests/integration/onda03ComprehensiveFlow.integration.test.ts`,
  `tests/integration/onda-03/onda03EndToEndFlow.integration.test.ts` (08/17 — ajustar mocks/fixtures).

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts src/features/automations/__tests__/cadenceIntegration.service.test.ts tests/unit/cadence/adaptiveMultichannelCadence.service.test.ts`
- Após migrar, rodar `prisma migrate deploy` no ambiente de integração e repetir os fluxos
  ponta a ponta (enroll → executeNextStep → registerOptOutAndHalt) contra Postgres real.

## Contexto adicional

- Enquanto os consumidores não migrarem, o Map legado continua funcionando exatamente como antes
  (nada quebra); os dois caminhos coexistem de propósito durante a transição.
- `IMultichannelCadencePort` (enrollLead/executeNextStep/registerOptOutAndHalt) **não mudou** —
  a migração é interna aos services.
- Pendência de schema já resolvida: não é preciso nova migration além da entregue.
