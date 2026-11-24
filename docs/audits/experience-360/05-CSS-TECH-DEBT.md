# 05 — Dívida CSS e Engenharia Visual
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## 1. Inventário

| Métrica | Valor |
|---|---|
| Arquivos `.css` em `src/` | 16 (1 global `globals.css` 1.990 linhas + `official-identity.css` 520 + 14 de features, maioria landing) |
| `!important` total em `src/**/*.css` | **797** |
| `style={{` em `.tsx` | 216 |
| Classes arbitrárias `[…-]` em `.tsx` | ~3.889 matches |
| Arquivos `.tsx` com hex `#[0-9a-f]` | 112 (~20-25 landing; ~85-90 produto, concentrados em voice-hub/prospecting/predictability/dataviz) |
| Media queries em CSS de features | 51, quase todas landing |
| Breakpoints distintos observados | 599, 640, 720, 760, 768, 900, 1024, 1080, 1100, 1150 px |
| `z-index`/`z-*` | 84 matches, sem escala (z-[80]…z-[1002], 9990/9998/9999, z-[-1]) |

## 2. Achados por categoria

### `!important` (CSS-001 — P0 para landing)
| Arquivo | Ocorrências |
|---|---|
| `features/landing/pages/LandingRegenerationV4.css` | **530** |
| `features/landing/pages/Landing360.css` | 154 |
| `features/landing/pages/LandingAdaptive.css` | 49 |
| `features/landing/pages/LandingCinematic.css` | 17 |
| `features/landing/pages/LandingConversionV5.css` | 13 |
| `features/hub/hub-orbit.css` | 4 |
| `styles/luxury-tokens.css` | 8 (biome-ignore justificado) |
| `styles/globals.css` | 5 (reduced-motion, justificados) |

`LandingRegenerationV4.css` aplica `!important` em massa por seletor — padrão "vencer a cascata". **Atenção:** landing é intocável por decisão; o achado vira dívida registrada + handoff, não correção nesta operação.

### CSS potencialmente morto (CSS-002 — P1)
- `src/index.css` (importa globals + luxury-tokens) **não é importado por `main.tsx`** — main importa `globals.css` + `official-identity.css` diretamente.
- `src/styles/luxury-tokens.css` (331 linhas, `--lux-*`, JetBrains Mono) só alcançável via `index.css` → ~339 linhas provavelmente mortas. **Verificação pendente:** grep `.lux-`/`.immobile-element`/`.motion-gpu` em `.tsx` antes de remover.

### Três mecanismos de tema (CSS-003 — P1)
- Classe `.dark` + `@custom-variant dark` (globals.css:572, 1574)
- Atributo `[data-theme]` + `html.light` (ThemeContext.tsx:35-42, official-identity.css:62-65, 225-226)
- `prefers-color-scheme` em `hub-orbit.css:121-210, 667` — **ignora a escolha do usuário**: SO dark + app light ⇒ hub-orbit escuro (e vice-versa). Inconsistência real.

### Conflito de autoridade de cor de título (CSS-004 — P1)
- globals.css:1882-1990 (não-layered): `html body :is(h1..h6, [class*="title" i], [class*="Title"])` + ~20 utilities proibidas → força `--title-color-default`.
- official-identity.css:158-165: `[data-page-accent]`/`.bh-platform-card` reintroduz `color: var(--ink)` para headings.
- Utilities Tailwind (`text-white` etc.) — terceira via.
- `[class*="title" i]` é substring matching frágil.

### Duplicações e legado (CSS-005/006 — P2)
- `.bh-surface`, `.bh-glass`, `.bh-card`, `.bh-focus` definidos 2× (layer base L1327-1361 radius 12px fixo; não-layered L1629-1652 radius via token) — segunda vence; primeira parcialmente morta.
- `.badge-coolors-*` globals L405-445 vs official-identity L385-444 — valores diferentes (padding, cores).
- `.text-gradient-*` ×3 implementações (`.text-gradient-coolors*`, `.text-gradient-brand`, `.vancouver-gradient-text`/`.gradient-text`).
- Legado Vancouver Plus: `.vancouver-*`, `animate-on-load-*`, `link-block-underline` (~200 linhas).

### Hex literais em CSS de produto (CSS-008 — P2)
- `.neon-btn-cta` globals.css:1167-1182 — hex/rgba fixos.
- `.glow-text`/`balloon-*` globals.css:497-570 — `rgba(0,229,255,…)` = **#00E5FF, cor que não é token** (neon-blue oficial é #00D4FF) — terceira "azul" no sistema.
- Dezenas de literais em LandingRegenerationV4.css (fora de escopo — landing).

### Z-index (CSS-007 — P2)
Sem escala de camadas: `z-[80]`, `z-[900]`×3, `z-[999]`, `z-[9999]`×2, `z-[1000]`×2, `z-[1001]`, `z-[1002]`, `9990/9998/9999` em LandingCinematic.css:958-995; `z-[-1]` em ButtonGroup.tsx:74 e AuroraButton.tsx:35,45; `AssistantsDock.tsx:98-102` tem lógica manual de empilhamento. **Recomendado:** tokens `--z-base/raised/sticky/overlay/modal/toast/tooltip`.

### Breakpoints e media queries (DS-005 — P2)
~10 breakpoints arbitrários concentrados na landing (fora de escopo direto); em produto, `768px` aparece misturado com `760px`. Nenhum token de breakpoint; DL §13 não codificado.

### Animações (DS-008 — P3)
Tokens `--animate-float`, `--animate-pulse-glow`, `--animate-pulse-slow` infinitos (globals.css:948-955) tensionam com DL §8. `motion.ts` tem `repeat: Infinity` variants. Bloco global `prefers-reduced-motion` (globals.css:1582-1598) mitiga, mas os keyframes infinitos merecem auditoria de consumidores.

### CSS-in-JS / inline
Sem styled-components/emotion. `<style>` inline em 2 componentes (HubScreen.tsx:359, UnifiedTimelineWidget.tsx:537) + gerador de HTML de export (executiveExport.ts:203). `style={{` 216 ocorrências — maioria legítima (valores dinâmicos), com exceções de valores fixos (HubTaskWidget.tsx:107 `width:236`, Landing360Impeccable.tsx:766-784 `fontSize` repetido).

## 3. Plano de modernização CSS (proposta — requer aprovação para Onda 1+)

1. **Onda CSS-A (segura, produto apenas):** criar tokens `--z-*` e `--space-*`; migrar `z-[n]` e spacing arbitrário em features não-landing; unificar `hub-orbit.css` para tokens de tema.
2. **Onda CSS-B:** consolidar `.bh-*` duplicadas, `.badge-coolors-*` e gradient-text; depreciar Vancouver/coolors com inventário de consumidores.
3. **Onda CSS-C (depende de decisão):** resolver cadeia de tokens (globals × official-identity × identidade-visual) — documentar precedência ou fundir; atualizar DL.
4. **Nunca tocar landing** nesta operação — registrar dívida e handoff ao dono (03A/03G + decisão humana).
