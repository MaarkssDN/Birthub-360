- De: 00
- Para: 06 (Integrações) + 06A
- Status: ABERTO
- Prioridade: P1

## Achados

### DEBT-0020 — Importação Bitrix não atômica — P1 (execução técnica com 01)
`bitrix/service/leads.ts:321-377`, `deals.ts:436-502`: company/contact/lead/audit sequenciais fora de $transaction → falha no meio deixa órfãos; enrichment enfileirado pode rodar em empresa que nunca vira lead.
**Correção:** runInTransaction por item; enrichment só pós-commit; P2002→rollback do item.
**Aceite:** falha injetada não deixa Company/Contact órfãos.

### DEBT-0006 (co 01) — Fallback global BITRIX24_WEBHOOK_URL — P1
`LeadUseCases.ts:570-576`: remover fallback ou allowlist; declarar env em env.ts. Verificar env em produção.

### DB-02 — Outbound legado sem tenant canônico/RLS — P2 (gated 503)
`outbound/server/db.ts:29-56`, `auth.ts:226-246`: normalizeTenantCompany colapsa 'birthhub'/'360'→'birthhub360' — duas orgs com company normalizada igual compartilham escopo; SQL raw escapa interceptores. RLS não aplicada de propósito (migration 20261117230000).
**Regra:** NÃO reativar sem migrar para organizationId canônico + RLS, ou mapear company→Organization.id server-side fail-closed.

## Contexto
PR #383 (tenancy prospecting) já mergeado em main — providerCache v2, findSearchExecution orgId confirmados. Webhooks Bitrix inbound OK (application_token por conexão, timing-safe).
