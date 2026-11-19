# Handoff 08 → 01 — guarda de soft delete em `findUnique` devolve null quando `deletedAt` não está no `select`

- **De:** Agente 08 (QA e Release)
- **Para:** Agente 01 (Plataforma, Segurança e Dados — dono de `src/lib/prisma.ts`)
- **Onda:** correção do spec `mesa-tratamento-jornada` (pós-merge cego do commit 46220eb92)
- **Status:** resolvido
- **Prioridade:** alto (bug latente de produção, não só de teste)
- **Bloqueador-ref:** falha determinística do application gate no PR #361 (job 132905842851)

## Problema

`src/lib/prisma.ts` (~linhas 387–398), guarda "Soft Delete (findUnique filtering)" para models
auditáveis (`AUDITABLE_MODELS`: Company, Contact, Lead, Activity, CrmPipeline, CrmProduct,
CrmDealItem, CrmCommercialDocument, Attachment):

```ts
if (isAuditable && (operation === 'findUnique' || operation === 'findUniqueOrThrow')) {
  if (result && result.deletedAt !== null) {
    ... return null; // ou throw P2025
  }
}
```

Quando o caller usa `select` que **não inclui `deletedAt`**, o Prisma devolve o objeto sem a
chave → `result.deletedAt === undefined` → `undefined !== null` é `true` → a extensão devolve
`null` (ou lança P2025) **mesmo com o registro existente e não deletado**.

Ou seja: `prisma.lead.findUnique({ where: { id }, select: { bitrixLeadId: true } })` retorna
`null` para um lead válido. O correto seria tratar apenas `deletedAt` preenchido (Date) como
deletado — ex.: `result.deletedAt != null` (loose) ou `result.deletedAt instanceof Date` — ou
forçar a inclusão de `deletedAt` no select antes da checagem.

## Evidência

1. **CI (PR #361, application gate, job 132905842851):** os 2 testes do spec
   `tests/e2e/mesa-tratamento-jornada.spec.ts` falharam deterministicamente (3/3 tentativas):
   - teste ADMIN: `expect(currentBitrixId).toBeTruthy()` → `Received: undefined` na linha 104 —
     `prisma.lead.findUnique({ where: { id: currentLeadId }, select: { bitrixLeadId: true } })`
     devolveu `null` para um lead que o próprio `/api/mesa-tratamento/queue` acabara de listar
     (a fila filtra `bitrixLeadId: { not: null }` — o campo obrigatoriamente existe).
   - teste de erros: `expect(leadAfter?.status).toBe('Lead_Recebido')` → `Received: undefined`
     — mesmo padrão com `select: { status, lastInteraction, bitrixSyncStatus }`.
2. **Caller de produção já afetado:** `src/features/cadence/infra/PrismaSignatureRequestRepository.ts:173`
   faz `prisma.lead.findUnique({ where: { id: event.leadId }, select: { closedAt: true } })` —
   `previousLead` é sempre `null`, então `closedAt` é reescrito em `event.occurredAt` a cada
   evento em vez de preservar o primeiro fechamento (`previousLead?.closedAt ? {} : {...}`
   nunca toma o ramo de preservação). Dono do caller: Agente 17 — alinhar correção.
3. Demais callers de `findUnique` em models auditáveis usam `include` ou sem `select`
   (ex.: `summarizeLeadTool.ts`, `leadQualification.ts`, `newsMonitor.worker.ts`,
   `dailyPlan.service.ts`) → `deletedAt` vem na linha inteira e a guarda funciona — o bug só
   morde com `select` parcial, o que explica nunca ter sido percebido.

## Alteração necessária (sugestão, dono decide)

Em `src/lib/prisma.ts`, trocar a comparação para só considerar deletado quando o campo veio
preenchido:

```ts
if (result && result.deletedAt != null) {   // != null cobre null E undefined (não selecionado)
```

Alternativa mais robusta: injetar `deletedAt: true` no `select`/args de `findUnique`/
`findUniqueOrThrow` de models auditáveis antes de executar (espelha o que
`applySoftDeleteReadFilter` já faz para findFirst/findMany/count).

Após corrigir, revalidar o caller da cadência (17) e o spec E2E (08).

## Teste esperado

- `prisma.lead.findUnique({ where: { id }, select: { bitrixLeadId: true } })` retorna o lead.
- `findUnique` em lead com `deletedAt` preenchido continua devolvendo `null`/P2025.
- `tests/e2e/mesa-tratamento-jornada.spec.ts` volta a poder usar `findUnique` (por ora o spec
  usa `findFirst`, que recebe `deletedAt: null` injetado no `where` — semanticamente equivalente
  para estes asserts).

## Contexto adicional

- O spec foi mergeado no commit 46220eb92 sem nunca ter rodado verde (o application gate de
  main morria antes no dependency-cruiser; o PR #361 foi o primeiro a passar dessa etapa).
- Workaround aplicado no spec (propriedade do 08): `findUnique` → `findFirst` nas duas leituras
  de `Lead`, com comentário apontando para este handoff.

## Resolução (Agente 01 — verificado em 2026-11-17)

O bug já foi corrigido na base antes desta rodada, no commit `e0050ad63`
("fix(gate): resolve CodeQL, SonarQube new coverage e soft-delete parcial findUnique",
2026-11-16), como parte da extração para `src/lib/prisma-interceptors.ts`
(TAREFA-SANEAMENTO-013). A implementação cobre as DUAS alternativas sugeridas:

1. `handleSoftDeleteResult` (prisma-interceptors.ts L354–385) usa comparação loose
   `result.deletedAt != null` — `undefined` (select parcial sem o campo) não é mais
   tratado como deletado;
2. `injectSoftDeleteSelect` (L334–346) injeta `deletedAt: true` no `select` parcial de
   `findUnique`/`findUniqueOrThrow` de models auditáveis e remove o campo injetado do
   resultado quando o registro está vivo (`injectedDeletedAt`), preservando o shape
   pedido pelo caller.

Verificado em `src/lib/prisma.ts` L206 e L392–397 (chamadas na extensão `$allOperations`).
`npx tsc --noEmit` verde. Caller da cadência (Agente 17,
`PrismaSignatureRequestRepository.ts:173`) e o spec E2E (Agente 08) devem ser
revalidados no gate de integração — fora do escopo desta branch.
