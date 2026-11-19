# Handoff — DEBT-0020: Importação Bitrix não atômica → órfãos parciais

De: Agente 06 — Integrações e Bitrix
Para: Agente 00 — Coordenador
Onda: reconciliacao-release-readiness-20261119 (DEBT-0020)
Status: resolvido
Prioridade: alto
Bloqueador-ref: nenhum
Sprint destino: release-readiness

## Problema

`importSelectedBitrixLeads` (leads.ts) e `importSelectedBitrixDeals` (deals.ts) executavam
`company.create` → `contact.create` → `lead.create` como transações independentes por item.
Qualquer falha depois do primeiro create (ex.: P2002 da unique constraint
`@@unique([organizationId, bitrixLeadId])` numa corrida de importação, queda de conexão,
timeout) deixava Company e Contact commitados órfãos, sem Lead vinculado — lixo no CRM que
nenhuma tela de importação mostra nem limpa.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/service/leads.ts` (~linhas 321-400)
- `src/features/integrations/bitrix/service/deals.ts` (~linhas 436-520) — mesmo débito,
  mesmo padrão; corrigido junto por ser o mesmo fluxo de importação Bitrix → Atlas.
- `src/features/integrations/bitrix/service/__tests__/leads.test.ts`
- `src/features/integrations/bitrix/service/__tests__/deals.test.ts`

## Alteração necessária (executada)

- Os três creates + o `AuditService.log({ action: 'IMPORT' })` por item agora rodam dentro de
  UM `runInTransaction(fn, { organizationId })` (`src/lib/prisma.ts`, helper já existente —
  mesmo padrão de `PrismaCrmDealItemsRepository`). Rollback total em qualquer falha.
- `enrichmentQueue.add('enrich-company', ...)` movido para DEPOIS do commit — efeito externo
  não pode ser enfileirado para empresa que sofreu rollback.
- Granularidade: transação POR ITEM (não por lote) — lotes de até 100 itens estourariam o
  timeout default de 45s do `runInTransaction` e segurariam locks por muito tempo. Falha em
  um item continua contando em `failed` sem afetar os demais (comportamento preservado).
- Chamadas de rede Bitrix (`callBitrix`, `getDealStages`) e checagens (`findFirst`,
  `findOwnershipConflict`, `resolveBirthubUserIdByEmail`) permanecem FORA da transação —
  tx só envolve escritas locais.
- Sem mudança de schema (nenhuma necessidade — handoff para 01 não foi requerido).
- `src/lib/queue/**` não foi tocado (slot exclusivo com o Agente 16 respeitado —
  `enrichmentQueue` é apenas consumido, não modificado).

## Evidência

- `npx tsc --noEmit` → exit 0, sem erros.
- `npx biome lint` nos 4 arquivos alterados → limpo.
- `npx vitest run -c vitest.unit.config.ts` em leads/deals/syncRules tests → 24 testes,
  24 passaram. Novos testes de regressão (DEBT-0020):
  - creates executam dentro de `runInTransaction` com `{ organizationId }`;
  - falha no `lead.create` → `failed=1` e `enrichmentQueue.add` NÃO chamado (rollback);
  - P2002 continua `skipped=1` sem enfileirar enriquecimento.
- Branch: `agente/06-bitrix-import-transacao` (worktree
  `C:\Github\Birthub-360-worktrees\agente-06-bitrix-import`).

## Teste esperado

- Importar lead/negócio com falha simulada no `lead.create` → nenhuma Company/Contact/Lead
  parcial persiste; item contado em `failed`; demais itens do lote importam normalmente.
- Importação bem-sucedida → Company+Contact+Lead comitam juntos; enriquecimento enfileirado
  uma única vez pós-commit.

## Pendências / observações para o Coordenador

- Rollback real (Postgres) não é exercitável no unitário com prisma mockado — os testes
  verificam o contrato (runInTransaction por item + enrichment pós-commit). Se houver teste
  de integração DB disponível no gate de integração, vale cobrir o rollback ponta a ponta.
- `importSelectedBitrixLeads` também é chamado por `mesaTratamento.routes.ts` (SDR),
  `bitrix.routes.ts`, `bitrix.service.ts`, `LeadUseCases.ts` (sync rápido) e `syncRules.ts`
  (worker) — todos herdam a atomicidade automaticamente, sem mudança de assinatura.
- Timeout por item permanece o default do `runInTransaction` (45s prod / 30s test) — suficiente
  para ~4-5 queries locais; se um dia o item ganhar muitos writes, reavaliar `timeoutMs`.
