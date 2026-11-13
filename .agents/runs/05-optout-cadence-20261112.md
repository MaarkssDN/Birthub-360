# Run — Agente 05: opt-out no START_SDR_CADENCE (market-intelligence)

- **Data:** 2026-11-12
- **Branch:** `agente/05-optout-cadence-start` (worktree `C:\Github\Birthub-360-worktrees\agente-05-optout-cadence`, base `origin/main` @ ed837358d)
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md` (prioridade ALTO, LGPD; continuação de TAREFA-SANEAMENTO-035 / BT360-DT-0080)

## Contexto

`actionExecutorService.executeAction` (ação `START_SDR_CADENCE`) criava `CadenceRun` sem
nenhuma verificação de opt-out, contornando a trava de `POST /api/cadence/runs`.

## Decisões

1. **Propriedade:** `src/features/market-intelligence/**` não tem `AGENTS.md` próprio, mas
   `docs/architecture/BRAIN_TRUTH_MAP.md` (BT-013) atribui o módulo ao Agente 05 e
   `docs/auditorias/dividas-tecnicas/DIVIDAS-AGENTE-05.md` já o auditou como escopo do 05.
   Executado pelo 05 sem handoff intermediário; se o 00 entender diferente, reverter é trivial.
2. **`checkCadenceStartEligibility` indisponível:** a função existe apenas no PR #256
   (branch `agente/17-cadencia-handoffs`, OPEN) — não está na `main`. Em vez de depender de PR
   aberto, repliquei a verificação equivalente com primitivas já mergeadas:
   `prismaLeadSubjectResolver` + `isOptedOut` (OptOutRecord unificado por canal) e
   `checkOptOutStatus` por canal quando `lead.contactId` existe (flags `customFields`,
   anonimização LGPD — fora do OptOutRecord).
3. **Canais da sequência:** `sequenceRow.touches` é `Json`. Extração fail-closed sem importar
   `cadenceRun.worker.ts` (que carrega BullMQ/Redis no import): canal fora de
   `email|whatsapp|voice` ou lista vazia → 422, mesmo efeito de `parseCadenceSequenceDefinition`.
4. **Semântica de erro:** opt-out → `AppError` 409 lançado dentro de `withRlsContext` =
   pré-condição → recomendação permanece `Pending`, nenhum run persistido (não marca `Failed`).

## Alterações

- `src/features/market-intelligence/server/actionExecutor.service.ts` — trava de opt-out
  antes de `prismaCadenceRunRepository.save` (+72 linhas).
- `src/features/market-intelligence/server/__tests__/actionExecutor.tenancy.test.ts` —
  mocks dos 4 novos imports dinâmicos, fixtures de `touches`, +5 testes de regressão.
- `.agents/handoffs/onda-saneamento-20261110/17-para-05-...md` — arquivo copiado da branch do
  PR #256 (não existia na main) com `Status: resolvido` + `## Resolução`.

## Gates

- `npx tsc --noEmit` → limpo (exit 0).
- `npx biome check` nos 2 arquivos → limpo após `--write`; resta 1 warning **pré-existente**
  (`useIterableCallbackReturn` em `forEach` do mock, linha 48 — não introduzido por mim).
- `npx vitest run -c vitest.unit.config.ts src/features/market-intelligence/server/__tests__/actionExecutor.tenancy.test.ts`
  → 13/13 passando.

## Pendências / notas para o 00 e o 24

- Handoff adicionado nesta branch pode gerar conflito add/add com o PR #256 — resolver
  mantendo a versão com `## Resolução`.
- Quando o PR #256 mergear, `checkCadenceStartEligibility` passará a existir; uma futura
  convergência pode trocar a replicação pelo helper oficial (não bloqueante).
- Revisão do Agente 24 obrigatória antes de release (handoff saneamento).

## Correção pós-gate (CI PR #259 — `no-cross-feature-imports`)

O application gate reprovou 2 imports cross-feature novos:
`cadence/infra/PrismaLeadSubjectResolver.ts` e `cadence/application/optOutService.ts`.

Correção aplicada em `actionExecutor.service.ts`:

- Sujeito de opt-out resolvido **localmente** via `Lead.contact` (incluso no `findFirst`
  do lead): `email`, `phoneE164` via `toE164BR(whatsapp ?? phone)` — mesma semântica de
  `PrismaLeadSubjectResolver`, sem import de `cadence/`.
- Checagem via camada shared sancionada: `isOptedOut` de
  `src/shared/services/optOutService.ts` + `prismaOptOutRepository` de
  `src/shared/infra/PrismaOptOutRepository.ts` (já era shared).
- Tipo `CadenceChannel` passou a vir de `src/shared/domain/optOut.js` (era import de
  `cadence/domain/cadence.js` — também cross-feature, embora estivesse no baseline).
- `checkOptOutStatus` (shared) e `startCadenceRun`/`PrismaCadenceRunRepository`
  (cadence) mantidos — estes últimos já constam em
  `.dependency-cruiser-known-violations.json` (baseline aceita pelo gate).
- Teste `actionExecutor.tenancy.test.ts`: mocks atualizados para
  `shared/services/optOutService.js`; removido mock/var do resolver de cadence.
  Semântica inalterada: canal inválido → 422, opt-out → 409, Pending preservado.

### Gates da correção

- `npm run lint:architecture` → **0 violações** (1951 módulos; baseline ignorado/stale
  apenas informativo).
- `npx tsc --noEmit` → limpo.
- `npx biome check` nos 2 arquivos → limpo (1 warning pré-existente mantido).
- `npx vitest run -c vitest.unit.config.ts .../actionExecutor.tenancy.test.ts` → 13/13.
