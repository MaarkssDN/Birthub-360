# Handoff 99 → Squad 50 (Atlas/Lino) — Bitrix: finding Semgrep bloqueante + SSRF

- **De:** Agente 99 — Vito · **Para:** Agente 50 — Atlas (coordenador) / Agente 52 — Lino
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## 1. Semgrep BLOCKING — `src/features/integrations/bitrix/bitrix.routes.ts:837`

- Regra: `javascript.express.security.audit.xss.direct-response-write.direct-response-write`
- Código atual (verificado): `res.attachment(filename).type('application/octet-stream').send(buffer)` — download autenticado (`managementRoles` + `auditAccessMiddleware('BitrixExtractionDownload')`, DEM-20261114-003).
- **Classificação: falso positivo funcional** — `attachment` + `octet-stream` não renderiza HTML no browser; o buffer é dump de extração do próprio tenant.
- **Porém bloqueia todo PR** enquanto o Semgrep rodar (`--error`). Opções (decisão do owner + Agente 94):
  a) `// nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write` com justificativa (download binário autenticado, MIME octet-stream);
  b) reescrever como `res.status(200).set({...}).end(buffer)` — pode ou não silenciar a regra (testar);
  c) configurar exclusão justificada em `.semgrepignore` (menos recomendado — esconder arquivo inteiro).
- **Não apliquei supressão** (regra dura: suppressions artificial proibidas; decisão pertence ao owner do arquivo).

## 2. CodeQL `error` — `src/features/integrations/bitrix/service/bitrix.ts:186`

`js/request-forgery`: wrapper `fetch(url, init)` genérico de retry. Classificação **BAIXO-MÉDIO**: o risco depende dos callers passarem URL vinda de input/tenant sem validação. Verificar callers (webhook Bitrix, extrações) e, se aplicável, rotear por `urlGuard`.

## 3. Relacionado (outro owner)

- `src/features/integrations/bitrix/service/extraction.ts` — hotspot arquitetural 1042/1100 linhas, exceção vence 30/11 (ver handoff 94/coordenador). Owner sugerido pela auditoria Onda 2: Agente 52 — Lino.
