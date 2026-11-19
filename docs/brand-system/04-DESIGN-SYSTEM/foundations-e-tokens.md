# Foundations e Tokens

Estado: CONFIRMADO. Fonte única: `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}`; adaptadores de compatibilidade em `src/styles/official-identity.css`; tokens de motion em `src/styles/globals.css:390-399` e `src/lib/motion.ts`.

## Camadas de token

1. **Primitivas** `--palette-*` (ex.: `--palette-neon-blue #00D4FF`, `--palette-neon-black #0D0D0D`).
2. **Semânticas** `--color-*` (background, surface, surface-elevated, text-*, border-*, brand-*, interactive-*, focus, success/warning/danger/info).
3. **Heading/accent** `--color-heading-{cyan,blue,gold,pink,iris,success,danger}`; `.bh-card/.bh-heading/.bh-kicker[data-accent=…]` aplicam `--bh-accent`.
4. **Aliases legados** `--bg --surface --ink --ink-2 --line --ok --critical --brand --gold --pink` (marcados `@deprecated` no CSS; `official-identity.css` os religa aos semânticos). Novo código: usar semânticos.
5. **Tailwind v4** `@theme` em `globals.css:721` (classes `bg-surface`, `text-ink-2`, `border-line` etc.) — conteúdo integral NÃO VERIFICADO.

Tema: seletor `[data-theme="light"]`, `html.light`, `:root.light` (claro); `html.dark`/`[data-theme=dark]` (escuro; padrão em `:root`).

## Motion tokens CSS

| Token | Valor |
|---|---|
| `--duration-instant/fast/normal/slow/slowest` | 100 / 150 / 250 / 350 / 500 ms |
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` |
| `--ease-enter` | `cubic-bezier(.22,1,.36,1)` |
| `--ease-exit` | `cubic-bezier(.4,0,1,1)` |
| `--ease-emphasized` | `cubic-bezier(.16,1,.3,1)` |

## Exportação/versionamento

Há `.json` e `.ts` paralelos ao `.css`; conformidade com Design Tokens Community Group (`$value/$type`) **não** verificada (PROPOSTO: gerar `.tokens.json` DTCG a partir do `.json`; backlog P2). Desktop `05_TOKENS_E_TEMAS/08_CONTRATOS_MACHINE_READABLE__design-tokens.json` (1,1 KB) não lido.

## Não documentado por falta de evidência lida

Escala tipográfica fluida CONFIRMADA em `globals.css:934+`: `--text-h1: clamp(1.625rem,3.2vw,2.375rem)` (lh 1.15), `--text-h2: clamp(1.35rem,2.5vw,1.85rem)` (1.2), `--text-h3: clamp(1.15rem,2vw,1.5rem)` (1.25), `--text-h4: clamp(1rem,1.2vw+.5rem,1.25rem)` (1.3); h5/h6 e `--text-fluid-*` não lidos. Espaçamento, grid, breakpoints, z-index, opacidade → NÃO VERIFICADO.
