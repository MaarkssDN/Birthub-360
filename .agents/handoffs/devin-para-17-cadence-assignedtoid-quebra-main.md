# Handoff — Devin → Agente 17 · `assignedToId` inexistente quebra CI de `main`

- **De:** Devin (verificação pós-push dos PRs #412/#390)
- **Para:** 17 — Cadência Multicanal e Ciclo de Receita
- **Onda:** fila de handoffs 20261117 / release-readiness 2026-11-18
- **Status:** em-andamento (correção entregue no PR #418, aguardando merge)
- **Prioridade:** bloqueador
- **Bloqueador-ref:** application gate do CI falhando em `main` e em todos os PRs novos
- **Sprint destino:** correção imediata em `main`

## Problema

O commit `2a1e66628` ("fix(cadence): integrar resolucao de booking_link e fallbacks
seguros de template", 2026-11-18) introduziu `assignedToId: true` no `select` de
`prisma.lead.findFirst` dentro de `resolveCadenceTemplateContext`
(`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`, ~linha 102) e o uso de
`lead.assignedToId` como `userId` no filtro de `publicBookingLink` (~linha 118).

O model `Lead` do Prisma **não possui `assignedToId`** — o campo de responsável é `owner`.
Resultado: `Invalid prisma.lead.findFirst() invocation — Unknown field 'assignedToId'`
em runtime, e o teste de integração `tests/integration/cadenceRun.worker.test.ts`
(2 testes: dispatch WhatsApp + varredura cross-tenant) falha com `processed: 0, errors: N`.

## Evidência

- `main` @ merge do PR #409: application gate FAIL — mesmo erro
  (`gh run view 44350439156`, log mostra `Unknown field 'assignedToId'`).
- PR #412 e PR #390: application gate FAIL — mesma falha, idêntica.
- `grep assignedToId prisma/schema.prisma` → sem ocorrência; `Lead.owner` é o campo real.
- Arquivo é de propriedade do Agente 17 (`src/features/cadence/**`).

## Alteração necessária

Decidir o mapeamento correto do "responsável" do lead para `PublicBookingLink.userId`:
provavelmente `lead.owner` (verificar se `owner` guarda userId ou nome — o `select`
atual de `owner` em outros pontos do CRM sugere string de owner; confirmar contrato).
Se `owner` não for userId confiável, o fallback correto pode ser omitir o filtro
`userId` ou usar outra relação — decisão do 17, possivelmente com handoff ao 01 se
forem necessários dados de usuário do lead.

## Teste esperado

`npx vitest run -c vitest.unit.config.ts tests/integration/cadenceRun.worker.test.ts`
(ou o comando de integração equivalente) verde; application gate do PR voltando a passar.

## Contexto adicional

- É regressão de `main`, não dos PRs #412/#390 — os gates vermelhos daqueles PRs são
  efeito colateral desta quebra, não dos diffs deles.
- O mesmo commit pode ter outros pontos com a mesma suposição de campo — vale varrer
  `assignedToId` no restante do diff de `2a1e66628`.
- Enquanto não corrigido, todo PR novo herda application gate vermelho.

## Resolução (Agente 17, 2026-11-18)

- **Causa raiz confirmada:** `Lead` não tem `assignedToId`; o responsável é `owner`
  (`String?`, contrato `User.id` — DATA-003, `LeadDetailDrawer.tsx:271` e schema.prisma
  ~L2059). `PublicBookingLink.userId` é FK para `User.id`, então `lead.owner` é o
  mapeamento correto — sem handoff ao 01 necessário.
- **Correção:** branch `fix/cadence-assignedtoid-lead-owner`, commit `cdd0bac62` —
  `assignedToId` → `owner` no select e no filtro `userId` (2 linhas, P3). Varredura de
  `src/` e do diff completo de `2a1e66628`: nenhum outro uso de `assignedToId`.
- **PR:** https://github.com/MaarkssDN/Birthub-360/pull/418
- **Gates locais (worktree `fix-cadence-assignedtoid`):** `tsc --noEmit` verde;
  `npm run lint` verde (warnings pré-existentes fora do escopo);
  vitest unitário de cadence 181/181; **integração `cadenceRun.worker.test.ts`
  5/5 verde** com Postgres+Redis locais (`processed: 2, errors: 0`).
- **Risco residual:** `owner` legado com nome livre não casa `userId` → `booking_link`
  resolve `null` (fallback `| default:` cobre); nunca casa link de usuário errado.
  Saneamento de `owner` legado é do CRM (Agente 04), fora do escopo.
