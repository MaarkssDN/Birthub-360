# MEL-16 — Auditoria de N+1 / over-fetch em rotas de listagem

- Agente: 01 — Plataforma, Segurança e Dados
- Onda: 2 (follow-up DEM-20261114-003)
- Data: 2026-11-14
- Branch: `agente/01-followup-audit`

## Método

Varredura estática (`grep`/`read`) de todos os `findMany`/`include` do Prisma nos
repositórios que servem rotas de listagem, classificando cada `include` como **to-one**
(custo constante por linha, sem risco de over-fetch) ou **to-many** (baixa N linhas
filhas por registro da página — o padrão do bug corrigido em companies na Onda 2,
commit 113f52196).

## Resultado por listagem

| Listagem | Arquivo | Includes | Veredito |
|---|---|---|---|
| `GET /api/companies` | `src/features/companies/infra/PrismaCompanyRepository.ts` | `contacts`/`leads` removidos na Onda 2; `findById` mantém include (detalhe) | OK (corrigido Onda 2) |
| `GET /api/contacts` | `src/features/contacts/infra/PrismaContactRepository.ts:34` | `company` (to-one) | OK |
| `GET /api/leads` | `src/features/crm/infra/PrismaLeadRepository.ts:135` | `company`, `contact` (to-one) | OK |
| `GET /api/leads/export/csv` | `PrismaLeadRepository.findAllForExport` (`:422`) | `company`, `contact` (to-one); export já tem `auditAccessMiddleware('Lead')` | OK |
| `GET /api/activities` | `src/features/activities/infra/PrismaActivityRepository.ts:76` | `lead → company, contact` (cadeia to-one) | OK |
| `GET /api/crm/board` | `src/features/crm360/infra/PrismaCrm360Repository.ts` `getBoardLeads` | **`dealItems` (to-many) — REMOVIDO neste follow-up** | CORRIGIDO |
| `GET /api/crm/deals` | `PrismaCrm360Repository.getDeals` | **`dealItems` (to-many) — REMOVIDO neste follow-up** | CORRIGIDO |
| `PUT /api/crm/records/:id/stage` | `PrismaCrm360Repository.updateLeadStage` | `dealItems` mantido — registro único (resposta de mutação, custo limitado a 1 lead) | OK (justificado) |
| Commercial Intelligence | `src/features/commercial-intelligence/infra/PrismaCommercialIntelligenceRepository.ts:46` | `dealItems` já usa `select` enxuto (`sku`, `product.sku`) para agregar SKUs — não é over-fetch | OK |
| Bitrix `listBitrixLeads`/`listBitrixDeals` | `src/features/integrations/bitrix/service/{leads,deals}.ts` | chamadas à API externa do Bitrix, não queries Prisma aninhadas | OK (fora do escopo N+1 local) |

## Achado e correção (dealItems)

`CrmDealItem` é relação to-many de `Lead` (~12 colunas, `@@index([organizationId, leadId,
sortOrder])`). `getDeals` e `getBoardLeads` faziam `include: { ..., dealItems: true }`,
baixando todos os itens de cada negócio da página — o mesmo padrão de over-fetch
corrigido em `Company` (contacts/leads) na Onda 2.

Evidência de que a remoção é segura:
- Nenhum consumidor frontend/backend lê `dealItems` dessas respostas (grep por
  `dealItems` em `src/**/*.tsx` e nos consumers de `/api/crm/deals` e `/api/crm/board`:
  zero ocorrências fora dos dois repositórios).
- Existe endpoint dedicado `GET /api/crm/deals/:leadId/items`
  (`crm360.routes.ts`) para o detalhe sob demanda.
- `updateLeadStage` mantém o include por ser escrita em registro único (não listagem).

Correção aplicada neste branch: remoção de `dealItems: true` dos dois `findMany` de
listagem, com comentário MEL-16 no código.

## Cobertura

- Testes de listagem existentes: `tests/integration/companies.test.ts`,
  `tests/integration/contacts.test.ts`, suíte crm360.
- Nenhum teste existente asserta a presença de `dealItems` nas respostas de board/deals
  (verificado por grep em `tests/`).
