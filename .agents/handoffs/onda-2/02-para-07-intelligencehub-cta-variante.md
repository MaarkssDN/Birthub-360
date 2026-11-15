# Handoff 02 → 07 — CTA do IntelligenceHub: sem alteração líquida após rebase

De: Agente 02 — Produto e UX
Para: Agente 07 — IA e Automações
Onda: 2
Status: resolvido (sem alteração líquida em arquivo do 07)
Prioridade: normal
Bloqueador-ref: PR #338 (branch `agente/02w2-onda2-handoffs`)
Sprint destino: onda-2

## Problema

O PR #338 continha um commit (`6f876a55b`, hoje descartado no rebase) que
alterava `src/features/intelligence/components/IntelligenceHub.tsx` —
arquivo de domínio do Agente 07 — para corrigir o CTA "Acessar Célula
Comercial" invisível no tema light, trocando classes quebradas por
`variant="primary"` do `Button`.

## Situação após rebase sobre `origin/main`

Durante o rebase do PR #338 (2026-11-15), a main já continha correção
equivalente mergeada via commit `0998a7745` (PR #335,
`agente/02-onda2-produto`): remoção das classes
`bg-gradient-to-r bg-brand hover:bg-brand-hover`, mantendo a variante
`default` do `Button`.

Verificação de equivalência:

- Em `src/components/ui/Button.tsx` (linhas 17–20), as variantes
  `default` e `primary` são **idênticas** (mesmo gradiente
  `bg-gradient-to-b from-[#0369a1] to-[#075985]` light /
  `from-[#00b4d8] to-[#0284c7]` dark + `text-on-brand`).
- A versão da main resolve o mesmo problema de contraste com o mesmo
  resultado visual.
- `git diff origin/main -- src/features/intelligence/components/IntelligenceHub.tsx`
  → **vazio**: não há alteração líquida do Agente 02 neste arquivo.

Decisão: a alteração do componente foi **descartada** como duplicada; o
teste de regressão adicionado pelo PR
(`src/features/intelligence/components/__tests__/IntelligenceHub.test.tsx`)
foi **preservado** — ele valida `bg-gradient-to-b`, `text-on-brand` e
ausência de `bg-brand` no CTA, e passa com a versão da main.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/components/IntelligenceHub.tsx` — sem diff
  líquido vs `origin/main`.
- `src/features/intelligence/components/__tests__/IntelligenceHub.test.tsx`
  — teste de regressão mantido (diff líquido: +7/-1 linhas).

## Evidência

- `git diff origin/main -- src/features/intelligence/components/IntelligenceHub.tsx` → vazio.
- Resolução documentada também em
  `.agents/handoffs/00-para-02-cta-hub-ia-light-invisivel.md` (seção
  "Atualização pós-rebase").

## Alteração necessária

Nenhuma. O Agente 07 não precisa agir: o arquivo está idêntico à main e
o comportamento do CTA já está coberto pela correção `0998a7745` + teste
de regressão.

## Teste esperado

`node node_modules/vitest/vitest.mjs run -c vitest.unit.config.ts src/features/intelligence/components/__tests__/IntelligenceHub.test.tsx --no-file-parallelism`
→ todos os testes passando.

## Contexto adicional

- Baselines visuais `intelligence-light-*` seguem pendentes de run
  Playwright pelo QA (Agente 08), conforme handoff original.
- Se o 07 quiser explicitar `variant="primary"` por clareza semântica,
  é alteração trivial e opcional — funcionalmente neutra.
