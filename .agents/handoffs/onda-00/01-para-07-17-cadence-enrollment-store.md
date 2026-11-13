# Handoff — Migrar consumidores de cadência multicanal para o store durável

De: 01 — Plataforma, Segurança e Dados
Para: 07 — IA e Automações e 17 — Cadência Multicanal e Ciclo de Receita
Onda: 00 (coordenador-20261112)
Status: resolvido
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

## Resolução (executor sob coordenação do 00 — branch `agente/00-cadence-enrollment-migration`)

Ambos os consumidores migrados para `IMultichannelCadenceEnrollmentStore`
(`prismaMultichannelCadenceEnrollmentStore` como default injetável via construtor).

### `src/features/cadence/services/adaptiveMultichannelCadence.service.ts` (17)

- `enrollmentsStore` agora é `IMultichannelCadenceEnrollmentStore` injetado no construtor
  (default = singleton Prisma). `enrollLead` delega a `store.enroll` (o store gera `enr-<uuid>`).
- `executeNextStep`: `store.get` + `store.update` explícito para `currentStep`/`lastActionAt`/
  `status` — o objeto retornado é cópia, nunca mutado.
- `registerOptOutAndHalt`: o loop sobre `store.entries()` virou
  `store.updateByLead(org, leadId, { status: 'opted_out' })`.
- `getEnrollment`/`findEnrollmentByLead` viraram `async` (sem callers síncronos em produção —
  só testes, atualizados).
- **`optOutRegistry` volátil: REMOVIDO e substituído pelo durável.** `registerOptOutAndHalt`
  agora grava `OptOutRecord` via `recordOptOut` (`prismaOptOutRepository`, scope `'global'`,
  `originChannel = channelSource`, `subject.leadId`) — a mesma porta `OptOutRepository` já
  usada por voz/WhatsApp/e-mail. `executeNextStep` checa supressão com `isOptedOut(repo, org,
  {leadId}, step.channel)`; `isLeadOptedOut` virou `async` e consulta `repo.findMatches`
  (equivalente ao antigo "qualquer canal bloqueado"). `selfDrivingCrm.service.ts` (mesmo dono)
  recebeu `await` na chamada — único caller afetado.
- **`clear()` removido**: não há mais estado volátil de enrollment/opt-out para limpar
  (cadenceStepsStore é configuração, não estado). Callers de teste atualizados.
- Efeito colateral positivo: opt-outs de outros canais (voz/WhatsApp via OptOutRecord) agora
  também suprimem passos de cadência — antes o registry só conhecia o que o próprio engine
  gravava. Escopo por canal é respeitado (`scope 'email'` só bloqueia email; `'global'` bloqueia
  todos) — semântica do domínio `optOut.ts`, mais correta que o antigo "tudo ou nada".

### `src/features/automations/cadenceIntegration.service.ts` (07)

- `findEnrollmentByLead`/`enrollLead` privados viraram `async` sobre o store injetado
  (`findByLead`/`enroll`). Mutações (`move_to_step`/`pause`/`resume`/`restart`) viraram
  `store.update(org, enrollmentId, patch)` — comportamento observável idêntico
  (`contactEmail`/`contactPhone` seguem `''` via default do store).

### `sharedCadenceEnrollmentsStore` (@deprecated)

Zero referências restantes em `src/` e `tests/` (só comentários de documentação). **Não foi
deletado**: o export vive em `src/shared/contracts/multichannelCadence.contract.ts`, propriedade
do Agente 01 — recomendo ao 01 remover o Map na próxima passada (nenhum consumidor restante).

### Testes

- Novo fake `tests/mocks/inMemoryCadenceEnrollmentStore.ts` (implementa a porta, devolve cópias
  como o Prisma store) — prova persistência via porta sem Postgres.
- `cadenceIntegration.service.test.ts`: instancia `new CadenceIntegrationService(store)` e
  verifica via `store.findByLead` (async).
- `adaptiveMultichannelCadence.service.test.ts`: injeta store fake + `InMemoryOptOutRepository`;
  novo caso prova que avanço de passo persiste via update.
- `selfDrivingCrm.service.test.ts`: `vi.mock` do serviço de cadência (agora async/Prisma) —
  opt-out formal do teste continua coberto pelo `optOutRepo` InMemory do próprio serviço.
- `onda03ComprehensiveFlow.integration.test.ts`: removidos import/`clear()` mortos (serviço não
  era exercido no arquivo).
- `onda03EndToEndFlow.integration.test.ts`: `beforeAll` faz upsert das Organizations dos tenants
  (FK + RLS) e as chamadas de cadência rodam em `requestContext.run({tenantId})`; `Lead
  'lead-corp-100'` criado antes do opt-out porque `OptOutRecord.leadId` tem FK para `Lead`.

### Verificação executada

- `npx tsc --noEmit` — limpo.
- `npx vitest run -c vitest.unit.config.ts src/features/cadence src/features/automations
  tests/unit/cadence` — 24 arquivos, 279 testes, todos verdes.
- Pendente (precisa de Postgres de integração): `npm run test:integration` nos arquivos onda03
  acima + `prisma migrate deploy` prévio — recomendado rodar no gate da onda.
