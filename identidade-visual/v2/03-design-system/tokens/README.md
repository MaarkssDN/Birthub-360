# Tokens V2.0 — Como aplicar (orientação, sem implementação)

**Status:** PROPOSTA — PENDENTE DE HOMOLOGAÇÃO. Os arquivos
`birthhub360-v2.json` / `birthhub360-v2.css` **não substituem** os tokens
atuais (`identidade-visual/birthhub360/tokens/`). São a camada V2 para
homologação visual antes de qualquer adoção no produto.

## 1. Reconciliação com os tokens atuais

- **Mesma nomenclatura:** `--color-*` (semânticos), `--palette-*` (marca),
  `--font-*`, `--radius-*`, `--shadow-*`, `--grad-*`, `--glow-*` — idênticas a
  `birthhub360.css`. A migração futura é troca de arquivo + revisão de deltas,
  não reescrita de componentes.
- **Novidades V2:** escala de espaçamento `--space-*` (4px), escala tipográfica
  `--text-*`, layout (`--container-*`, grid 12 col), motion tokens básicos,
  `--color-on-brand`, `--color-input-*`, `--color-overlay`, skeletons, e o
  mecanismo `--module-accent` por `data-module`.
- **Alinhamento de valores:** todos os hex/rgb semânticos dark e light foram
  copiados de `birthhub360.json` (`semantics.dark/light`, `colors.*`) — os
  mesmos valores que `official-identity.css` já injeta como `--color-*`.

## 2. Uso em React / Tailwind (futuro)

```tsx
// CSS: importar uma vez na raiz (substituindo birthhub360.css após homologação)
import "../../identidade-visual/v2/03-design-system/tokens/birthhub360-v2.css";
```

- **Tailwind v4:** `@theme { --color-brand: var(--color-interactive-primary); }`
  mapeando para as custom properties; nunca hardcodar hex em classes.
- **Framer Motion:** consumir `src/lib/motion.ts` existente; os tokens
  `--duration-*`/`--ease-*` do CSS espelham `MOTION_DURATION`/`EASE_*` de lá —
  manter sincronia ao homologar (ver `04-motion/motion-tokens.json`).
- **Tema:** `document.documentElement.dataset.theme = "light" | "dark"`.
  O default `:root` é dark (canônico do command center).
- **Acento por módulo:** envolver a seção do workspace com
  `data-module="p01"…"m11"` e usar `var(--module-accent)` para chips, barras
  ativas de navegação e KPIs de destaque. Nunca pintar superfícies inteiras.

## 3. Regras de uso

1. Paleta de marca (`--palette-*`) é FIXA — não criar tons pastel.
2. Texto sobre neon usa `--color-on-brand` (preto-neon dark / branco light).
3. Nenhum texto abaixo de 4.5:1 (AA) — usar `--color-text-secondary` mínimo
   para texto corrido; `--color-text-muted` só para metadados grandes/decorativos.
4. `prefers-reduced-motion` e `data-motion="reduced"` zeram durações — todo
   componente novo deve degradar para estado final instantâneo.
5. Módulo novo → adicionar entrada em `data-module` + documentar no DS;
   nunca criar paleta paralela.
