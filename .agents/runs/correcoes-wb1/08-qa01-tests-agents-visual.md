# Relatório de Execução — Frente C (Agente 08)
Data: 2026-11-19
Agente: 08 — QA e Release
Missão: Reconciliação Documental de Testes de Regressão Visual em `tests/AGENTS.md` (Onda F)

## 1. Escopo e Propriedade
- Arquivo sob propriedade:
  - `tests/AGENTS.md` (§6)

## 2. Diagnóstico & Ações Executadas

### Reconciliação de Status de `visual.spec.ts`
- **Problema:** A seção 6 de `tests/AGENTS.md` ("Testes marcados como skip") informava incorretamente que `tests/e2e/visual.spec.ts` estava em `describe.skip` por falta de baseline Linux. Esse status era histórico e obsoleto: a suíte foi reativada no commit `dff5677d8` e as baselines para Linux (`*-chromium-linux.png`) e Windows (`*-chromium-win32.png`) já se encontram versionadas no repositório (`tests/e2e/visual.spec.ts-snapshots/`).
- **Correção:**
  - Atualizada a seção 6 para registrar que `tests/e2e/visual.spec.ts` está **ATIVO**.
  - Documentada a configuração de tolerância (`maxDiffPixels: 1300`), introduzida após medições em runners efêmeros do CI (PRs #407 e #501) para absorver o jitter de rasterização/anti-aliasing sem mascarar regressões de layout genuínas.

## 3. Validação
- Verificação documental: ausência de divergência entre `tests/e2e/visual.spec.ts` (ativo) e as diretrizes do diretório `tests/`.
- Governança: conformidade estrita com o princípio da Verdade Operacional (P4 e AGENTS.md §30).
