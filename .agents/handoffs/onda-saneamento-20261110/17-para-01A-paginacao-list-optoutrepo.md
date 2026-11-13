De: Agente 17 — Cadência Multicanal e Ciclo de Receita (registrado pelo Agente 01 a partir do plano de saneamento W3 — arquivo não existia no repositório)
Para: Agente 01A (executado pelo slot 01 — `src/shared/infra` é infra compartilhada do domínio 01)
Onda: Onda 1 / W3 (Plano Mestre de Saneamento)
Status: em-andamento
Prioridade: alto — achado do Agente 24 na revisão W2 (trava LGPD)
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 1

## Problema

`prismaOptOutRepository.list(organizationId)` truncava em 200 registros (`createdAt` desc)
e os consumidores em lote (cadence POST /runs, sendColdEmailBatch) podiam tratar lead com
opt-out antigo como elegível — fail-open residual da W2.

## Arquivo(s) envolvido(s)

`src/shared/infra/PrismaOptOutRepository.ts`, `src/shared/domain/optOut.ts` (contrato),
testes do repositório.

## Evidência

- Plano: `plano-ondas-saneamento-birthhub360.html` (W3, missão "17→01A — paginação de
  optOutRepository.list").
- Revisão W2 do Agente 24 que originou o achado.

## Alteração necessária

Eliminar o fail-open residual do opt-out: paginação real / `listAll` / `findMatchesBatch` /
query por sujeitos — decidindo pela abordagem compatível com a interface.

## Teste esperado

Teste que prova que um opt-out mais antigo que os 200 registros mais recentes continua
bloqueando; `tsc` limpo; lint exit 0; consumers existentes compilando sem alteração de
comportamento.

## Contexto adicional

- Fora de escopo original: mudar semântica de `isOptedOut`/`findMatches`; alterar
  consumidores (`cadence.routes.ts`, `cold-email.service.ts`).
- Agente revisor obrigatório: Agente 24.

## Resolução (Agente 01 — 2026-11-12, branch `agente/01-w3-optout-pagination`, commit `deae6afff`)

### Verificação prévia (P1) — o fail-open de envio NÃO existia

Auditoria dos consumidores reais de `OptOutRepository`:

- `sendColdEmail` (`src/features/prospecting/services/cold-email.service.ts:90`),
  `CadenceExecutionService` (`src/features/cadence/application/CadenceExecutionService.ts:187`)
  e `callSuppression.service.ts` usam `isOptedOut` → `findMatches(organizationId, subject)`,
  que **nunca teve limite** — a consulta é por identificador (OR de leadId/email/phoneE164),
  não por listagem do tenant. Um opt-out antigo sempre bloqueou o envio.
- `list()` só era consumida por `GET /opt-outs` (`cadence.routes.ts:115`, listagem admin).
- O truncamento silencioso (default 200, clamp 500) era, portanto, um risco latente —
  qualquer consumidor em lote futuro que usasse `list()` herdaria o fail-open — e uma
  falha de completude na listagem administrativa, não um vazamento ativo.

### Alteração

- `PrismaOptOutRepository.list(organizationId, limit?)`: `limit` **omitido → retorna o
  tenant inteiro** (sem `take`); `limit` explícito → clamp 1..500 como antes. Interface
  inalterada — `cadence.routes.ts` e demais consumers compilam sem mudança.
- `OptOutRepository.list` (contrato em `src/shared/domain/optOut.ts`): semântica
  documentada — omitido = completo; explícito = teto.

### Teste de regressão

- `tests/integration/optout-list-completeness.test.ts` (novo, Postgres real): semeia 1
  opt-out alvo com `createdAt` mais antigo + 205 fillers mais novos. Prova que
  (a) `isOptedOut` continua `true` para o alvo (posição 206), (b) `list()` sem limit
  retorna os 206 registros com o alvo por último, (c) `list(org, 10)` retorna 10.
- `tests/unit/shared/PrismaOptOutRepository.test.ts`: novo caso afirmando que
  `findMany` é chamado **sem** `take` quando `limit` é omitido e com `take` clampado
  quando explícito.

### Colateral necessário (fora da propriedade original — sinalizado)

- `tests/helpers/integration-setup.ts` (dono 08/14): `deleteOrganizationsAsOwner` passou
  a remover as 22 tabelas com FK `ON DELETE RESTRICT` (migração
  `20261112000000_tenant_fk_cascade_to_restrict`, TAREFA-SANEAMENTO-014) antes de deletar
  a `Organization`. Sem isso, a limpeza global da suíte quebrava com FK violation —
  regressão introduzida pela própria migração do 014, corrigida aqui de forma aditiva.
  **Revisão do Agente 24/08 recomendada.**

### Pendência de contrato (handoff informativo ao Agente 17)

`InMemoryOptOutRepository.list` (`src/features/cadence/infra/InMemoryOptOutRepository.ts`,
arquivo do Agente 17) mantém o default `limit = 200` — diverge da nova semântica do
contrato (omitido = completo). É implementação só de teste, mas pode mascarar o mesmo
fail-open em testes de unidade. Sugestão ao 17: alinhar o default para `limit?: number`
com o mesmo comportamento (omitido = todos).

### Gates

- `npx tsc --noEmit`: ✅
- `npx biome lint` nos arquivos alterados: ✅
- `vitest unit PrismaOptOutRepository.test.ts`: 6/6 ✅
- `vitest integration optout-list-completeness.test.ts`: 1/1 ✅ (Postgres real,
  `prospectordb_test` no daemon remoto)
- Suíte de integração completa: em execução; resultado no run report.

### Run report

`.agents/runs/agente-01-tarefa-saneamento-optout-pagination.md`
