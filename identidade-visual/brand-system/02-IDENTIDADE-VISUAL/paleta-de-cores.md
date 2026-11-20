# Paleta de Cores — Birth Hub 360°

**Propósito:** especificação completa das cores oficiais, primitivas e semânticas, dark/light.
**Estado:** CONFIRMADO — implementado em `identidade-visual/birthhub360/tokens/birthhub360.css` e `globals.css`.
**Data:** 2026-11-19 · **Fontes:** `birthhub360.css:9-249`, `birthhub360.json`, `globals.css`, `official-identity.css`, `DESIGN.md`, `MANUAL-MESTRE` §2.

---

## 1. Cores de marca (Neon)

| Token | Hex | HSL aprox. | Papel |
|---|---|---|---|
| Azul Neon | `#00D4FF` | 190/100/50 | marca primária, halos, CTAs frios, foco dark |
| Rosa Neon | `#FF2D9B` | 329/100/59 | energia, conversão, gradientes |
| Dourado | `#FFC107` | 45/100/51 | métricas, metas, avisos quentes, elemento 360° |
| Íris IA | `#8B7DFF` | — | IA, copiloto, agentes autônomos |
| Azul Info | `#3B82F6` | — | informativo |

Tokens: `--color-heading-{cyan,blue,gold,pink,iris,success,danger}`, `--palette-neon-{blue,pink,gold,black,card,white}`, `--color-brand-{primary,secondary,accent}`.

## 2. Superfícies e texto — Dark (canônico)

| Token | Hex | Uso |
|---|---|---|
| `--color-background` | `#0D0D0D` | canvas/app |
| `--color-surface` | `#14141A` | cards, modais |
| `--color-surface-elevated` | `#1C1C24` | elementos aninhados, tabelas |
| `--color-surface-hover` | `#252532` | hover de superfície |
| `--palette-surface3` | `#252530` | variação |
| `--palette-code-bg` | `#09090D` | código/blocos |
| `--color-text-primary` | `#F8F9FF` | texto principal |
| `--color-text-secondary` | `#9EADC8` | metadados |
| `--color-text-muted` | `#A1A1B5` | texto fraco |

## 3. Superfícies e texto — Light (AA)

| Token | Hex | Uso |
|---|---|---|
| `--color-background` | `#F4F7FB` | canvas light (canônico V2) |
| `--color-surface` | `#FFFFFF` | cards |
| `--color-surface-elevated` | `#EDF2F7` | aninhados |
| `--color-surface-hover` | `#E2E8F0` | hover |
| `--palette-code-bg` | `#F8FAFC` | código |
| `--color-text-primary` | `#0F172A` | texto |
| `--color-text-secondary` | `#64748B` | secundário |
| `--color-text-muted` | `#475569` | muted |

**Divergência:** `#F4F7FB` (tokens/birthhub360.css + V2) vs `#F8FAFC` (DESIGN.md canvas light) — PENDENTE; adotar `#F4F7FB` até homologação (recomendação da auditoria V2).

## 4. Semânticos

| Papel | Dark | Light/AA |
|---|---|---|
| Success | `#22C55E` | `#22C55E` (color-mix dark) |
| Warning | `#FFC107` | `#D97706` |
| Danger | `#EF4444` | `#DC2626`/`#B91C1C` texto |
| Info | `#3B82F6` | `#2563EB` |
| Focus | `#00D4FF` | `#0369A1` |

Variantes `-active`/`-solid`/`-ink` calibradas por tema em globals.css (`--ok`, `--critical`, `--info`, `--warn` + `-active`).

## 5. Headings por acento (regra dos títulos)

`--color-heading-*` por tema — dark usa neon puro; light usa versões escuras para AA:

- cyan: `#00D4FF` → light `color-mix(#0284C7 85%, #0D0D0D)` / override `#0369A1`
- pink: `#FF2D9B` → `#D91B7C` / `#BE185D`
- gold: `#FFC107` → `#D97706` / `#92400E`
- iris: `#8B7DFF` → `color-mix 65%` / `#6D28D9`
- blue: `#3B82F6` → `color-mix 80%`
- success/danger: color-mix equivalentes

**Regra:** títulos nunca `#000`/`#FFF` puros — sempre `bh-heading`/`data-accent`.

## 6. Bordas e overlays

- `--color-border-subtle`: dark `rgba(0,212,255,.18)`, light `rgba(11,19,43,.12)`
- `--color-border-strong`: dark `rgba(0,212,255,.45)`, light `rgba(2,132,199,.5)`
- `--color-border`: dark `rgba(0,212,255,.22)`, light `rgba(2,132,199,.25)`
- Bordas temáticas: pink `.25`, gold `.30` (dark)
- `--palette-shadow`: dark `rgba(0,0,0,.65)`, light `rgba(15,23,42,.08)`
- `--overlay` (globals.css) para backdrops de modal/drawer.

## 7. Acentos Coolors (extensões oficiais)

`--palette-chili-red #E63946`, `--palette-vanilla #F1FAEE`, `--palette-non-photo-blue #A8DADC`, `--palette-cerulean #457B9D`, `--palette-berkeley-blue #1D3557` — badges `.badge-coolors-*` e categorias de dados.

## 8. Regras de uso

1. **Nunca** hex hardcoded em componente novo — usar `var(--color-*)`.
2. Tokens `--bg/--ink/--surface-2/--line/--ok/--critical` são `@deprecated` — usar equivalentes `--color-*`.
3. Texto colorido usa `--color-heading-*` (nunca `--color-text-*` com cor de marca).
4. Fundo de CTA dark: texto `#0D0D0D` sobre gradiente; light: verificar contraste do par.
5. Light mode nunca usa neon puro em texto — usar rampas `#0369A1`/`#BE185D`/`#92400E`/`#6D28D9`/`#B91C1C` (já implementado via overrides).
6. Cor nunca é único indicador de estado — sempre ícone/label junto (AGENTS.md src/styles).

## 9. Divida conhecida

- **2039 hex literals em 150 arquivos .tsx** e **1275 classes arbitrárias `[#…]` em 101 arquivos** — mitigação parcial via overrides em official-identity.css:264-315 (só texto, 5 hex). Migração formal via PR #368 (em andamento, gates vermelhos).
- Hardcodes residuais em `Button.tsx`, `Landing360.tsx`, `NewLoginScreen.tsx`, `landing/luxury/*`, `prospecting/outbound/*`.

## 10. Exportação de tokens

- Machine-readable: `identidade-visual/birthhub360/tokens/birthhub360.json` (DTCG-style, com `notes.conflicts`), `birthhub360.ts`, `characters.*`.
- V2 (proposta): `identidade-visual/v2/03-design-system/tokens/birthhub360-v2.{json,css}` — nomenclatura `--color-*`/`--radius-*` alinhada ao canônico.
- Contratos em `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/design-tokens.json` (status "OFICIAL").

**Relacionados:** `tipografia.md`, `../04-DESIGN-SYSTEM/foundations.md`, `../04-DESIGN-SYSTEM/design-tokens.md`, `../04-DESIGN-SYSTEM/temas.md`.
