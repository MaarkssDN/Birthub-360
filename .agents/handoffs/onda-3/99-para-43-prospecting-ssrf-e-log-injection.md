# Handoff 99 → Squad 40 (Amon/Cadu) — Prospecção: SSRF, log-injection e rate-limiting

- **De:** Agente 99 — Vito · **Para:** Agente 43 — Amon (Prospecção Outbound) / Agente 41 — Cadu
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## Achados CodeQL `error` no domínio `src/features/prospecting/`

| Regra | Local | Qtde | Classificação |
|---|---|---|---|
| `js/request-forgery` | `outbound/server/ai.ts:64,154,687` | 3 | **MÉDIO** — `fetch` para `${config.ollamaUrl}/api/...`. Se `ollamaUrl` for configurável por tenant/admin sem allowlist de host, é SSRF intra-tenant (alcance a rede interna/metadata). Verificar origem do config e aplicar `urlGuard`/`isSafeUrl` ou allowlist. |
| `js/request-forgery` | `services/enrichment/webScraper.service.ts:131` | 1 | **BAIXO-MÉDIO** — já existe `isSafeUrl()` (linhas 42/122) rejeitando antes do fetch; CodeQL não reconhece a guarda customizada. Avaliar migrar para `src/shared/security/urlGuard.ts` (canônico) para reduzir ruído e unificar política. |
| `js/request-forgery` | `services/cnpj.ts:88,165`; `outbound/server/services/bitrix.ts:186` | 3 | **BAIXO** — hosts fixos (`brasilapi.com.br`, `minhareceita.org`) com path sanitizado (`cleanCnpj`); `bitrix.ts` é wrapper genérico — revisar callers que passam URL vinda de input. |
| `js/log-injection` | `services/cnpj.ts:157,221`; `webScraper.service.ts:191,225`; `outbound/server/routes/leads.routes.ts:1050`; `outbound/server/routes/system.routes.ts:120` | ~6 | **MÉDIO** — log entries dependem de valores de usuário; sanitizar/estruturar antes de logar (risco: forjar trilha de auditoria/SIEM). |
| `js/missing-rate-limiting` (warning) | `outbound/server/routes/auth.routes.ts`, `routes.ts`, `integrations.routes.ts:353`, `job-roles.routes.ts` | ~5 | **ALTO (contexto)** — rotas de auth/login e integrações sem rate limit = brute-force/credential stuffing. Recomendo acionar Agente 25 — Tália (Rate Limiting) para política, e aplicar nos handlers. |
| `js/incomplete-url-substring-sanitization` (warning) | `webScraper.service.ts`, `cnpj.ts`, `crawlee/crawler.ts` | ~15 | **MÉDIO** — bypass de sanitização por substring; revisar `isSafeUrl` e validações de URL. |
| `js/polynomial-redos` (warning) | `outbound/server/validators.ts`, `services/leadSearch.service.ts` | ~3 | **MÉDIO** — regex catastróficas em input de busca; adicionar timeout/limite de input. |

## Pedido
1. SSRF `ollamaUrl`: confirmar se URL é admin-only; se sim, documentar e allowlist hosts; se tenant-level, aplicar `urlGuard`.
2. Log-injection: sanitizar campos de log nos pontos listados.
3. Abrir demanda para Agente 25 (Tália) cobrir rate-limiting nas rotas auth/integrations do outbound.
