# Parecer de Revisão Independente — Agente 24

- **Missão:** Revisão do PR #404 (repo MaarkssDN/Birthub-360) — coverage gate por domínio (MEL-46)
- **Autor:** Agente 08 — branch `agente/08-onda6-coverage-gate`
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** `main`
- **Arquivos auditados (4 arquivos):**
  - `.github/workflows/ci.yml`
  - `scripts/ci/coverage-domain-report.mjs` (novo)
  - `scripts/ci/coverage-domains.mjs` (novo)
  - `vitest.unit.config.ts`
- **Método:** leitura do diff completo do PR; verificação de que thresholds não enfraquecem gates existentes e que o relatório é informativo.

## Verificações realizadas

1. **Escopo/propriedade:** `.github/workflows/**` é do Agente 08; `scripts/ci/` e `vitest.unit.config.ts` são infra de teste — domínio QA/14/08. Correto.
2. **`coverage-domains.mjs`:** fonte única de verdade para globs e thresholds por domínio (auth, billing, tenancy, IA). Baselines medidos em 2026-11-15 com margem pequena — pisos realistas, não arbitrários.
3. **`vitest.unit.config.ts`:** thresholds por domínio adicionados via `domainThresholdKey` — o Vitest expande cada chave `{glob1,glob2,...}` como união dos arquivos do domínio. **Gate real** — se a cobertura cair abaixo do piso, `test:unit --coverage` falha.
4. **`ci.yml`:** step "Domain coverage report" é `if: always()` + `continue-on-error: true` — **informativo**, não bloqueia. Correto: o gate real são os thresholds do Vitest.
5. **`coverage-domain-report.mjs`:** lê `coverage-final.json` (istanbul), agrega por domínio usando `istanbul-lib-coverage` — mesmos números do Vitest. Script bem estruturado, com `--files` para debug.

## Achados

1. **[MÉDIA — risco de baseline]** Os thresholds por domínio são um **novo gate bloqueante**. Se a baseline medida estiver incorreta ou a cobertura flutuar, `test:unit --coverage` falhará em PRs alheios. **CI deve estar verde neste PR** — se passar, a baseline está correta; se falhar, os pisos precisam ser recalibrados antes do merge.
2. **[BAIXA]** `coverage-domains.mjs` é `.mjs` importado por `vitest.unit.config.ts` (TypeScript) — funciona porque Vite/Vitest transpila, mas é acoplamento incomum. Aceitável.
3. **[INFO]** O step informativo `continue-on-error` é a abordagem correta — visibilidade sem bloqueio prematuro.

## Veredicto

**APROVADO COM CONDIÇÃO** para a revisão exata do HEAD da branch `agente/08-onda6-coverage-gate`: merge somente se o step `Run Unit Tests` (com `--coverage`) estiver verde no CI deste PR — isso valida que os thresholds por domínio não reprovam a suíte atual. O design é correto: fonte única de domínios, gate real nos thresholds, relatório informativo no CI.

Este parecer não aprova merge/deploy — seguem as autorizações de AGENTS.md §40/§21.
