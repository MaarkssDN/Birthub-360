# Run — Agente 04 · TAREFA-SANEAMENTO-018 / BT360-DT-0024

- **Data:** 2026-11-12
- **Onda:** W4 (Domínio de produto)
- **Branch:** `agente/04-w4-crm360-repo` (base `origin/integracao/onda-saneamento-20261110` @ `4b561f15b`)
- **Worktree:** `C:/Github/Birthub-360-worktrees/agente-04-w4-crm360`
- **Handoff:** `00-para-04-hotspot-estrutural-...` → `em-andamento`

## O que foi feito

`src/features/crm360/infra/PrismaCrm360Repository.ts`: **1204 → 754 linhas**.

Novo `src/features/crm360/infra/PrismaCrm360DocumentRepository.ts` (**535 linhas**) recebe, verbatim:

- `listDocuments`, `createDocument`, `updateDocumentContent`, `listDocumentVersions`
- `updateDocumentStatus` (BILLING-003 + ACH-17-08 gates preservados)
- `reconcileFaturaStripePayment` (confirmação ao vivo Stripe + P2002 → 409)
- `recordDocumentView` (bypass RLS via `requestContext`, escopo de tenant na escrita)
- `requestDocumentSignature` (gov.br via use-case de cadence)
- helpers `calculateItem`, `computeDocumentTotals`, `serializeDocument` (exportados; `calculateItem` segue usado por `addDealItem` no repositório principal)

`PrismaCrm360Repository` compõe `PrismaCrm360DocumentRepository` no construtor e delega os 8 métodos — `ICrm360Repository`, `Crm360UseCases`, rotas e `shared/di/setup.ts` **inalterados**.

`docs/architecture/HOTSPOT_EXCEPTIONS.md`: exceção do arquivo removida (estava obsoleta — arquivo agora 754 < 1000).

## Verificação

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`: **PASS** (OOM na 1ª tentativa sem heap extra — ambiental, não do diff).
- `npx biome check` (2 arquivos + dir infra): **PASS** — 1 warning de parameter property (padrão pré-existente do arquivo original).
- `vitest tests/unit/features/crm360/`: **27/27 PASS** (inclui `PrismaCrm360Repository.test.ts` e `.reconciliation.test.ts`).
- `npm run check:hotspots`: **PASS** — 1899 arquivos, 0 acima de 1000 sem exceção; warning de exceção obsoleta resolvido pela remoção.
- `npm run lint` (`biome lint src`): **PASS** — exit 0; 828 warnings pré-existentes do baseline (nenhum nos arquivos do diff).
- `npm run build` (vite + esbuild server + verify:pwa-precache): **PASS** — 5910 módulos, precache 222 entradas verificado.

## Pendências

- Parecer Agente 24; integração pelo Agente 00.
