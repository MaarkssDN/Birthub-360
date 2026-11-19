# Auditoria READ-ONLY — Agente 04 · CRM e BI
**Data:** 2026-11-18 | **Base:** `main @ b54060ad1` | Sem execução de gates; sem git/PR tooling (cobertura de PR avaliada por código+docs).

## Evidência sobre PR #390
`main` já contém correções associadas: `assertLeadRelationsInTenant` em `PrismaLeadRepository.ts` (~60, ~225, ~265) com testes; `batchUpdateLeads` delega status a `updateLeadStatus` (`LeadUseCases.ts:675-791`) com nota de atomicidade documentada; handoff `00-para-24-adendo-pr390-atomicidade-batchupdate.md` confirma pendência.

## Findings

### CRM-01 — batchUpdateLeads pode persistir status e contar item como falha — P1, Alta
`LeadUseCases.ts:675-791`. Duas escritas sequenciais (updateLeadStatus → depois owner/tags). Falha na 2ª → status persiste mas `failedCount` incrementa. Na main anterior era escrita única atômica.
Correção: transação com rollback ou resultado por campo; diferenciar rejected/partialFailure/infraError.
Coberto por PR: parcial (#390 mantém trade-off documentado).

### CRM-02 — Mesa de Tratamento altera Lead.status fora do fluxo canônico — P1, Alta
`mesaTratamento.routes.ts:282-322`. `POST /lead/:id/register` grava `status` direto via `prisma.lead.update` (sem organizationId no where final) — sem LeadStageHistory, pipeline sync, closedAt, integrações.
Correção: usar `LeadUseCases.updateLeadStatus` canônico.
Coberto por PR: não.

### CRM-03 — Ação aprovada de IA altera status p/ Cadencia_Iniciada sem histórico — P2, Alta
`aiPendingAction.service.ts:252-271`. `updateMany` direto, sem histórico/pipeline/closedAt.
Coberto por PR: não.

### CRM-04 — Contact.companyId não validado contra tenant — P1, Alta
`PrismaContactRepository.ts:50-85`. create/update aceitam companyId sem verificar organizationId da empresa → vínculo cross-tenant possível.
Correção: validar `company.findFirst({id, organizationId})`; ideal FK composta via Agente 01.
Coberto por PR: não.

### CRM-05 — Exclusão de Company é hard delete sem guarda — P1, Média-alta
`PrismaCompanyRepository.ts:181-185`. `prisma.company.delete` direto; schema tem deletedAt/deletedBy/deleteReason mas não usados. Risco de perda irreversível.
Correção: soft delete ou preflight de dependências.
Coberto por PR: não.

### CRM-06 — convertLead não valida estado anterior — P2, Alta
`PrismaCrm360Repository.ts:484-505`. Re-conversão zera `closedAt`, pode reabrir deal ganho/perdido; sem validação de estado terminal nem transação com histórico.
Coberto por PR: não.

### CRM-07 — LeadStageHistory best-effort — P2, Alta
`leadStageHistory.service.ts:44-50` engole erro após log; update e histórico em chamadas separadas (`PrismaCrm360Repository.ts:468-470,503`). Histórico pode faltar silenciosamente → forecast/auditoria incompletos.
Coberto por PR: não.

### CRM-08 — Escritas Contact/Activity sem organizationId no where final — P2, Alta
`PrismaContactRepository.ts:79-91`; `PrismaActivityRepository.ts:162-198`. findFirst com tenant antes, mas update/delete final usam só `{id}` — proteção depende de uma camada (pré-check+RLS).
Coberto por PR: não.

### CRM-09 — Importação Bitrix cai em webhook global sem conexão própria — P1, Média
`LeadUseCases.ts:559-573` (mesmo achado SEC-02). Se `BITRIX24_WEBHOOK_URL` existir, org importa leads de portal alheio.
Coberto por PR: não.

### CRM-10 — TMQ/velocidade pode retornar null por comparação de nomes — P2, Alta
`PrismaAnalyticsRepository.ts:297-333` filtra `stageName in ['Qualificacao_SDR',...]` (chaves enum) mas `recordStageTransition` grava labels acentuados ('Qualificação (SDR)') → filtro nunca casa → KPI null silencioso.
Correção: filtrar por stageId/pipelineId ou normalizar.
Coberto por PR: não.

### CRM-11 — getMetrics transforma falha em resultado vazio — P3, Alta
`AnalyticsUseCases.ts:383-410`: `catch { return {metrics:[],total:0} }` — dashboard mostra "sem dados" quando houve falha de consulta.
Coberto por PR: não.

### CRM-12 — TimelineEvent sem tenant próprio; Activity exige leadId — P3, Alta
`PrismaActivityRepository.ts:118-198`; schema `TimelineEvent` sem organizationId — RLS filha depende 100% do pai.
Coberto por PR: não.

## Verificado saudável
- updateLeadStatus/updateStatus centralizam status+closedAt+pipeline+histórico; batchUpdate herda CYC-007.
- Permissões CRM com requireRole; delete restrito ADMIN/GESTOR; ownership para CLOSER/SDR.
- forecastEngine determinístico versionado (v2) com sinais reais; UI trata loading/error/empty.
- Analytics: queries Prisma reais com orgId+deletedAt; sem mock numérico nos caminhos auditados.
- Companies: dedupe + @@unique([organizationId,cnpj]); CNPJ normalizado.
- BitrixSyncLog tenant-scoped; webhook registra sucesso/skipped/failed.

## Top-5 riscos comerciais
1. Fallback global Bitrix (cross-tenant).
2. batchUpdate não atômico com failedCount enganoso.
3. Status fora do fluxo canônico (Mesa + IA start_cadence).
4. Contact.companyId sem validação de tenant.
5. BI parcialmente cego (TMQ null, getMetrics mascara erro).

**Veredito: NÃO PRONTO sem mitigar P1s.**
