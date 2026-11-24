# Handoff 99 → Agente 94 (Tess) — CI: Semgrep, Trivy waivers e branch protection

- **De:** Agente 99 — Vito · **Para:** Agente 94 — Tess (CI/CD)
- **Data:** 2026-11-24 · **Onda:** 3 · **Demanda:** DEM-20261123-001
- **Baseline:** `027f42b18` · **Evidência:** `docs/security/onda-3/TRIAGEM_APPSEC_ONDA3_20261124.md`

## 1. Semgrep — estado verificado

- Workflow `security-semgrep.yml` é bloqueante (`--error`), rulesets `p/typescript`+`p/nodejs`+`p/secrets`, escopo `src server.ts worker.ts scripts`.
- Último run (45105231319, branch `devin/handoff-encerramento-20261122`, 2026-11-23): **FAIL, 2 findings**:
  1. `scripts/security/reencrypt-credentials.ts` `bypass-tls-verification` — **na baseline o padrão não existe mais** (`credential-script-guards.ts:295-303` é fail-closed com opt-out explícito `DB_SSL_INSECURE_SKIP_VERIFY`). Provável já corrigido em outra branch → **rodar Semgrep na baseline para confirmar** antes de qualquer ação.
  2. `src/features/integrations/bitrix/bitrix.routes.ts:837` `direct-response-write` — **falso positivo funcional** (download `application/octet-stream` autenticado). Bloqueia PRs até owner do arquivo aplicar `nosemgrep` justificado ou reescrever (ver handoff 99→50). **A decisão de supressão é do owner + você; eu não aplico supressão artificial.**
- Comando local equivalente (semgrep não instalado neste worktree; docker indisponível):
  `semgrep scan --config p/typescript --config p/nodejs --config p/secrets --error --metrics=off --exclude node_modules --exclude dist --exclude tests src server.ts worker.ts scripts`
- **Verificar branch protection:** o comentário do workflow diz que o contexto "Semgrep SAST" precisa ser adicionado manualmente como required check — confirmar se já é required em `main`.

## 2. Trivy — vencimento 30/11 (decisão urgente)

- `.trivyignore.yaml`: **40 entradas** (demanda citava 36; drift por pares maiúsculo/minúsculo do mesmo CVE), todas `expired_at: 2026-11-30`.
- Auditoria Onda 2 (`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md`) classificou: Grupo A (produção: `better-auth`, `dompurify`, `nodemailer`) exige bump ou justificativa; Grupo B (build-only: prisma/effect/deepmerge-ts, vitest, picomatch, brace-expansion) pode manter; Grupo C (já corrigidos: source-map-js, undici, re2js) é candidato a poda.
- **Pedido:** garantir que a decisão humana sobre renovações aconteça antes de 29/11 21h -03; se não houver decisão, o gate Trivy de PR volta a falhar nesses pacotes.

## 3. `npm audit` na baseline

2 moderadas (`@opentelemetry/instrumentation-http`, dev-only via `auto-instrumentations-node`), 0 altas/críticas. `security:audit-waivers` (`scripts/security/check-audit-waivers.ts`) é o gate correspondente — nada a fazer além de bump rotineiro.

## 4. Observação de escopo

`agente-codigo-local/` (58 arquivos tracked) não é coberto pelo Semgrep (fora do escopo do scan) mas **é coberto pelo CodeQL** — ver handoff 99→00 para decisão de destino.
