# Handoff — 34 → 36: dívida de acessibilidade nas landing pages (lint a11y)

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 36 — Léo (Landing Pages e Conversão; dono de `src/features/landing/**`)
- Onda: 3 (ONDA3-34-ACCESSIBILITY, demanda DEM-20261123-001)
- Status: aberto
- Prioridade: médio
- Bloqueador-ref: `.agents/runs/onda-3/34-relatorio.md`
- Sprint destino: a definir pelo 00

## Problema

Varredura `npx biome lint src` (regras `lint/a11y/*`, severidade `warn`) encontrou
**27 diagnósticos de acessibilidade** concentrados nas duas páginas públicas de
landing — a maior concentração do repositório. São débito conhecido de lint,
mas cada item abaixo mapeia para um critério WCAG verificável.

## Arquivo(s) envolvido(s) e evidências

### `src/features/landing/pages/Landing360Impeccable.tsx` (17 ocorrências)

- `useButtonType` ×13 — `<button>` sem `type` explícito (linhas 381, 394, 402,
  563, 603, 606, 609, 653, 656, 919, 922, 951, 992). Botão sem `type` dentro de
  formulário submete o form por padrão — risco funcional + WCAG 4.1.2.
  Correção trivial: `type="button"` (ou `"submit"` onde for o caso).
- `noLabelWithoutControl` ×4 (linhas 427, 437, 451, 553) — `<label>` sem controle
  associado. WCAG 1.3.1 / 3.3.2: label precisa de `htmlFor`+`id` ou controle
  aninhado.

### `src/features/landing/pages/Landing360.tsx` (9 ocorrências)

- `useValidAnchor` ×6 (linhas 1142, 1145, 1148, 1151, 1154, 2015) — `<a>` na nav
  móvel e demais pontos flagados pela regra (verificar se algum usa `href` puro
  de âncora sem destino ou depende só de `onClick`; âncora sem `href` não é
  focável → WCAG 2.1.1). As ocorrências de `#destaques`/`#ia`/... (L1142-1154)
  têm `href` válido — o dono deve confirmar se a regra aponta outro aspecto
  (ex.: `onClick` sem `preventDefault` em SPA) ou se há `<a>` sem `href` real.
- `useSemanticElements` ×2 (linhas 2393, 2420) — `role` que deveria ser elemento
  semântico nativo.
- `useAriaPropsSupportedByRole` ×1 (linha 1756) — `aria-label` em
  `b360-trust-seals` (`<div>` sem role que suporte o atributo). Adicionar
  `role="list"`/`role="group"` ou usar `<ul>`.
- `noLabelWithoutControl` ×1 (linha 1947).

### `src/features/landing/components/B360DataStreamCursor.tsx` (1 ocorrência)

- `noAriaHiddenOnFocusable` (linha 461) — `aria-hidden="true"` em `<canvas>`
  decorativo de partículas. O canvas em si não é focável hoje; o dono deve
  confirmar que nenhum estado/handler futuro o torne focável e, se a regra
  persistir, avaliar `role="presentation"` ou remoção do atributo.

## Alteração necessária

Corrigir cada ocorrência no arquivo dono, sem alterar identidade visual nem
copy de conversão. Prioridade dentro do arquivo: `useValidAnchor` e
`noLabelWithoutControl` (impacto real em teclado/tecnologia assistiva);
`useButtonType` é mecânico.

## Teste esperado

- `npx biome lint src/features/landing` sem diagnósticos `lint/a11y/*`.
- `npx playwright test tests/e2e/accessibility.spec.ts` (landing está coberta
  pelo spec de axe-core) sem novas violações `critical`/`serious`.
- Nav móvel da `Landing360` operável 100% por teclado (Tab + Enter).

## Contexto adicional

- Auditoria de acessibilidade de referência: `docs/audits/experience-360/`
  (doc 07 referenciado na missão não existe neste baseline — o inventário acima
  é a evidência primária desta onda).
- O componente visual é da landing; tokens/estilos compartilhados continuam com
  o Agente 03 — não alterar `src/styles/**` nem `src/components/ui/**` aqui.
