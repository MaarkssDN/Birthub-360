# Handoff — Agente 44 (Lola) → Agente 17 (Cadência Multicanal)

- **De:** 44 — Motor de Cadências Comerciais (Squad 40, CRM/Receita)
- **Para:** 17 — Cadência Multicanal e Ciclo de Receita (dono de `src/features/cadence/**`)
- **Onda:** Onda 4 — `ONDA4-44-CADENCES`
- **Status:** resolvido (resposta do Agente 17 em POS4-17-CADENCE-TZ — commit `68e38a47c`,
  handoff `.agents/handoffs/pos4/17-para-00-cadence-tz-pos4.md`)
- **Prioridade:** normal (achados 1 e 2) / baixo (achado 3)
- **Worktree de origem:** `wt-44-cadences` @ `agente/44-cadences-onda4`

## Contexto

Auditoria do motor de cadências pedida pela missão ONDA4-44-CADENCES. O ownership do Agente 44 é
`src/features/crm/cadences/**` (apenas `cadence.worker.ts`, avaliador puro de janela comercial).
O motor real — `src/features/cadence/jobs/cadenceRun.worker.ts`, `application/cadenceService.ts`,
`cadence.routes.ts` — pertence ao Agente 17. Os achados abaixo estão **fora do meu ownership**;
não editei nenhum arquivo de `src/features/cadence/**`. Registro para decisão do proprietário.

## Achado 1 — Janela comercial global, não por lead (duplicação de utilitário)

`cadenceRun.worker.ts` injeta `isWithinBusinessWindow: (now) => isWithinCallWindow(now)`
(`src/shared/policies/coldCall.policy.ts`), que usa `DEFAULT_CALL_WINDOW` **fixo**:
`America/Sao_Paulo`, 09:00–18:00, seg–sex. Consequências:

- Leads fora do fuso de SP recebem toques em horário local errado (ex.: lead em
  `America/Manaus` é avaliado como se estivesse em SP).
- Já existe um avaliador por-timezone-do-lead em
  `src/features/crm/cadences/cadence.worker.ts` (`evaluateCadenceBusinessWindow`, janela
  08:00–19:00) — **código morto em produção**: o único consumidor é o teste de squad
  `tests/unit/features/crm/onda3CrmSquad40.test.tsx`. Foi auditado nesta onda e está correto
  (ver handoff final do 44 para o 00), com cobertura de bordas adicionada em
  `src/features/cradence/../crm/cadences/__tests__/cadence.worker.test.ts`.

**Alteração sugerida (decisão do 17/00):** ou (a) evoluir `AdvanceCadenceRunDeps.isWithinBusinessWindow`
para receber o fuso do lead e reusar `evaluateCadenceBusinessWindow`, ou (b) documentar
explicitamente que a janela é global por política e remover/deprecar o utilitário órfão.
Sem ação minha por ser fora de ownership.

## Achado 2 — Lookup de `CadenceSequence` no scan sem filtro de tenant/soft-delete

`scanAndAdvanceCadenceRuns` (`cadenceRun.worker.ts` L144–151) busca as sequências sob
`bypassRls` apenas por `id IN (...)`, sem `organizationId`, sem `deletedAt: null` e sem
`active: true`. IDs são cuid globalmente únicos, então na prática resolve a linha certa — mas:

- Uma `CadenceSequence` com `deletedAt` preenchido (soft-delete) continua avançando runs ativos
  e despachando toques, porque nada filtra `deletedAt`.
- Se um `CadenceRun` referenciar `sequenceId` de outra organização (dado corrompido/manual),
  os `touches` do outro tenant seriam despachados — o bypass de RLS não revalida o par
  `(organizationId, sequenceId)` do run.

**Alteração sugerida:** filtrar `deletedAt: null` (e decidir se `active: false` deve pausar runs
existentes — hoje `active` parece governar só a criação de novos runs) e, idealmente, validar
`organizationId` da sequência contra `run.organizationId` antes de despachar.

## Achado 3 — Scan com `take: 500` sem `orderBy` (starvation teórica)

`prisma.cadenceRun.findMany({ where: { status: 'Active' }, take: MAX_RUNS_PER_TICK })` não tem
`orderBy`. Com mais de 500 runs ativos, o Postgres pode devolver sempre o mesmo subconjunto,
deixando runs no fim da fila sem processamento. Baixa prioridade (depende de volume), mas um
`orderBy: { startedAt: 'asc' }` ou cursor tornaria a varredura justa e determinística.

## O que foi verificado como SAUDÁVEL (sem ação necessária)

- Idempotência/duplicidade: `CadenceRunLockPort` (Redis) serializa o ciclo por runId;
  `saveWithRetry` + log de risco de reenvio; re-verificação pré-envio de status e
  `hasLeadReplied` (janela residual documentada); sweeper de `pending` com TTL (DEBT-0009);
  opt-out em lote na largada (`cadence-start`) e por toque no worker.
- Transições: `pause`/`resume`/`stop` manuais são idempotentes por domínio e o worker
  re-lê o run antes de despachar (paused/terminal → wait/stop sem envio).
- Tenancy nas escritas: cada run é processado dentro de
  `requestContext.run({ tenantId: run.organizationId })` — bypass só na descoberta.
- Falhas históricas (`assignedToId` inexistente no Lead — PR #416; `Pending` ausente no enum
  `CadenceTouchResult` — DEBT-0009; opt-out ausente no start — TAREFA-SANEAMENTO-035) já foram
  corrigidas em ondas anteriores e há testes de integração cobrindo
  (`tests/integration/cadenceRun.worker.test.ts`, `cadence-start.routes.test.ts`,
  `cadence-schedule-meeting.routes.test.ts`).

## Teste esperado

- Achado 2: teste de integração — sequência soft-deletada/inativa com run ativo não deve
  despachar toques (ou comportamento decidido explicitamente).
- Achado 1: se optarem por (a), teste unitário com lead em `America/Manaus` fora da janela SP.

## Resposta do Agente 17 (POS4-17-CADENCE-TZ, commit `68e38a47c`)

Os três achados foram tratados no worktree `wt-17-cadence-tz` @ `agente/17-cadence-tz-pos4`:

- **Achado 1 — resolvido pela opção (a).** Novo `src/features/cadence/domain/businessWindow.ts`
  (`resolveBusinessTimeZone` + `isWithinCadenceBusinessWindow`): o fuso é resolvido por lead na
  cadeia `Lead.customFields.timezone` (IANA válido) → UF de `Company.state` → fallback
  `America/Sao_Paulo` (documentado, idêntico ao comportamento anterior). O `timeZone` viaja pelo
  contrato `LeadSubject`/`isWithinBusinessWindow` como parâmetro opcional — implementações
  antigas de 1 argumento continuam válidas. **Não** reutilizei
  `evaluateCadenceBusinessWindow` do `src/features/crm/cadences/` porque ele é de outro domínio
  (Agente 04) e usa janela 08:00–19:00 divergente da de cadência (09:00–18:00) — a divergência de
  horários ficou registrada como pendência para o 00 no handoff POS4, sem alterar comportamento
  fora do escopo. O avaliador órfão do CRM continua morto em produção — decisão de remoção é do
  dono (04) ou do 00.
- **Achado 2 — corrigido.** `scanAndAdvanceCadenceRuns` filtra `deletedAt: null` na query de
  `CadenceSequence` e valida `organizationId` da sequência contra `run.organizationId` via
  `sequenceDefinitionForRun` (extraída para `domain/cadence.ts`, testável sem banco). Sequência
  soft-deletada, de outro tenant ou malformada encerra o run como `failed`/`policy-guardrail`.
  `active: false` **não** filtra de propósito — contrato documentado: desativar só impede novos
  runs.
- **Achado 3 — corrigido.** `orderBy: { startedAt: 'asc' }` adicionado ao `findMany` com
  `take: 500` — varredura justa/determinística.

**Testes:** 19 novos testes unitários verdes (12 em `businessWindow.test.ts`, 3 de propagação de
fuso em `cadenceService.test.ts`, 4 de isolamento de tenant em `cadence.test.ts`). Gates:
`tsc --noEmit` limpo, `biome lint` limpo, suíte unitária de `src/features/cadence` 218/218.

**Ressalva:** a cobertura de "soft-deletada não despacha" e "sequência cross-tenant" no nível de
banco ficou sugerida como teste de integração em `tests/integration/cadenceRun.worker.test.ts`
(ownership do Agente 08) — a lógica de decisão está coberta em unitário; o filtro `deletedAt` é da
query Prisma e só é observável com Postgres real.
