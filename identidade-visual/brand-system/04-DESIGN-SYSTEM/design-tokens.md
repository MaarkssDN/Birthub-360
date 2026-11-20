# Design Tokens — Birth Hub 360°

## Cabeçalho padrão

- **Título:** Design Tokens — Tabela Canônica
- **Propósito:** Inventariar os tokens oficiais do Brand System com valores dark/light, origem (arquivo:linha) e status.
- **Escopo:** `identidade-visual/birthhub360/tokens/birthhub360.css` (fonte canônica), overlays em `src/styles/globals.css` e `src/styles/official-identity.css`.
- **Estado da informação:** CONFIRMADO — valores lidos dos arquivos em 2026-11-19.
- **Data de referência:** 2026-11-19
- **Fontes:** `identidade-visual/birthhub360/tokens/birthhub360.css`, `src/styles/globals.css`, `src/styles/official-identity.css`.
- **Documentos relacionados:** `foundations.md`, `temas.md`.

---

## Legenda de status

- **canônico** — fonte oficial (`birthhub360.css`), deve ser usado.
- **alias-deprecated** — mantido para compatibilidade, marcado `@deprecated` em `birthhub360.css:101-116` ou adaptado em `official-identity.css`.
- **runtime** — definido em `globals.css` (`:root`/`.dark`/`@theme`) e/ou sobrescrito por `official-identity.css`; é o que efetivamente renderiza.
- **proposto** — `[PROPOSTO]`.

Formato de referência dos tokens machine-readable: `birthhub360.json` / `birthhub360.ts` (DTCG — **NÃO VERIFICADO** integralmente).

---

## 1. Cores — marca e superfícies (`--color-*`)

Origem: `birthhub360.css` (dark `:root` linhas 73-100; light `:158-185`; dark explícito `:221-248`).

| Token | Dark | Light | Origem | Status |
|---|---|---|---|---|
| `--color-background` | `#0D0D0D` | `#F4F7FB` | `birthhub360.css:73,158,221` | canônico |
| `--color-surface` | `#14141A` | `#FFFFFF` | `:74,159,222` | canônico |
| `--color-surface-elevated` | `#1C1C24` | `#EDF2F7` | `:75,160,223` | canônico |
| `--color-surface-hover` | `#252532` | `#E2E8F0` | `:76,161,224` | canônico |
| `--color-text-primary` | `#F8F9FF` | `#0F172A` | `:77,162,225` | canônico |
| `--color-text-secondary` | `#9EADC8` | `#64748B` | `:78,163,226` | canônico |
| `--color-text-muted` | `#A1A1B5` | `#475569` | `:79,164,227` | canônico |
| `--color-border-subtle` | `rgba(0,212,255,.18)` | `rgba(11,19,43,.12)` | `:80,165,228` | canônico |
| `--color-border-strong` | `rgba(0,212,255,.45)` | `rgba(2,132,199,.5)` | `:81,166,229` | canônico |
| `--color-border` | `rgba(0,212,255,.22)` | `rgba(2,132,199,.25)` | `:92,177,240` | canônico |
| `--color-brand-primary` | `#00D4FF` | `#0369A1` | `:82,167,230` | canônico |
| `--color-brand-secondary` | `#FF2D9B` | `#D91B7C` | `:83,168,231` | canônico |
| `--color-brand-accent` | `#FFC107` | `#D97706` | `:84,169,232` | canônico |
| `--color-interactive-primary` | `#00D4FF` | `#0369A1` | `:85,170,233` | canônico |
| `--color-interactive-hover` | `#00D4FF` | `#075985` | `:86,171,234` | canônico |
| `--color-focus-ring` | `2px solid #00D4FF` | `2px solid #0369A1` | `:87,172` | canônico (shorthand de outline) |
| `--color-focus` | `#00D4FF` | `#0369A1` | `:93,178,241` | canônico |
| `--color-success` | `#22C55E` | `#22C55E` | `:88,173,236` | canônico |
| `--color-warning` | `#FFC107` | `#FFC107` | `:89,174,237` | canônico |
| `--color-danger` | `#EF4444` | `#EF4444` | `:90,175,238` | canônico |
| `--color-info` | `#3B82F6` | `#3B82F6` | `:91,176,239` | canônico |
| `--color-primary` | `#00D4FF` | `#0369A1` | `:94,179,242` | canônico |
| `--color-accent` | `#FFC107` | `#D97706` | `:95,180,243` | canônico |

## 2. Cores — headings por acento

| Token | Dark | Light | Origem | Status |
|---|---|---|---|---|
| `--color-heading-cyan` | `#00D4FF` | `color-mix(#0284C7 85%, #0D0D0D)` → override `#0369A1` | `birthhub360.css:10,122`; `official-identity.css:80` | canônico |
| `--color-heading-blue` | `#3B82F6` | `color-mix(#3B82F6 80%, #0D0D0D)` | `:11,123` | canônico |
| `--color-heading-gold` | `#FFC107` | `#D97706` → override `#92400E` | `:12,124`; `official-identity.css:79` | canônico |
| `--color-heading-pink` | `#FF2D9B` | `#D91B7C` | `:13,125` | canônico |
| `--color-heading-iris` | `#8B7DFF` | `color-mix(#8B7DFF 65%, #0D0D0D)` | `:14,126` | canônico |
| `--color-heading-success` | `#22C55E` | `color-mix(#22C55E 60%, #0D0D0D)` | `:15,127` | canônico |
| `--color-heading-danger` | `#EF4444` | `color-mix(#EF4444 80%, #0D0D0D)` | `:16,128` | canônico |

## 3. Cores — primitivas `--palette-*`

| Token | Dark | Light | Origem | Status |
|---|---|---|---|---|
| `--palette-neon-blue` | `#00D4FF` | — | `:45` | canônico |
| `--palette-neon-pink` | `#FF2D9B` | — | `:46` | canônico |
| `--palette-neon-gold` | `#FFC107` | — | `:47` | canônico |
| `--palette-neon-black` | `#0D0D0D` | — | `:48` | canônico |
| `--palette-neon-card` | `#14141A` | — | `:49` | canônico |
| `--palette-neon-white` | `#F8F9FF` | — | `:50` | canônico |
| `--palette-surface2` | `#1C1C24` | `#EDF2F7` | `:51,135,199` | canônico |
| `--palette-surface3` | `#252530` | `#E2E8F0` | `:52,136,200` | canônico |
| `--palette-surface-hover` | `#252532` | `#E2E8F0` | `:53,137,201` | canônico |
| `--palette-muted` | `#9EADC8` | `#64748B` | `:54,139,204` | canônico |
| `--palette-muted-subtle` | `#A1A1B5` | `#475569` | `:55,140,205` | canônico |
| `--palette-code-bg` | `#09090D` | `#F8FAFC` | `:56,141,206` | canônico |
| `--palette-success/warning/danger/info` | `#22C55E/#FFC107/#EF4444/#3B82F6` | idem | `:57-60,142-145,205-208` | canônico |
| `--palette-iris` | `#8B7DFF` | `#8B7DFF` | `:61,157,209` | canônico |
| `--palette-cyan` | — | `#0284C7` | `:130` | canônico (light) |
| `--palette-pink` | — | `#D91B7C` | `:131` | canônico (light) |
| `--palette-gold` | — | `#D97706` | `:132` | canônico (light) |
| `--palette-bg`/`--palette-surface`/`--palette-ink` | — | `#F4F7FB`/`#FFFFFF`/`#0F172A` | `:133-138` | canônico (light) |
| `--palette-border(-subtle/-strong)` | `.22/.18/.45` rgba cyan | `.25/.12/.5` | `:62-64,146-148,210-212` | canônico |
| `--palette-border-pink`/`--palette-border-gold` | `.25`/`.30` | `.25`/`.35` | `:66-67,150-151,214-215` | canônico |
| `--palette-shadow` | `rgba(0,0,0,.65)` | `rgba(15,23,42,.08)` | `:65,149,213` | canônico |
| `--palette-chili-red` | `#E63946` | `#E63946` | `:68,152,216` | canônico |
| `--palette-vanilla` | `#F1FAEE` | `#F1FAEE` | `:69,153,217` | canônico |
| `--palette-non-photo-blue` | `#A8DADC` | `#A8DADC` | `:70,154,218` | canônico |
| `--palette-cerulean` | `#457B9D` | `#457B9D` | `:71,155,219` | canônico |
| `--palette-berkeley-blue` | `#1D3557` | `#1D3557` | `:72,156,220` | canônico |

## 4. Gradientes, glows e raios

| Token | Valor | Origem | Status |
|---|---|---|---|
| `--grad-brand` | `linear-gradient(135deg,#00D4FF 0%,#FF2D9B 50%,#FFC107 100%)` | `birthhub360.css:34` | canônico |
| `--grad-cta` | `linear-gradient(135deg,#FF2D9B 0%,#00D4FF 100%)` | `:35` | canônico |
| `--grad-vancouver` | `linear-gradient(135deg,#0EA5E9,#3B82F6 50%,#8B5CF6)` | `:36` | canônico |
| `--grad-orbit` | `conic-gradient(from 0deg,#FFC107,#FF2D9B,#00D4FF,#FFC107)` | `:37` | canônico |
| `--grad-cyan-pink` | `linear-gradient(135deg,#00D4FF 0%,#FF2D9B 100%)` | `:38` | canônico |
| `--grad-gold` | `linear-gradient(135deg,#FFC107 0%,#FF8F00 100%)` | `:39` | canônico |
| `--grad-glow` | `radial-gradient(circle at 50% 0%, rgba(0,212,255,.18), transparent 70%)` | `:40` | canônico |
| `--glow-blue`/`--glow-cyan` | `0 0 24px rgba(0,212,255,.45)` | `:41-42` | canônico |
| `--glow-pink` | `0 0 24px rgba(255,45,155,.45)` | `:43` | canônico |
| `--glow-gold` | `0 0 24px rgba(255,193,7,.45)` | `:44` | canônico |
| `--radius-control` | `12px` | `:30` | canônico |
| `--radius-card` | `16px` | `:31` | canônico |
| `--radius-modal` | `20px` | `:32` | canônico |
| `--radius-pill` | `9999px` | `:33` | canônico |

## 5. Tipografia

| Token | Valor | Origem | Status |
|---|---|---|---|
| `--font-display`/`--font-heading` | `'Sora', system-ui, …` | `birthhub360.css:18,21` | canônico |
| `--font-interface`/`--font-body`/`--font-sans` | `'Inter', system-ui, …` | `:19,22,26` | canônico |
| `--font-mono`/`--font-data`/`--font-kpi`/`--font-code` | `'IBM Plex Mono', ui-monospace, monospace` | `:20,23-25` | canônico |
| `--font-features-rounded` | `"cv05","cv11","ss01"` | `:27`; `globals.css:383` | canônico |
| `--tracking-rounded` | `-0.012em` | `:28`; `globals.css:384` | canônico |
| `--tracking-display` | `-0.02em` | `:29` | canônico |
| `--font-brand-sans/display/mono` | aliases → `--font-interface/heading/data` | `official-identity.css:43-45` | alias-deprecated (adapter) |
| `--text-h1`…`--text-h6` + `--text-*--line-height` | escala clamp() responsiva | `globals.css:934-945` | runtime (geram `text-h*`) |

## 6. Sombras, foco e interação

| Token | Dark | Light | Origem | Status |
|---|---|---|---|---|
| `--shadow-card` | `0 6px 20px rgba(0,0,0,.25)` | idem literal; runtime `--shadow-card-value` | `birthhub360.css:96,181`; `globals.css:362,625` | canônico + runtime |
| `--shadow-elevated` | `0 12px 30px rgba(0,0,0,.65)` | `0 12px 30px rgba(15,23,42,.08)` | `:97,182` | canônico |
| `--focus-offset` | `3px` | `3px` | `:99,184,247` | canônico |
| `--focus-shadow` | `0 0 0 3px rgba(0,212,255,.2)` | idem | `:100,185,248` | canônico |
| `--interactive-hover-filter` | `brightness(1.1)` | `brightness(1.1)` | `:98,183,246` | canônico |
| `--shadow-card-hover-value`, `--shadow-nav-value`, `--shadow-nav-active-value`, `--radius-nav-item-value` | ver `globals.css:362-369,625-628` | ver `globals.css:366-369` | runtime | runtime |
| `--shadow-brand-sm`, `--shadow-glow-brand(-strong)`, `--shadow-glow-accent-*`, `--shadow-glow-pulse` | color-mix com marca | idem | `globals.css:306-310,894-906` | runtime |
| `--color-btn-danger(-hover)` | `color-mix(--color-danger 82%/68%, black)` | idem | `globals.css:910-911` | runtime |
| `--color-ok-solid`, `--color-info-solid`, `--color-warning-solid`, `--color-brand-ink`, `--color-brand-active`, `--color-brand-2-active`, `--color-iris-active`, `--color-red-active`, `--color-pink-active`, `--color-red-violet-active`, `--color-critical(-active)`, `--color-ok/warn/info/success/warning/danger-active` | variantes color-mix calibradas AA | idem por tema | `globals.css:762-884`; overrides `official-identity.css:227-233` | runtime |

## 7. Aliases deprecated (`birthhub360.css:101-116`)

| Token deprecated | Aponta para |
|---|---|
| `--surface` | `--color-surface` |
| `--bg` | `--color-background` |
| `--ink` | `--color-text-primary` |
| `--ink-2` | `--color-text-muted` |
| `--surface-2` | `--color-surface-elevated` |
| `--line` | `--color-border-subtle` |
| `--ok` | `--color-success` |
| `--critical` | `--color-danger` |

Em runtime, `official-identity.css:6-61` estende o mapeamento: `--brand→--color-interactive-primary`, `--brand-2→--color-brand-secondary`, `--brand-text→--color-heading-cyan`, `--on-brand→--palette-neon-black`, `--focus-ring→--color-focus`, `--iris→--color-heading-iris`, `--red-violet→--color-heading-iris`, `--orbit-blue→--color-heading-blue`, `--gold→--color-heading-gold`, `--pink→--color-heading-pink`, `--red→--color-heading-danger`, `--warn→--color-warning`, `--info→--palette-info`, `--accent-violet→--color-heading-iris`, `--accent-cyan→--color-heading-cyan`, `--pulse→--color-heading-pink`, `--neon-*`→`--color-heading-*`/`--color-text-*`, `--coolors-*`→`--color-heading-*`.

## 8. Motion tokens (CSS)

Origem: `globals.css:390-399` (`:root`).

| Token | Valor | Status |
|---|---|---|
| `--duration-instant` | `100ms` | runtime |
| `--duration-fast` | `150ms` | runtime |
| `--duration-normal` | `250ms` | runtime |
| `--duration-slow` | `350ms` | runtime |
| `--duration-slowest` | `500ms` | runtime |
| `--ease-standard` | `cubic-bezier(0.4,0,0.2,1)` | runtime |
| `--ease-enter` | `cubic-bezier(0.22,1,0.36,1)` | runtime |
| `--ease-exit` | `cubic-bezier(0.4,0,1,1)` | runtime |
| `--ease-emphasized` | `cubic-bezier(0.16,1,0.3,1)` | runtime |

Camada JS (Framer Motion, `src/lib/motion.ts`): easings `EASE_PREMIUM [0.22,1,0.36,1]`, `EASE_SPRING_SOFT [0.34,1.56,0.64,1]`, `EASE_OUT_EXPO [0.16,1,0.3,1]`, `EASE_IN_OUT_SMOOTH [0.4,0,0.2,1]`, `EASE_SMOOTH [0.25,0.1,0.25,1]`; springs SNAPPY 420/32, SOFT 260/24, TACTILE 500/28, MOMENTUM 350/25, ORGANIC 280/22; ~30 variants exportadas.

Animações nomeadas (`globals.css @theme:947-956`): `--animate-toast-in`, `--animate-float`, `--animate-pulse-glow`, `--animate-gradient-xy`, `--animate-gradient-flow`, `--animate-spin-slow`, `--animate-shimmer`, `--animate-border-beam`, `--animate-pulse-slow`, `--animate-fade-in`.

## 9. Tokens de tema claros divergentes / legado

- `globals.css :root` linhas 236-256 contém fallback light **pré-neon** (`--bg:#f0efe9`, `--ink:#0b132b`, `--surface:#ffffff`…) — sobrescrito em runtime por `official-identity.css:10-18` para os valores `--color-*` canônicos (`#F4F7FB` etc.). **Status: runtime/fallback, não usar diretamente.**
- Comentários em `globals.css` referenciam "Antique Gold"/"Strategic Command Center" (linhas 816-856) — texto histórico; os valores efetivos são neon via adapters. **Dívida documental.**
- `--color-neon-*` em `globals.css @theme:730-737` espelha a paleta neon; `official-identity.css:246-262` remapeia para `--color-heading-*`/`--color-text-*` em runtime.
- `--color-warning` em `globals.css @theme:789` é `#f59e0b` (amber), **divergente** do canônico `--color-warning #FFC107`/`--palette-warning` — o adapter não sobrescreve `--color-warning` diretamente; `--warn→--color-warning`… atenção: `official-identity.css:33` faz `--warn: var(--color-warning)`, e `globals.css` define `--color-warning:#f59e0b` no @theme mas `birthhub360.css` define `--color-warning:#FFC107` em `:root`. **CONFLITANTE** — registrar pendência: duas fontes para warning (`#FFC107` canônico vs `#f59e0b` no @theme). Verificar precedência efetiva em runtime (ordem: globals.css → official-identity.css; `@theme` gera `:root` que pode re-declarar). **NÃO VERIFICADO** qual vence.

## 10. Tokens de página/estado (runtime)

| Token/Classe | Uso | Origem |
|---|---|---|
| `--page-accent` | acento de domínio da rota (`gold/iris/cyan/pink/blue`) | `MainLayout.tsx:32-43,66-68` |
| `[data-page-accent]`, `[data-accent]` | seletores de acento | `official-identity.css:158-196`; `birthhub360.css:252-258` |
| `--card-accent` | acento de card | `official-identity.css:126-196` |
| `--title-color-*`, `--subtitle-color-*` | títulos/subtítulos por tema | `globals.css:376-380,574-578` |
| `--border-input`, `--line-strong` | bordas de controle ≥3:1 (WCAG 1.4.11) | `globals.css:246-251,672-673` |
| `--brand-text` | versão texto-segura de `--brand` | `globals.css:255-256,674-675` |
| `--on-brand` | texto sobre marca sólida (`#041c32`/`#0D0D0D` dark; `#f8fafc` light override) | `globals.css:268`; `official-identity.css:24,64,77-78` |
| `--nav-c-*` | acentos de ícone da navegação (coolors) | `globals.css:287-298,591-614` |
| `--coolors-*` | paleta coolors (agora → `--color-heading-*`) | `official-identity.css:56-60` |
| `--accent-violet/--accent-cyan/--pulse` | acentos de interação | `globals.css:301-303,706-708` |

## 11. Formato DTCG

Os tokens oficiais existem em três formatos: `birthhub360.css` (CSS custom properties), `birthhub360.json` e `birthhub360.ts` (`identidade-visual/birthhub360/tokens/`). O JSON segue o formato W3C Design Tokens Community Group (DTCG) — **NÃO VERIFICADO** leitura integral; a estrutura é referenciada como "machine-readable" nos fatos canônicos.
