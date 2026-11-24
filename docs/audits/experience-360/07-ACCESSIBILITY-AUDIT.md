# 07 — Auditoria de Acessibilidade (WCAG 2.2 AA)
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Método:** análise estática + evidência do inventário visual do Agente 14 (axe em 70 rotas, 2026-11-19). Sem execução de screen reader nesta sessão.

## 1. Infraestrutura existente (ponto forte)

- **Biome a11y** ativo (`biome.json:55-70`): `useKeyWithClickEvents`, `useAltText` (error), `noAutofocus`, `useSemanticElements`, `noStaticElementInteractions`, `noLabelWithoutControl`, `noAriaHiddenOnFocusable`, `useFocusableInteractive`, `useAriaPropsSupportedByRole`, `noNoninteractiveTabindex`, `useMediaCaption`, `useValidAnchor` — todos "warn" exceto alt-text. **Warn não bloqueia CI** → débito acumula silenciosamente.
- **axe-core E2E**: `tests/e2e/accessibility.spec.ts` cobre ~40 telas, falha só em critical/serious; moderate/minor viram attachment.
- **Focus trap**: `Modal.tsx:18-74` correto (Tab trap + Escape + restore); Dialog/Drawer/ConfirmDialog/CommandPalette tratam Escape.
- **Motion**: `MotionConfig reducedMotion="user"` (App.tsx:70, MotionWrapper.tsx:13), `useReducedMotion` em motion.ts, toggle in-app `data-reduced-motion` no voice-hub.
- **`prefers-reduced-motion`** global em globals.css:1582-1598.

## 2. Achados confirmados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| A11Y-001 | P1 | `/app/characters` H1 `var(--warn)` #FFC107 sobre superfície clara ≈1,52:1; página força paleta dark (`white/5`, `text-white`) independente do tema | `CharacterGalleryView.tsx:204-211`; axe do Agente 14; globals.css:273,350-355 |
| A11Y-002 | P1 | `KanbanBoard.tsx:19` — `<div role="button" tabIndex={0}>` **sem onClick/onKeyDown**: focável que não faz nada (WCAG 2.1.1). KanbanCard.tsx:170-188 faz certo | `KanbanBoard.tsx:19` |
| A11Y-003 | P2 | `TableRow` do DS voice-hub sempre `role="button"`+tabIndex mesmo com `onClick` undefined | `voice-hub/components/design-system/index.tsx:797-815` |
| A11Y-004 | P2 | Backlog admitido de labels: accessibility.spec.ts:7-8 cita `label-has-associated-control` em "vários formulários"; 454 inputs vs 447 aria-label/labelledby no total | `tests/e2e/accessibility.spec.ts`; grep |
| A11Y-005 | P2 | axe critical/serious em **19 de 70 rotas** no inventário do 14: labels/select-name em settings de pilares, `button-name` em gamification, `color-contrast` em 7 rotas | `14-inventario-visual-app-20261119.md` |
| A11Y-006 | P3 | `aria-hidden` em container com botões neutralizados via `tabIndex=-1` setado imperativamente (frágil; preferir `inert`) | `KanbanCard.tsx:105-110,327` |
| A11Y-007 | P3 | Badges de score/temperatura usam `title` (tooltip) para info extra — inacessível a toque/teclado | `KanbanCard.tsx:351-386` |
| A11Y-008 | P3 | Tokens `--title-color-pink #d91b7c` (4,14:1) e `--title-color-gold #b45309` (4,36:1) < 4,5:1 para texto normal — passam como texto grande; risco residual em h5/h6 e subtítulos pequenos | globals.css:376-380 (cálculo WCAG) |
| A11Y-009 | P3 | Cobertura de `alt` boa nas 34 `<img>` auditadas; redundância aceitável em ModuleAgentWidget | amostra verificada |
| A11Y-010 | P2 | Três mecanismos de tema (`.dark`, `[data-theme]`, `prefers-color-scheme` em hub-orbit.css) podem produzir estado visual que quebra contraste assumido | hub-orbit.css:121-210 |

## 3. Gaps de verificação (não executado)

- Navegação por teclado fim-a-fim (Tab order real, sem traps) — só amostral.
- Screen reader (NVDA/VoiceOver) — nunca executado.
- Focus trap dos ~15 modais custom restantes (só Modal/Dialog/Drawer/CommandPalette confirmados).
- Touch targets: `KanbanCard` botões ~26px (WCAG 2.2 2.5.8 exige ≥24px — passa raspando; recomendado 44px mobile).
- Reflow a 320px e zoom 200% — não medido.
- Estados disabled/readonly anunciados corretamente — não auditado exaustivamente.

## 4. Recomendações priorizadas

1. **P1 imediato:** corrigir `KanbanBoard.tsx:19` (1 linha — remover role/tabIndex ou adicionar handler).
2. **P1:** resolver `/app/characters` — ou tema dark explícito com superfícies escuras reais, ou migrar H1 para token de título AA.
3. **P2:** `TableRow` role condicional; rodar `biome lint` e exportar inventário real dos warns a11y para backlog priorizado.
4. **P2:** axe sweep por papel não-ADMIN (atualmente só ADMIN foi medido).
5. **Processo:** considerar promover a11y rules do Biome de warn→error para regras novas (ratchet), sem bloquear o backlog existente — mesmo princípio do skill `a11y-violation-gate`.
