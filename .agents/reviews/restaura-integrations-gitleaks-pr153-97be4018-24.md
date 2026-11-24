# Parecer Agente 24 — PR #153 (revisão pós-merge)

- Missão: restaurar ExternalCrmPanel.tsx, backup-encrypted.sh e integrationsPing.routes.test.ts sem os literais acusados pelo Gitleaks
- Autor: Agente WF2 (commit por MarksNN) · Auditor: Agente 24 — Revisão Independente
- Revisão auditada (head SHA): `97be4018a9ba731ab002e56dc3fbe38ccc3043bf`
- Base: main `91dfdd48` · Merge em main: `2d62f9fa` (árvore idêntica a 97be4018 — `git diff 97be4018 2d62f9fa` vazio)
- Data: 2026-11-02 (America/Sao_Paulo)

## ⚠️ Desvio de processo
O PR foi **integrado à main pelo Agente 25 antes deste parecer** (merge 2d62f9fa). Isso viola AGENTS.md (linhas 907–909: somente parecer APROVADO do 24 permite integrar). Este parecer é **pós-merge** e não legitima retroativamente o desvio.

## Decisão: **APROVADO (pós-merge), com ressalvas P2/P3** — vinculado a `97be4018`. Nenhum achado P1.

## Verificação do diff vs. originais
- `ExternalCrmPanel.tsx` vs `91dfdd48^`: única diferença linha 153 — `tokenPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...'` → `'Cole aqui seu API Token v2'`.
- `backup-encrypted.sh` vs `f1151a2b^`: única diferença linha 14 — `KEY="0123456789abcdef…"` (64 hex sequenciais) → `KEY="${BACKUP_VERIFY_KEY:-$(openssl rand -hex 32)}"`; **e modo 100644→100755** (não declarado; justificável por ser script executável).
- `integrationsPing.routes.test.ts` vs `34df3eaa^`: 3 ocorrências de `'pat-na1-1234567890'` → constante `FAKE_HUBSPOT_TOKEN = 'test-token'` (linhas 5, 72, 81–82).
- Total: 5 literais substituídos, conforme alegado. `.gitleaksignore` não alterado pelo PR.
- Literais removidos têm aparência de exemplo (prefixo de header JWT truncado, hex sequencial, sufixo 1234567890). **Declaração do dono do produto (Marcelo, 2026-11-02 04:24 BRT): todos eram chaves falsas; rotação não necessária.** Permanecem no histórico git (commits anteriores), sem impacto dado o exposto.
- Propriedade: não toca schema/migrations (01), .github/workflows (08/GHA) nem App.tsx (02).
- LGPD/segredos em backup-encrypted.sh: sem PII; chave de verificação agora efêmera ou via env; modo padrão grava apenas placeholder. Ver P3-3.

## Evidências executadas pelo auditor (worktree limpo, `npm ci --ignore-scripts` + `npx prisma generate`)
- gitleaks 8.21.2 `git --log-opts=origin/main..HEAD`: **no leaks found**. `gitleaks dir .`: 2 achados, **ambos fora do PR** (`.env.test.example:38` generic-api-key; `scripts/security/secret-scan-diff.sh:13` private-key de fixture) — ver P3-4.
- `vite build`: exit 0. `check:bundle-budget`: status ok, **1.917.905 / 3.145.728 B gzip** (confere com o alegado).
- `vitest run -c vitest.unit.config.ts tests/unit/features/integrations/integrationsPing.routes.test.ts`: **5/5**.
- `vitest run -c vitest.unit.config.ts --no-file-parallelism tests/unit/features/integrations`: **24/24 arquivos, 208/208 testes** — `components/Integrations.test.tsx` 6/6. As "2 falhas pré-existentes" alegadas **não reproduziram**; só aparecem rodando sem `-c vitest.unit.config.ts` (timeout 5004 ms e asserção CYC-004), indicando execução fora da config canônica.

## CI
- Head 97be4018, run 41405401893: secret scan, trivy, dependency review **success**; application gate **failure** — Biome 4 errors (herdados: flowIcons.tsx:268, sidebarSections.ts:1, ErrorBoundary.tsx:1, terminalSafety.service.ts:19, dataSubjectErasure.unit.test.ts:16 — nenhum arquivo do PR) / 645 warnings (main 91dfdd48: 643; +2 = ExternalCrmPanel.tsx:809 a11y, ver P3-2).
- Main pós-merge 2d62f9fa: **Frontend Bundle Budget 41406269323 success** (era failure em 41403879043); Code Quality (Lint) 41406553635 success; CodeQL 41406269396 success; Postman sync success; **Central Birth Hub 360 Release 41406269451 failure** (application gate: mesmos 4 errors herdados, 645 warnings); SonarQube 41406269361 em andamento.

## Achados
- **P2-1 (processo):** merge sem parecer 24 (Agente 25). Registrar no handoff/coordenação; não exige PR de correção de código.
- **P2-2 (herdado):** gate da main segue vermelho pelos 4 errors de Biome; precisa de PR próprio do dono dos arquivos.
- **P3-1:** mudança de modo 100644→100755 em backup-encrypted.sh não declarada no escopo.
- **P3-2:** ExternalCrmPanel.tsx:809 — 2 warnings a11y (noStaticElementInteractions, useKeyWithClickEvents), herdados do arquivo original.
- **P3-3:** `--verify-crypto` em backup-encrypted.sh considera sucesso se `$CIPHER_FILE` existir mesmo sem decifrar, e o fallback grava o payload em claro — validação fraca (pré-existente).
- **P3-4:** `gitleaks dir` acusa `.env.test.example:38` (PII_BLIND_INDEX_KEY); `.gitleaksignore` cobre linhas 36/37 do commit 7eaf7d19, a linha deslocou. Fora do PR; tratar em follow-up.
- **P3-5:** evidência de teste do autor (206/208) gerada fora da config canônica; corrigir o procedimento em entregas futuras.

## Comandos
`git diff <orig>^ pr153 -- <arquivo>`, `gitleaks git/dir`, `npm ci --ignore-scripts`, `npx prisma generate`, `npx vite build`, `npm run check:bundle-budget`, `npx vitest run -c vitest.unit.config.ts …`, `npx biome lint`, `gh pr checks 153`, `gh run list --commit 2d62f9fa…`, `gh run view <id> --log-failed`.
