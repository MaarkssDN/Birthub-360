# Parecer 24 — PR #432 (DEBT-0020 — importação Bitrix atômica)

- Missão: revisão independente de débitos P1 do release-readiness audit
- Autor: Agente 06 — Integrações e Bitrix
- Auditor: Agente 24 — Revisão Independente
- Base: `main` | Branch: `agente/06-bitrix-import-transacao` | Commit revisado: `19b49e8e587fdeab344d6767e1653bb20c479ddd`
- Data: 2026-11-19

## Arquivos da entrega

- `src/features/integrations/bitrix/service/leads.ts` (modificado)
- `src/features/integrations/bitrix/service/deals.ts` (modificado)
- `src/features/integrations/bitrix/service/__tests__/leads.test.ts` (modificado)
- `src/features/integrations/bitrix/service/__tests__/deals.test.ts` (modificado)
- `.agents/handoffs/onda-review-20261119/06-para-00-debt-0020-bitrix-import-atomica.md` (novo)

Propriedade: `integrations/bitrix/**` é domínio do 06 — OK. `src/lib/queue/**` não modificado (apenas `enrichmentQueue.add` consumido — slot 16 respeitado). Sem mudança de schema/migration (correto — não exigida). Sem conflito.

## Verificações executadas (evidência própria do auditor)

- `gh pr diff 432` — diff integral lido; confere com o escopo declarado.
- Auditei a semântica real de `runInTransaction` em `src/lib/prisma.ts:597-660`:
  - Abre `basePrisma.$transaction` interativa, faz `set_config('app.bypass_rls','off')` + `set_config('app.current_tenant_id', tenant)`, e propaga a transação ativa via `AsyncLocalStorage` (`activeTransaction`).
  - O client `prisma` estendido roteia TODA operação de model para a tx ativa (`executeWithRls`, prisma.ts ~234-246) — ou seja, o callback usar o `prisma` global (e não o parâmetro `tx`) é o padrão correto e já estabelecido (`PrismaCrmDealItemsRepository`, crm360). Confirmado: writes dentro do `fn` são atômicos.
  - Tenant fail-closed: sem `organizationId`/`requestContext.tenantId` → erro; divergência → `TransactionTenantMismatchError`. O PR passa `{ organizationId }` explicitamente — correto.
  - Timeout default 45s (30s test) — sustenta a decisão de tx POR ITEM (lote de 100 itens estouraria).
- `npx tsc --noEmit` no worktree `agente-06-bitrix-import` (HEAD = 19b49e8e5) → exit 0.
- `npx vitest run -c vitest.unit.config.ts` em `leads.test.ts` + `deals.test.ts` → **18/18 passaram** (11 + 7), incluindo os 5 novos testes DEBT-0020.

## Confronto promessa × evidência

### Atomicidade por item: CONFIRMADO

- `leads.ts` (~319-395) e `deals.ts` (~434-517): `company.create` → `contact.create` → `lead.create` → `AuditService.log({action:'IMPORT'})` agora dentro de UM `runInTransaction(async () => {...}, { organizationId })`. Qualquer falha → rollback total dos 3 creates + audit. Retorno `{ companyId, leadId }` usado pós-commit.
- Chamadas externas e leituras permanecem FORA da tx — verificado no código: `callBitrix`, `getStatusLabels`, `resolveEnumMaps`, `getBitrixUsers`, `prisma.lead.findFirst` (dedup), `resolveBirthubUserIdByEmail`, `findOwnershipConflict`, `notifyOwnershipConflict` todos executam antes do `try` da tx. Correto: tx só envolve escritas locais.
- `enrichmentQueue.add('enrich-company', ...)` movido para DEPOIS do `await runInTransaction` — efeito externo não é enfileirado em rollback. Verificado em ambos os arquivos.
- Granularidade por item (não por lote): confirmado — o `for` mantém uma tx por `bitrixLeadId`, preservando o isolamento de falhas e o lock `acquireBitrixSyncLock` por item.
- P2002 → `skipped`: preservado. O catch interno (`err.code === 'P2002'`) continua contando `skipped++` sem propagar; dentro da tx o P2002 da unique `(organizationId, bitrixLeadId)` provoca rollback dos creates parciais antes de chegar ao catch — exatamente o comportamento desejado (sem órfãos E sem failed duplo).
- Demais contadores (`skippedConflicts`, `skippedNotOwned`, `failed`) inalterados; falha não-P2002 em um item → `failed++` e loop continua.

### Testes novos: VÁLIDOS com ressalva documentada

- `runInTransactionMock` executa `fn(prismaMock)` direto — ou seja, o unitário prova o CONTRATO (tx por item com `{organizationId}`, enrichment pós-commit, P2002→skipped, audit dentro do fn) mas NÃO prova rollback real no Postgres. O próprio handoff declara essa limitação honestamente e recomenda cobertura de integração no gate de integração. Aceitável: a semântica de rollback é garantida por `runInTransaction`/`$transaction` do Prisma (infra já existente e auditada), não por este diff.
- O mock não injeta `activeTransaction` — em teste, `prisma.company.create` bate no `prismaMock` diretamente. Como o código de produção usa o `prisma` global (correto via ALS), não há divergência de caminho testado vs. real no que importa (quais writes acontecem dentro do fn).

## Achados

- **P3 — contador pode divergir se `enrichmentQueue.add` falhar pós-commit:** em ambos os arquivos, `imported++`/`importedLeadIds.push` ocorrem ANTES do `await enrichmentQueue?.add(...)`, tudo dentro do mesmo `try` cujo catch externo incrementa `failed`. Se o BullMQ estiver fora (Redis down), o item commitado seria contado como `imported=1` E `failed=1`. Exposição pré-existente da mesma classe (antes o add estava no meio do item e uma falha dele já contava `failed` com company commitada órfã) — o diff não piora a atomicidade, só muda qual contador diverge. Sugestão de follow-up (não bloqueante): mover o `enrichmentQueue.add` para depois do catch ou envolver em try/catch próprio com log.
- **P3 — janela de corrida dedup permanece (by design):** `findFirst` de dedup fora da tx + P2002 como backstop é o padrão correto; sem mudança.
- Nenhum achado P0/P1/P2.

## Riscos residuais

- Rollback ponta a ponta (Postgres real) não exercitado — mitigado pela maturidade de `runInTransaction` e pela recomendação de teste de integração no handoff. Recomendo ao 00/08 incluir cobertura de integração no gate se ainda não houver.
- `importSelectedBitrixLeads/Deals` é chamado por mesaTratamento, bitrix.routes, bitrix.service, LeadUseCases e syncRules — todos herdam atomicidade sem mudança de assinatura (confirmado: assinatura inalterada no diff).

## Veredito

**APROVADO** — escopo exato do diff (commit 19b49e8e5): DEBT-0020 corrigido corretamente — tx interativa por item com tenant fail-closed, writes atômicos via propagação ALS do client estendido, efeitos externos pós-commit, P2002→skipped preservado, sem timeout por lote, sem tocar `src/lib/queue/**` nem schema. Gates confirmados pelo auditor: tsc exit 0; vitest 18/18 nos dois arquivos de teste. Handoff completo e honesto sobre a limitação do unitário. Sem pendência bloqueante.
