De: 01A — Confiabilidade de Dados, RLS e Retenção
Para: 04 — CRM e BI
Onda: paralela-8
Status: aberto
Prioridade: alto
Bloqueador-ref: handoff 00→01A tenancy-audit (mesma onda)
Sprint destino: próxima onda CRM

## Problema

Encontrado durante a auditoria de tenancy do Agente 01A (handoff
`.agents/handoffs/onda-paralela-8/00-para-01a-tenancy-audit.md`), fora do escopo de
RLS/retenção — reportado aqui por ser dono do domínio.

`LeadUseCases.batchUpdateLeads` (`src/features/crm/application/LeadUseCases.ts`,
rota `POST /api/leads/batch-update`, usada pelo `handleBatchMoveStage` de
`src/components/CrmBoard.tsx`) grava `updates.status` **cru** em `Lead.status`:

```ts
if (updates.status && updates.status !== lead.status) {
  dataToUpdate.status = updates.status; // ex.: 'Negócios Ganhos' (rótulo legível)
}
...
await prisma.lead.update({ where: { id: lead.id, organizationId }, data: dataToUpdate });
```

Dois problemas:

1. **Status nunca persiste pela UI.** `CrmBoard.tsx` envia o rótulo legível
   (`LEAD_COLUMNS`/`DEAL_COLUMNS` usam valores de `LEAD_STATUS` de `lib/zod.ts`,
   ex.: `'Negócios Ganhos'`, `'Qualificação (SDR)'`), mas a coluna `Lead.status` é o
   enum Prisma (`Negocios_Ganhos`, `Qualificacao_SDR` — ver `enum LeadStatus` em
   `prisma/schema.prisma`). Todos os outros caminhos de escrita passam por
   `toPrismaLeadStatus` (`PrismaLeadRepository.update/updateStatus`,
   `PrismaCrm360Repository.updateLeadStage`); este não. O Prisma rejeita o valor
   inválido → o item cai em `failedCount` (a UI mostra "N de M movidos — K falharam",
   então o bug é visível mas silencioso em volume). O teste
   `LeadUseCases.batchUpdate.test.ts` usa `'Qualificacao_SDR'` (identificador do
   enum), então não reproduz o que a UI envia de verdade.
   Agravante: a comparação `updates.status !== lead.status` compara rótulo com
   identificador do enum — nunca iguais — então a escrita é sempre tentada.

2. **Se o mapeamento fosse corrigido, o caminho continuaria divergente dos demais:**
   não passa por `ensureManualDealClosureAllowed`/`ensureDealClosureAllowed`
   (CYC-007 — fechar "Negócios Ganhos" exige evidência determinística e
   `DealClosureEvent`), não sincroniza `pipelineId`/`pipelineStageId`/`probability`
   (CRM-011), não grava `closedAt` na transição para status final e não registra
   `LeadStageHistory.isWon/isLost` — só um `stageName` cru.

## Arquivo(s) envolvido(s)

- `src/features/crm/application/LeadUseCases.ts` (`batchUpdateLeads`, ~linha 667-770)
- `src/components/CrmBoard.tsx` (`handleBatchMoveStage`, ~linha 473) — referência do payload real
- `src/features/crm/application/__tests__/LeadUseCases.batchUpdate.test.ts` — teste que mascara o bug (usa identificador de enum, não rótulo)

## Evidência

- `LEAD_COLUMNS`/`DEAL_COLUMNS` em `src/components/CrmBoard.tsx:51-72` contêm
  rótulos (`'Negócios Ganhos'`), não identificadores Prisma.
- `enum LeadStatus` em `prisma/schema.prisma` — identificadores são
  `Negocios_Ganhos` etc.; `@map` guarda o rótulo no banco, mas o client Prisma só
  aceita o identificador.
- `toPrismaLeadStatus` (`src/lib/enumMap.ts:82`) existe exatamente para essa
  conversão e não é chamada aqui.
- `requireRole(['ADMIN','GESTOR','CLOSER','SDR'])` na rota — o batch move é
  executável por CLOSER/SDR, que é justamente o público que o gate de fechamento
  (CYC-007) deveria proteger.

## Alteração necessária

Decisão de produto/código do dono do CRM, sugestão mínima:

1. Mapear `updates.status` via `toPrismaLeadStatus` antes de comparar/gravar
   (e comparar no mesmo espaço de valores — idealmente normalizar `lead.status`
   com `fromPrismaLeadStatus` antes do diff).
2. Ao mover para status de fechamento (`isLeadClosingStatus`), acionar o mesmo
   gate de `updateLeadStatus`/`updateLead` (ou delegar o batch inteiro para
   `updateLeadStatus` por item, herdando gate + sincronia de pipeline + closedAt
   de graça — mais simples e consistente que duplicar a lógica).
3. Ajustar o teste para usar o rótulo que a UI envia de verdade (regressão real).

## Teste esperado

- `POST /api/leads/batch-update` com `updates.status = 'Negócios Ganhos'` (rótulo)
  persiste `Negocios_Ganhos`, cria `DealClosureEvent`/`LeadStageHistory`
  consistentes e atualiza `closedAt` — ou rejeita com 401/403 quando não houver
  evidência de fechamento, igual aos demais caminhos.
- Teste unitário cobrindo rótulo → identificador.

## Contexto adicional

- Não há impacto de tenancy nesta rota (filtro `organizationId` no `findMany` e,
  após correção do 01A nesta mesma onda, também no `update` de cada item).
- O `owner` em batch já usa `User.id` (correto, DATA-003); o problema é só `status`.
