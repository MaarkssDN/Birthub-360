- De: 00
- Para: 05 (Prospecção/Outbound)
- Status: ABERTO — verificar PR #383 antes de codar
- Prioridade: P1

## Achados

### DEBT-0005 (co 15) — SSRF residual no scraper — P1 (P0 se metadata cloud)
`webScraper.service.ts:42-69,131` + `crawlee/crawler.ts:65-71`: `isSafeUrl` é string-compare — não cobre 169.254.x, IPv6, CGNAT, 0.0.0.0; fetch/goto seguem redirects sem revalidar; rota `/enrich` sem requireRole (VISUALIZADOR alcança).
**Correção:** `safeFetch`/`assertSafeExternalUrl` canônicos + requireRole.

### DEBT-0010 (co 17) — Nenhuma mensagem outbound instrui opt-out — P1 LGPD
`cadenceTemplates.ts`, `CadenceDispatchers.ts:316-318`, `cold-email.service.ts:120`. Opt-out existe mas destinatário nunca é informado → inexerciseível.
**Correção:** sufixo obrigatório "responda SAIR" + List-Unsubscribe.

### DEBT-0011 + DEBT-0044 — UM ÚNICO HANDOFF (parecer 24) — P1
`cold-email.service.ts:72-138` + `prospecting.routes.ts:341-365`: sem persistência (Activity/EmailMessage), sem idempotência, sem bounce, legalBasis não gravada, sem Zod, falhas colapsam em 500.
**Correção:** persistir disparo + dedupe + gravar legalBasis/dataSource + schema Zod + outcome discriminado. Coordenar com 18 (contrato).

### DEBT-0035 — Budget prospecting possivelmente ilusório — P2
`providerBudget.ts:335-381`: verificar se `recordProspectingProviderSpend` ainda é chamado; sem teto configurado não há débito nem bloqueio.

### DEBT-0045 (co 18/07) — Rotas prospecção/IA sem requireRole/Zod — P2
VISUALIZADOR dispara LLM/provider pago (`/decision-makers`, `/icebreaker`, `/cold-email`, `/promote`, saved-searches etc.).

### DEBT-PRO-05/08/11/12/13/14 — P2/P3
sendColdEmailBatch sem consumidor; InMemoryOptOut 200; rate limit por processo; module-gate ausente em /cadence/*/prospecting/*; dead code outbound.

## Contexto
Correções de tenancy do PR #383 já confirmadas em main (providerCache v2, findSearchExecution orgId).
