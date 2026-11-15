# 01a-para-04-tenancy-fks-crm.md

- De: 01A (Confiabilidade de Dados, RLS e Retenção)
- Para: 04 (CRM e BI)
- Onda: reconciliacao-20261114 / onda-paralela-8
- Status: aberto
- Prioridade: alto
- Bloqueador-ref: auditoria `01a-para-00-tenancy-audit-relatorio-20261114.md`
- Sprint destino: Onda 3 (backend/dados)

## Problema

Auditoria de tenancy do CRM (01A, 2026-11-14) encontrou gaps de validação de FKs referenciadas pelo cliente — IDs de entidades relacionadas aceitos do body e gravados sem verificar se pertencem ao `organizationId` do requisitante. Mitigado por RLS na leitura, mas o vínculo cross-tenant persiste e vaza PII se RLS inativa (cenário documentado como real neste código).

## Arquivo(s) envolvido(s)

1. `src/features/crm/infra/PrismaLeadRepository.ts:175-201` (create) e `:262-294` (update) — `companyId`/`contactId`/`pipelineId`/`pipelineStageId` via `leadSchema` (`src/lib/zod.ts:105-127`) gravados por spread sem validação de tenant.
2. `src/features/crm360/infra/PrismaCrm360Repository.ts:613-657` (`addDealItem`) — `productId` sem checar tenant do `CrmProduct`; `include: { product: true }` vaza sob ausência de RLS.
3. `src/features/crm360/infra/PrismaCrm360Repository.ts:681-754` (`createDocument`) — `leadId`/`companyId`/`contactId` idem.
4. Gate CYC-007 — `src/features/crm/application/dealClosureGate.ts:51-96` grava `Note`+`DealClosureEvent` ANTES de validar tenant do lead, chamado por `LeadUseCases.ts:209-218`, `LeadUseCases.ts:153-162` e `PrismaCrm360Repository.ts:481-493`. Sem RLS gera evidência órfã cross-tenant.
5. BAIXA (defense-in-depth): `batchUpdateLeads` (`LeadUseCases.ts:721-724`), `enqueueBatchEnrichment` (`:659-662`), dedup services — writes sem `organizationId` no `where`.

## Evidência

Relatório completo: `.agents/handoffs/onda-paralela-8/01a-para-00-tenancy-audit-relatorio-20261114.md` — cada achado com arquivo:linha, mecanismo e recomendação.

## Alteração necessária

- Validar cada FK referenciada com `findFirst({ where: { id, organizationId } })` antes de gravar (ou rejeitar no schema e usar endpoints dedicados).
- Nos 3 call sites do gate CYC-007, validar `lead` pertence ao tenant ANTES de invocar `ensureManualDealClosureAllowed`.
- Alinhar writes de baixa severidade ao padrão `{ id, organizationId }`.

## Teste esperado

- Teste dois-tenants: criar/atualizar lead/deal/document com FK de outro tenant → rejeitado (404/422), sem escrita órfã; gate CYC-007 com leadId estrangeiro → 404 limpo sem Note/DealClosureEvent gravados.

## Contexto adicional

Veredito geral da auditoria: padrão dominante correto — `organizationId` sempre de `req.user`, rotas com `authenticateToken`+`requireTenant`, queries com filtro de tenant. Nenhum vazamento cross-tenant comprovado em regime normal com RLS ativa. Observação fora de escopo registrada para o 00: `batchUpdateLeads` bypassa deal closure gate/closedAt/sync de pipeline (gap CYC-007, não tenancy).
