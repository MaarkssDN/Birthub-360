# Foundations — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Foundations do Design System
- **Propósito:** Documentar as fundações visuais: cores, tipografia, espaçamento, dimensionamento, raios, sombras, opacidade, iconografia, estados, camadas e temas.
- **Escopo:** tokens e utilitários compartilhados consumidos por `src/components/**`.
- **Estado da informação:** CONFIRMADO — verificado em código em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `identidade-visual/birthhub360/tokens/birthhub360.css`, `src/styles/globals.css`, `src/styles/official-identity.css`, `src/lib/motion.ts`, `public/fonts/`, `package.json`.
- **Documentos relacionados:** `design-tokens.md`, `temas.md`, `grids-e-layouts.md`, `estados.md`, `componentes.md`.

---

## 1. Cores

### 1.1 Primitivas (`--palette-*`)

Definidas em `identidade-visual/birthhub360/tokens/birthhub360.css:45-72` (dark `:root`) e `:119-157` (light). Espelho Tailwind em `globals.css @theme` (`--color-neon-*`, `--color-light-*`, linhas 730-742).

| Token | Dark | Light |
|---|---|---|
| `--palette-neon-blue` / `--color-neon-blue` | `#00D4FF` | (heading-cyan `#0369A1` via color-mix) |
| `--palette-neon-pink` / `--color-neon-pink` | `#FF2D9B` | `--color-light-pink #D91B7C` |
| `--palette-neon-gold` / `--color-neon-gold` | `#FFC107` | `--color-light-gold #D97706` |
| `--palette-neon-black` | `#0D0D0D` | — |
| `--palette-neon-white` / `--color-white`/`--color-snow` | `#F8F9FF` | idem (texto primário light é `#0F172A`) |
| `--palette-surface2` | `#1C1C24` | `#EDF2F7` |
| `--palette-surface3` | `#252530` | `#E2E8F0` |
| `--palette-surface-hover` | `#252532` | `#E2E8F0` |
| `--palette-muted` | `#9EADC8` | `#64748B` |
| `--palette-muted-subtle` | `#A1A1B5` | `#475569` |
| `--palette-code-bg` | `#09090D` | `#F8FAFC` |
| `--palette-success` | `#22C55E` | `#22C55E` |
| `--palette-warning` | `#FFC107` | `#FFC107` |
| `--palette-danger` | `#EF4444` | `#EF4444` |
| `--palette-info` | `#3B82F6` | `#3B82F6` |
| `--palette-iris` | `#8B7DFF` | `#8B7DFF` |
| Paleta "cool" secundária | `--palette-chili-red #E63946`, `--palette-vanilla #F1FAEE`, `--palette-non-photo-blue #A8DADC`, `--palette-cerulean #457B9D`, `--palette-berkeley-blue #1D3557` | idem (`birthhub360.css:152-156`) |

Bordas por tema: `--palette-border` `rgba(0,212,255,.22)` dark / `rgba(2,132,199,.25)` light; `--palette-border-subtle` `.18` / `rgba(11,19,43,.12)`; `--palette-border-strong` `.45` / `.5`; `--palette-border-pink` `.25`; `--palette-border-gold` `.30`/`.35` (`birthhub360.css:62-67,146-151`).

### 1.2 Semânticas (`--color-*`)

Camada canônica (`birthhub360.css:73-100` dark, `:158-185` light):

| Papel | Dark | Light |
|---|---|---|
| `--color-background` | `#0D0D0D` | `#F4F7FB` |
| `--color-surface` | `#14141A` | `#FFFFFF` |
| `--color-surface-elevated` | `#1C1C24` | `#EDF2F7` |
| `--color-surface-hover` | `#252532` | `#E2E8F0` |
| `--color-text-primary` | `#F8F9FF` | `#0F172A` |
| `--color-text-secondary` | `#9EADC8` | `#64748B` |
| `--color-text-muted` | `#A1A1B5` | `#475569` |
| `--color-brand-primary` | `#00D4FF` | `#0369A1` |
| `--color-brand-secondary` | `#FF2D9B` | `#D91B7C` |
| `--color-brand-accent` | `#FFC107` | `#D97706` |
| `--color-interactive-primary` | `#00D4FF` | `#0369A1` |
| `--color-interactive-hover` | `#00D4FF` | `#075985` |
| `--color-focus-ring` | `2px solid #00D4FF` | `2px solid #0369A1` |
| `--color-focus` | `#00D4FF` | `#0369A1` |
| `--color-success`/`warning`/`danger`/`info` | `#22C55E`/`#FFC107`/`#EF4444`/`#3B82F6` | idem |
| `--color-primary`/`--color-accent` | `#00D4FF`/`#FFC107` | `#0369A1`/`#D97706` |

### 1.3 Títulos por acento (`--color-heading-*`)

`birthhub360.css:10-16` (dark) e `:122-128` (light com `color-mix` AA): `cyan`, `blue` (`#3B82F6`), `gold`, `pink`, `iris`, `success`, `danger`. Light: cyan `color-mix(#0284C7 85%, #0D0D0D)`, pink `#D91B7C`, gold `#D97706`, iris `color-mix(#8B7DFF 65%, #0D0D0D)`, danger `color-mix(#EF4444 80%, #0D0D0D)`. Overrides adicionais em `official-identity.css:79-80` (gold `#92400E`, cyan `#0369A1`).

### 1.4 Aliases legados (deprecated)

`birthhub360.css:101-116` marca `--surface`, `--bg`, `--ink`, `--ink-2`, `--surface-2`, `--line`, `--ok`, `--critical` como `@deprecated` apontando para `--color-*`. Em runtime, `official-identity.css:6-61` mapeia os aliases do runtime (`--bg→--color-background`, `--ink→--color-text-primary`, `--brand→--color-interactive-primary`, `--on-brand→--palette-neon-black`, `--focus-ring→--color-focus`, famílias `--neon-*`, `--coolors-*` → `--color-heading-*`, `--font-brand-*` → `--font-*` canônicas, `--shadow-card-value→--shadow-card`).

**Regra:** código novo usa `--color-*`/`--palette-*`; aliases `--*` existem para compatibilidade de utilitários Tailwind já gerados (`bg-surface`, `text-ink`, `border-line`, `text-brand`…) e são mantidos pelos adapters.

## 2. Tipografia

Trinca exclusiva, 100% self-hosted em `public/fonts/` via `@font-face` em `globals.css:13-198`:

| Papel | Família | Token | Uso |
|---|---|---|---|
| Display/títulos | **Sora** | `--font-display`/`--font-heading`/`--font-brand-display` | H1–H6, heroes, CTAs, números de destaque; pesos 400–800; tracking `-0.02em` (`--tracking-display`) |
| Interface | **Inter** | `--font-interface`/`--font-body`/`--font-sans`/`--font-brand-sans` | Interface; obrigatório `font-feature-settings:"cv05","cv11","ss01"` (`--font-features-rounded`), tracking `-0.012em` (`--tracking-rounded`) — aplicado em `body` por `official-identity.css:122-125` |
| Dados/KPI/código | **IBM Plex Mono** | `--font-mono`/`--font-data`/`--font-kpi`/`--font-code`/`--font-brand-mono` | Dados tabulares, KPIs, R$, logs |

Tokens de fonte em `birthhub360.css:18-29` e `globals.css:373-385`. Proibidas: Bodoni Moda, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto/Open Sans/Poppins (`_FATOS-CANONICOS.md` §5). `public/fonts/brand/` contém Nunito/Outfit/Plus Jakarta Sans legadas **não referenciadas**.

### Escala responsiva H1–H6

Única fonte de verdade em `globals.css @theme` (`globals.css:933-945`), gerando utilitários `text-h1`…`text-h6` com line-height próprio:

| Nível | Tamanho | Line-height |
|---|---|---|
| h1 | `clamp(1.625rem, 3.2vw, 2.375rem)` | 1.15 |
| h2 | `clamp(1.35rem, 2.5vw, 1.85rem)` | 1.2 |
| h3 | `clamp(1.15rem, 2vw, 1.5rem)` | 1.25 |
| h4 | `clamp(1rem, 1.2vw + 0.5rem, 1.25rem)` | 1.3 |
| h5 | `clamp(0.9rem, 0.8vw + 0.5rem, 1.1rem)` | 1.35 |
| h6 | `clamp(0.8rem, 0.5vw + 0.5rem, 0.95rem)` | 1.4 |

Classes semânticas de tipografia (`globals.css:1608-1626`): `.bh-display` (Sora 700, lh 1.1), `.bh-headline` (Sora 600, lh 1.2), `.bh-data` (Inter 500, `tabular-nums`), `.bh-metric` (`font-sans` + `tabular-nums lining-nums`, letter-spacing `-0.025em`, `globals.css:1427-1431`), `.bh-label` (Sora 0.6875rem/650/0.055em tracking, `globals.css:1433-1438`).

**Regra de títulos:** nunca `#000`/`#FFF` puros — usar `bh-heading`/`data-accent` (`cyan|blue|gold|pink|iris|success|danger`, mapeados em `birthhub360.css:252-258` via `--bh-accent`).

## 3. Espaçamento e dimensionamento

- Base 4px; escala documentada até 64px no MANUAL-MESTRE §6 (`_FATOS-CANONICOS.md` §6). Tailwind 4 usa a escala padrão de spacing derivada de `--spacing` (não redefinida em `@theme` — **NÃO VERIFICADO** override custom).
- Ritmo de página: `.bh-page` `max-width: 92rem`, padding `clamp(1rem, 2vw, 2rem)`; `.bh-page-stack` gap `clamp(1rem, 1.5vw, 1.5rem)` (`globals.css:1403-1414`).
- Superfícies: `.bh-section` (border-top + padding-top 1rem), `.bh-surface-elevated` (`globals.css:1416-1425`).

## 4. Raios

| Token | Valor | Uso |
|---|---|---|
| `--radius-control` | `12px` | inputs/controles (`birthhub360.css:30`) |
| `--radius-card` | `16px` | cards (`birthhub360.css:31`) |
| `--radius-card-lg` | `20px`→alias `--radius-card` | `globals.css:914`, `official-identity.css:258` |
| `--radius-modal` | `20px` | modais (`birthhub360.css:32`) |
| `--radius-pill` | `9999px` | pill/badges/CTAs (`birthhub360.css:33`) |
| `--radius-nav-item-value` | `12px`→alias `--radius-control` | nav items (`globals.css:369`, `official-identity.css:48`) |

Componentes usam `rounded-2xl`/`rounded-3xl`/`rounded-full` do Tailwind na prática (ex.: `Button.tsx` variants usam `rounded-2xl`/`rounded-full`; `Card.tsx` usa `rounded-2xl sm:rounded-3xl`), enquanto tokens `--radius-*` alimentam as classes `bh-*` (`.bh-card` usa `var(--radius-card)` em `birthhub360.css:265`). **Divergência de idioma a registrar:** há dois sistemas de raio coexistindo (tokens `--radius-*` vs. utilitários Tailwind literais).

## 5. Sombras e elevação

| Token | Dark | Light |
|---|---|---|
| `--shadow-card` | `0 6px 20px rgba(0,0,0,.25)` | idem literal em tokens; runtime via `--shadow-card-value` (`globals.css:362` claro / `:625` escuro) |
| `--shadow-elevated` | `0 12px 30px rgba(0,0,0,.65)` | `rgba(15,23,42,.08)` (`birthhub360.css:96-97,181-182`) |
| `--shadow-card-hover-value` | `0 1px 3px rgba(0,0,0,.7), 0 20px 46px -20px rgba(0,0,0,.95)` | `0 1px 3px rgba(0,0,0,.06), 0 18px 40px -18px rgba(0,0,0,.28)` (`globals.css:366,626`) |
| `--shadow-nav-value` / `--shadow-nav-active-value` | sombras da navegação (`globals.css:367-368,627-628`) | idem |
| `--shadow-brand-sm`, `--shadow-glow-brand(-strong)` | color-mix com `--brand` (`globals.css:894-896`) | idem |
| `--glow-blue/cyan/pink/gold` | `0 0 24px rgba(...,.45)` (`birthhub360.css:41-44`) | — |

Utilitários: `.shadow-glow-blue/.shadow-glow-pink/.shadow-glow-gold` (`official-identity.css:357-365`), `.border-glow-{brand,cyan,pink,gold}` (`official-identity.css:342-354`), `.glow-coolors-*` (`globals.css:473-487`). Sombras de acento violeta/ciano/pulse: `--shadow-glow-accent-*` (`globals.css:306-310,710-718,904-906`).

## 6. Opacidade

- Estados disabled usam `opacity: 0.45-0.6` + `pointer-events: none`/`cursor: not-allowed` (`.bh-state-disabled` `globals.css:1508-1512`; `disabled:opacity-60` nos inputs).
- Superfícies translúcidas de badge "soft": padrão `bg-{cor}/10`–`/15` + `text-{cor}-active` (ver `KpiCard.tsx:5-52`, `Badge.tsx`).
- `.bh-glass`/`glass-panel(-elevated)`/`glass-card(-interactive)`: `color-mix` de superfície + `backdrop-filter: blur(12-20px)` (`globals.css:1268-1333,1634-1638`; `official-identity.css:334-339`).

## 7. Iconografia

- **UI:** `lucide-react` — 393 arquivos `.tsx` importam (`_FATOS-CANONICOS.md` §13).
- **Marca:** `src/components/brand/` — `BirthHubLogo`, `AnimatedBirthHubEmblem`, `BirthHubOrbit360`, `PillarIcons`, `title-icons/*`, `BrandEmblemBadge`, `CompanyBrandIcon`, `LandingTitleIcons`.
- **Wrapper animado:** `src/components/icons/AnimatedIcon.tsx` + `Isometric3DIcons.tsx` (FlameStreak/Gem3D/ShieldSecurity/Trophy3D), `GithubIcon`, `LinkedinIcon`, `YoutubeIcon`.
- **Personagens:** 29 SVGs em `identidade-visual/birthhub360/characters/` + `public/brand/characters/`; runtime em `src/features/characters/` (`characterCatalogPillars.ts` 9 + `characterCatalogAgents.ts` 20).

## 8. Estados interativos

Classes utilitárias (`globals.css:1484-1533`, `@layer utilities`):

| Classe | Efeito |
|---|---|
| `.bh-state-default` | opacidade 1 |
| `.bh-state-hover:hover` | fundo `color-mix(surface 92%, brand)` |
| `.bh-state-active:active` | `scale(0.98)` |
| `.bh-state-focus:focus-visible` | outline 2px `--focus-ring` |
| `.bh-state-selected` | borda `--brand`, fundo `--soft`, texto `--brand` |
| `.bh-state-disabled` | opacity .45, sem pointer events |
| `.bh-state-loading` | opacity .7, sem pointer events |
| `.bh-state-success` / `-warning` / `-error` | borda+cor semântica |

Componentes adicionam: `active:scale-[0.97]` (Button), `motion-safe:transition-*`, `hover-lift` (`globals.css:1474-1482`), `.bh-interactive` (`globals.css:1363-1380`), `.bh-focus` (`globals.css:1357-1361,1649-1652`). Detalhes por componente em `estados.md` e `especificacoes/`.

## 9. Z-index e camadas

Valores observados em código (não há escala tokenizada — **registrar como dívida**):

- `z-[100]` — Toaster (`Toaster.tsx:45`).
- `z-40` — MobileNavDrawer backdrop/content (`MobileNavDrawer.tsx:27,36`), OfflineBanner (`OfflineBanner.tsx:30`).
- `z-30` — Sidebar desktop (`Sidebar.tsx:63`).
- `z-50` — drawer mobile content.
- FloatingChatbook usa `z-[999]` (comentário em `AssistantsDock.tsx:98`).

**[PROPOSTO]** Formalizar escala de camadas (ex.: `--z-base/nav/overlay/toast`) — hoje é convenção implícita.

## 10. Temas

Dois temas: `light` (default) e `dark`. Aplicação via `data-theme` + classes `html.light`/`.dark` — detalhes em `temas.md`. Tokens reagem a tema porque `official-identity.css` sobrescreve variáveis sob `[data-theme="light"]`, `html.light`, `[data-theme="dark"]`, `html.dark` (`birthhub360.css:119-249`; `official-identity.css:62-107`).

## 11. Motion tokens (CSS)

Em `globals.css :root` (`globals.css:390-399`):

| Token | Valor |
|---|---|
| `--duration-instant` | 100ms |
| `--duration-fast` | 150ms |
| `--duration-normal` | 250ms |
| `--duration-slow` | 350ms |
| `--duration-slowest` | 500ms |
| `--ease-standard` | `cubic-bezier(0.4,0,0.2,1)` |
| `--ease-enter` | `cubic-bezier(0.22,1,0.36,1)` |
| `--ease-exit` | `cubic-bezier(0.4,0,1,1)` |
| `--ease-emphasized` | `cubic-bezier(0.16,1,0.3,1)` |

Animações nomeadas em `@theme` (`globals.css:947-956`): `--animate-toast-in`, `--animate-float`, `--animate-pulse-glow`, `--animate-gradient-xy`, `--animate-gradient-flow`, `--animate-spin-slow`, `--animate-shimmer`, `--animate-border-beam`, `--animate-pulse-slow`, `--animate-fade-in` + keyframes. Camada JS: `src/lib/motion.ts` (Framer Motion; easings `EASE_PREMIUM`, `EASE_SPRING_SOFT`, `EASE_OUT_EXPO`, `EASE_IN_OUT_SMOOTH`, `EASE_SMOOTH`; springs SNAPPY/SOFT/TACTILE/MOMENTUM/ORGANIC; ~30 variants). `MotionConfig reducedMotion="user"` em `src/App.tsx`; `@media (prefers-reduced-motion)` global em `globals.css:1582-1598` e `official-identity.css:212-219`.

## 12. Convenções de nomes

- **Canônico:** `--color-*` (papéis semânticos), `--palette-*` (primitivas), `--font-*`, `--radius-*`, `--shadow-*`, `--grad-*`, `--glow-*`, `--duration-*`, `--ease-*`, `--text-h*`, `--animate-*`.
- **Deprecated (aliases):** `--bg`, `--surface*`, `--ink*`, `--line*`, `--brand*` (exceto `--color-brand-*` canônico), `--ok`, `--warn`, `--critical`, `--gold`, `--pink`, `--red`, `--iris`, `--neon-*` (agora apontam para `--color-heading-*` via adapter), `--coolors-*` (idem), `--font-brand-*` (apontam para `--font-*` canônicas).
- **Classes:** prefixo `bh-` para utilitários próprios; `vancouver-*` para o sub-sistema "Vancouver Plus"; `glass-*`, `badge-coolors-*`, `border-glow-*`, `shadow-glow-*`, `text-gradient-*`.
- **Formato DTCG:** tokens existem em `birthhub360.json`/`birthhub360.ts` (machine-readable, formato W3C DTCG — **NÃO VERIFICADO** leitura integral do JSON; existência confirmada pelo nome e citação nos fatos canônicos).
