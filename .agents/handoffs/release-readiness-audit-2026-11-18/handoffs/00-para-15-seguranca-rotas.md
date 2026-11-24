- De: 00
- Para: 15 (Segurança aplicada)
- Status: ABERTO
- Prioridade: P1/P2/P3

## Achados (relatório: auditoria/seguranca-tenancy-lgpd.md)

### DEBT-0005 (co 05) — SSRF residual scraper — P1
`isSafeUrl` fraco + redirects sem revalidação + rota sem requireRole. Correção canônica `safeFetch`/`assertSafeExternalUrl`.

### DEBT-0006/0007 — Fallback Bitrix global + segredo 3CX global — P1 env-dependentes
Execução com 06/01 e 12/01 respectivamente. **Ação 15:** checklist de verificação de envs em produção (BITRIX24_WEBHOOK_URL, THREECX_WEBHOOK_SECRET) — evidência necessária p/ severidade real.

### SEC-04 — Enumeração e-mail cross-tenant no convite — P3
`team.service.ts:116-119`: findUnique por email sem org; 409 revela existência em outro tenant. Resposta genérica.

### SEC-05 — Módulos novos sem restrição de papel — P3/P2
`socialSelling.routes.ts`, `salesOrchestration.routes.ts`: POST IA/escrita acessível a VISUALIZADOR. Definir roles + requireRole (alinhar com 18/DEBT-0045).

### SEC-06 — Enrichment repo sem orgId no where — P3
`PrismaEnrichmentRepository.ts:53-71`: só RLS cobre. Adicionar organizationId aos wheres (defesa em profundidade).

### SEC-07 — process.env cru p/ segredos — P3
BITRIX24_WEBHOOK_URL (ver 0006), publicLead.routes.ts:42, dsrRequest.service.ts:62-66.

## Saudável (não reabrir)
Auth map completo, 8 webhooks HMAC fail-closed, RBAC hierarquia única, RLS FORCE + gate estático, SQL parametrizado, sem segredos hardcoded, PII redact em logs, DSR tokens 32B.
