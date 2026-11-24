# Handoff 99 → Agente 20 (Ciro) — Backend core: CodeQL transversal e auth

- **De:** Agente 99 — Vito · **Para:** Agente 20 — Ciro (Backend & Contratos)
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## Achados CodeQL em código core compartilhado

| Regra | Local | Qtde | Classificação / pedido |
|---|---|---|---|
| `js/remote-property-injection` | `src/shared/middlewares/sanitizeRequest.ts`; `src/lib/voice-hub/services/workflowCollabService.ts`; `src/features/prospecting/outbound/server/auth.ts`; `src/features/integrations/bitrix/service/leads.ts` | ~10 (warning) | **MÉDIO** — prototype pollution via chaves controladas por usuário em merge/assign. Revisar `sanitizeRequest` (ponto único) e os consumers; mitigar com `Object.create(null)`/blocklist de `__proto__`/`constructor`/`prototype`. |
| `js/insecure-helmet-configuration` | `src/bootstrap/security.ts:123` | 1 (error) | **BAIXO/by-design** — `contentSecurityPolicy:false` só fora de produção; produção tem CSP explícita. Se o gate `codeql-sarif` reprovar PRs por este alerta, suprimir com justificativa de ambiente (decisão Agente 94/00). |
| `js/reflected-xss` | `src/features/activities/presentation/ActivityController.ts:115` | 1 (error) | **BAIXO-MÉDIO** — feed iCal attachment; confirmar escaping de `owner`/campos no `generateIcalFeed` (owner do domínio: Squad 40/Agente 04). |
| `js/user-controlled-bypass` | `src/features/prospecting/outbound/server/routes/integrations.routes.ts:353` | 1 (error) | **MÉDIO — revisar** — `effectiveKey = apiKey \|\| process.env.HUNTER_API_KEY`: body pode injetar chave arbitrária na verificação Hunter. Confirmar se é intencional (BYO-key) e documentar; caso contrário remover fallback. |
| `js/insufficient-password-hash` | `src/features/api-keys/apiKey.service.ts` | 1 (warning) | **MÉDIO** — verificar hashing de API keys (mesmo tema do handoff 99→60 para `voice-hub/services/apiKeyService.ts`). |
| `js/bad-tag-filter`, `js/incomplete-sanitization` | `src/lib/zodSanitizer.ts`, `src/lib/search/index.ts`, `scripts/verify-openapi-drift.ts` | ~5 (warning) | **MÉDIO** — sanitizadores centrais; bypass de tag filter pode reabrir XSS downstream. Prioridade para revisão pelo dono de `src/lib`. |
| `js/missing-rate-limiting` | `src/features/job-roles/routes/job-roles.routes.ts`, `src/features/prospecting/outbound/server/routes.ts` | ~3 (warning) | **ALTO (contexto)** — escalar para Agente 25 — Tália. |

## Fora do escopo deste handoff (já roteado)

- Prospecting services/cnpj/webScraper/ai.ts → handoff 99→43.
- Bitrix routes/services → handoff 99→50.
- Voz/voice-hub/ai-voice → handoff 99→60.
- Serviços de IA (prompt injection) → handoff 99→70.
- `agente-codigo-local/` → handoff 99→00 (destino do diretório).

## Peço
1. Triagem dos itens `src/lib/*` e `src/shared/middlewares/*` (transversais — maior alavanca por linha alterada).
2. Confirmação do comportamento `integrations.routes.ts:353` (apiKey do body).
3. Encaminhar rate-limiting ao Agente 25.
