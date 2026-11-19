# Especificação — Composição — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Componentes de Composição (Superfícies e Layout de Página)
- **Propósito:** Especificar Card e variantes de superfície (`bh-card`, `bh-platform-card`, `bh-landing-card`), cabeçalhos e containers de página.
- **Escopo:** `src/components/ui/{Card,PageHeader,PageTitleCard}.tsx`, classes `bh-*`/`glass-*`/`vancouver-*` em `globals.css` e `official-identity.css`.
- **Estado da informação:** CONFIRMADO — arquivos e CSS lidos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `src/components/ui/Card.tsx`, `PageHeader.tsx`, `PageTitleCard.tsx`, `src/styles/globals.css`, `src/styles/official-identity.css`, `identidade-visual/birthhub360/tokens/birthhub360.css`.
- **Documentos relacionados:** `../grids-e-layouts.md`, `../foundations.md`, `dados.md`, `acoes.md`.

---

## 1. Card — `ui/Card.tsx`

- Base cva (`cardVariants`, linhas 5-40): `bh-platform-card relative overflow-hidden rounded-2xl sm:rounded-3xl text-ink transition-all duration-200 border border-line bg-surface/95 dark:bg-[#16171B]/95 backdrop-blur-xl` + sombras light/dark + `hover:-translate-y-0.5`.
- **Variants (16):** `default`, `stat`, `outline`, `accent`, `elevated`, `interactive`, `surface`, `panel`, `metric`, `data`, `feature`, `floating`, `bento`, `cosmic`, `glass`, `neon`, `organic` (linhas 12-38).
- **Padding:** `default p-6`, `sm p-4`, `lg p-8`, `none p-0`.
- Props extras (`CardProps`, linhas 51-66): `accentBar?`, `isLoading?`, `borderBeam?` + `borderBeamVariant?='cyan'`/`borderBeamDuration?=12`/`borderBeamSize?=220` (via `BorderBeam.tsx`), `spotlight?`, `soundHover?`, `soundClick?` (via `SoundFX.play('hover'|'click')`, linhas 95-115).
- `isInteractive = Boolean(onClick)` (linha 90).

## 2. Superfícies CSS — três dialetos de card

| Classe | Definição | Origem |
|---|---|---|
| `.bh-card` | **três definições concorrentes**: (a) `birthhub360.css:263-276` — `border:1px solid var(--bh-accent)!important; border-radius:var(--radius-card)!important; background:var(--color-surface)!important; box-shadow:var(--shadow-card)!important` + `[data-accent]` e `:hover` elevated; (b) `globals.css:1342-1351` (layer components) e (c) `globals.css:1640-1646` (v2.0, glassy). **CONFLITANTE** — a versão com `!important` de `birthhub360.css` tende a vencer por ordem de import (official-identity.css importa birthhub360.css por último). | múltiplos |
| `.bh-platform-card` | `official-identity.css:140-175`: `background:var(--color-surface); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow: inset highlight + var(--shadow-card)`; hover → `--shadow-elevated`; `[data-accent]` → `--card-accent` com `inset 0 1px 0 var(--card-accent)`; acentos mapeados: `gold,pink,iris,success,danger,blue,neutral,brand,cyan` (linhas 176-196, 321-327) | official-identity |
| `.bh-landing-card` | `official-identity.css:126-139`: borda `var(--card-accent)` (= `--page-accent` ou `--color-heading-cyan`), títulos herdam `--card-accent` | official-identity |
| `.glass-panel`/`.glass-panel-elevated`/`.glass-card`/`.glass-card-interactive` | glassmorphism blur 12-16px | `globals.css:1268-1333` |
| `.bh-glass` | `color-mix(surface 70-75%) + blur(12-14px)` | `globals.css:1634-1638`; `official-identity.css:334-339` |
| `.vancouver-card`/`.vancouver-glass`/`.vancouver-btn-*`/`.vancouver-badge`/`.vancouver-gradient-text`/`.vancouver-app-container` | sub-sistema "Vancouver Plus" (Modulify) | `globals.css:1667-1860+` |

### Acentos de título/card

- `[data-accent]` em `.bh-card`/`.bh-heading`/`.bh-kicker` → `--bh-accent` ∈ `cyan|blue|gold|pink|iris|success|danger` (`birthhub360.css:252-258`).
- `.bh-heading`/`.bh-kicker` usam `color: var(--bh-accent) !important`; `.bh-card .bh-heading/.bh-kicker` idem (linhas 260-271).
- `[data-page-accent]` no `<main>` injeta `--page-accent` por módulo (`MainLayout.tsx:66-68`); títulos dentro de `[data-page-accent]` ficam `var(--ink)` neutro (`official-identity.css:158-165`) — **regra: acento de página não colore título de card**.
- `PageTitleAccent` do `PageTitleCard`: `brand|iris|success|warning|pink|gold|neutral`.

## 3. Cabeçalhos de página

### PageHeader — `ui/PageHeader.tsx`

Props: `{ title: string; subtitle?; icon?; badge?; actions?; glow? }` — `glow` mantido por compatibilidade, "o card já traz a faixa de destaque" (comentário linhas 11-12). Delega integralmente a `PageTitleCard`.

### PageTitleCard — `ui/PageTitleCard.tsx` (98+ ln)

- Props (`PageTitleCardProps`, linhas 69-87): `{ title: ReactNode; subtitle?: ReactNode; eyebrow?: string; icon?: ReactNode; badge?: ReactNode; actions?: ReactNode; accent?: PageTitleAccent }`.
- `PageTitleAccent` = `'brand'|'iris'|'success'|'warning'|'pink'|'gold'|'neutral'` (linhas 5-6).
- Mapa `ACCENTS` (linhas 8-67): cada acento define `bar` (faixa lateral), `chip`, `title`, `eyebrow`, `card` — **todos os títulos usam `text-ink`** (nunca gradiente/hex direto); a cor aparece só na barra/chip. Pares calibrados AA claro/escuro.
- `eyebrow` = rótulo curto acima do título (ex.: "PIPELINE COMERCIAL").

## 4. Containers de página

| Classe | Papel | Origem |
|---|---|---|
| `.bh-page` | wrapper de página `max-width:92rem`, padding fluido | `globals.css:1403-1408` |
| `.bh-page-stack` | stack vertical com gap fluido | `globals.css:1410-1414` |
| `.bh-section` | seção com border-top separador | `globals.css:1416-1419` |
| `.bh-surface` / `.bh-surface-elevated` | superfícies planas/elevadas | `globals.css:1335-1340,1421-1425,1629-1632` |
| `.bh-metric` / `.bh-data` / `.bh-label` / `.bh-display` / `.bh-headline` | tipografia de dados/títulos | `globals.css:1427-1438,1608-1626` |
| `.bh-orbit-ring` | marcador visual de órbita (animação `spin-slow`, desativada em reduced-motion) | `globals.css:1655-1665` |
| `.bh-pattern-diagonal-60` / `.bh-pattern-grid` | padrões de atmosfera 60° | `globals.css:1548-1571` |

## 5. Utilitários de efeito (referência)

- Texto: `.text-gradient-brand`, `.text-gradient-cta` (`official-identity.css:368-377`), `.text-gradient-coolors(-warm)` (`globals.css:448-470`), `.vancouver-gradient-text`/`.gradient-text` (`globals.css:1673-1685`).
- Glow/borda: `.border-glow-{brand,cyan,pink,gold}`, `.shadow-glow-{blue,pink,gold}`, `.glow-coolors-*`.
- Botões utilitários: `.btn-neon-cta` (grad-cta + pill + glow), `.btn-vancouver-outline`.
- Órbita: `.bg-orbit-conic` (anel cônico 360°, `official-identity.css:380-382`), `.bg-gradient-orbit5` (`globals.css:1446-1455`).
- Badges: `.badge-coolors-*` (duas famílias — ver `dados.md` §6).

## 6. Regras

1. Cards de conteúdo → `Card` (variant adequado) ou `.bh-platform-card`; cards de landing → `.bh-landing-card`; cards editoriais com acento → `.bh-card[data-accent]`.
2. Título de página → `PageHeader`/`PageTitleCard`; nunca `h1` solto com cor hardcoded.
3. Acento de domínio vem do shell (`data-page-accent`); acento local via `data-accent`/`PageTitleAccent`.
4. `data-accent` válido para `.bh-card`: `cyan|blue|gold|pink|iris|success|danger`; para `.bh-platform-card`: `gold|pink|iris|success|danger|blue|neutral|brand|cyan`.
5. Superfície nunca usa `#000`/`#FFF` puro em título (regra da marca — `birthhub360.css:474-486`).
