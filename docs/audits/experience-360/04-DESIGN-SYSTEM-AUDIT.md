# 04 — Auditoria do Design System
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Autoridade:** `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` v2.0 (DL)

## 1. Fontes de verdade — estado real

O sistema tem **duas camadas de tokens empilhadas**:

1. `src/styles/globals.css` (`:root` + `.dark`, ~1.990 linhas) — declara tokens neon oficiais.
2. `src/styles/official-identity.css` (520 linhas), importado **depois** em `main.tsx:11-12`, remapeia quase todos os tokens via `identidade-visual/birthhub360/tokens/*.css` e aplica overrides de contraste do tema claro (A11Y-001).

Consequência: o `:root` de globals **não é o valor final em runtime**. Toda auditoria de cor precisa considerar as duas camadas.

## 2. Tokens verificados vs DL v2.0

| Área | DL v2.0 | Implementação | Status |
|---|---|---|---|
| Cor neon base | `--neon-blue #00d4ff`, `--neon-pink #ff2d9b`, `--neon-gold #ffc107`, `--neon-black #0d0d0d` | idênticos (globals.css:211-221) | OK |
| Gradientes | `--grad-titles`, `--grad-cta` | idênticos (globals.css:233-234) | OK |
| Tema claro | DL é dark-first, não prevê claro | superfícies neutras `#f0efe9/#fff/#0b132b` + variantes escuras p/ títulos (A11Y-001) | DECIDIDO (humano) |
| Rosa claro | DL: `#E6007A` | `--light-pink #d91b7c` | **DIVERGE** (globals.css:228 vs DL §2) |
| Tipografia | DL §3 internamente inconsistente: roles dizem Plus Jakarta Sans; escala usa Sora h1-h4 e IBM Plex Mono p/ body | Implementado: **Sora** display/h1-h6, **Inter** corpo, **IBM Plex Mono** dados — self-hosted, `font-display:swap` | **DL precisa revisão** — implementação é coerente e documentada no CSS |
| Escala tipográfica | h1-h4 com clamp() | `--text-h1..h6` idêntico h1-h4; h5/h6 adicionados; token `display` (DL) inexistente | PARCIAL |
| Espaçamento | DL §4: escala space-1..32, "no arbitrary spacing" | **não existe `--space-*`**; defaults Tailwind 4px + `clamp()` ad-hoc | **GAP** |
| Radius | DL §5: card 12px, card-lg 16px, control 10px | card **16px**, card-lg 20px, control **12px**; `.bh-card` definido 2× com radius divergente (12px vs token) | **DIVERGE + duplicação** |
| Sombras | glow só em hover/focus | `--shadow-*` reativos a tema; glows accent existem | OK c/ ressalvas (ver motion) |
| Breakpoints | DL §13: 1440/1280/1026/768/390 + sidebar 240→64→hidden | defaults Tailwind (sm/md/lg); landing usa ~10 breakpoints arbitrários (599–1150px) | **NÃO CODIFICADO** |
| Motion CSS | durations 100/150/250/350/500ms + easings | idênticos (globals.css:390-399) | OK |
| Motion TS | — | `src/lib/motion.ts` (573 linhas) com easings/springs concorrentes (`EASE_SPRING_SOFT`, `SPRING_BOUNCY`, durações gentle/slow sem equivalente CSS) | **DUAS FONTES** |

## 3. Achados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| DS-001 | P1 | Duas camadas de tokens empilhadas sem documento de precedência | `main.tsx:11-12`, `official-identity.css:1-61` |
| DS-002 | P1 | DL §3 diverge da implementação de fontes (Jakarta/Mono-body vs Sora/Inter/Mono-dados) — DL desatualizado ou DS divergente; DL internamente contraditório | DL L67-83 vs globals.css:373-382, 934-945, 1190-1238 |
| DS-003 | P1 | Radius diverge do DL e `.bh-card` tem duas definições com radius diferente | globals.css:913-916, 1342-1351 vs 1640-1646 |
| DS-004 | P2 | Tokens de espaçamento `--space-*` inexistentes; regra DL §4 não enforced | globals.css (ausência confirmada por grep) |
| DS-005 | P2 | Breakpoints do DL não codificados; ~10 breakpoints arbitrários na landing | LandingAdaptive/RegenerationV4/Cinematic CSS |
| DS-006 | P2 | `--light-pink #d91b7c` ≠ DL `#E6007A` | globals.css:228 vs DL §2 |
| DS-007 | P2 | `motion.ts` e tokens CSS de motion são fontes concorrentes; springs/bounce existem em TS mas DL §8 os bane em feedback | motion.ts:10-32, 158-169; globals.css:390-399 |
| DS-008 | P3 | Tokens `--animate-*` infinitos (float, pulse-glow, pulse-slow) tensionam com DL §8; usage real não verificado | globals.css:948-955 |
| DS-009 | P3 | `<style>` inline em `HubScreen.tsx:359`, `UnifiedTimelineWidget.tsx:537` | pontual |
| DS-010 | P2 | Legado "Vancouver Plus" no DS global: `.vancouver-*`, `.badge-coolors-*`, `animate-on-load-*`, `link-block-underline` (~200 linhas de template de terceiro) | globals.css:402-470, 1667-1864 |
| DS-011 | P2 | "Policiamento" de títulos com `[class*="title" i]` + ~20 utilities proibidas, não-layered, conflita com `[data-page-accent]`/`.bh-platform-card` — 3 autoridades sobre cor de título | globals.css:1882-1990; official-identity.css:158-165, 475-486 |
| DS-012 | P2 | Duplicações cross-file com valores divergentes: `.badge-coolors-*` (globals L405-445 vs official-identity L385-444), `.text-gradient-*` ×3 implementações, `.bh-surface/.bh-glass/.bh-card` 2× | ver refs |
| DS-013 | P3 | `official-identity.css` concentra ~20 hex de override de contraste (A11Y-001) fora de tokens — funciona, mas é remendo sistêmico | official-identity.css:71-84, 267-315, 488-520 |

## 4. Primitivos e composição

- `src/components/ui/` (~97 arquivos): shadcn-style sobre Radix slot + Tailwind; inclui `CommandPalette`, `VirtualTable`, `Modal` (focus trap correto), `Dialog`, `Drawer`, `ConfirmDialog`, `PageHeader`, `EmptyState` (em `feedback/`).
- **Inconsistência de primitiva de título**: convivem `PageHeader` (~18 telas), `PageTitleCard` (CadenceHub, SignalsAndRisksHub, ProspectingHub, playbook pages, Billing, Automations, Knowledge), h1 ad-hoc (Integrations, CopilotoIaPanel, GamificationView, CentralModulesHome) e nenhuma (CrmBoard, Ldr). Ver `06-COMPONENT-AUDIT.md`.
- DS paralelo do voice-hub (`features/voice-hub/components/design-system/index.tsx`, 1.098 linhas) — segunda biblioteca de componentes com `TableRow` próprio etc. Risco de divergência; candidato a consolidação ou isolamento formal.
- Design tokens de charts/dataviz com hex literal são justificáveis parcialmente (paletas de gráfico), mas misturam-se a UI chrome.

## 5. Recomendação estrutural (não implementar sem aprovação)

1. **Revisar o DL v2.0** (decisão humana): fontes oficiais, radius, tons light, escala display — hoje o documento está atrás da implementação.
2. **Consolidar autoridade de tokens**: documentar `official-identity.css` como camada final ou fundir em um único `@theme`; eliminar a terceira via de cor de título (policing × page-accent × utilities).
3. **Codificar spacing/breakpoints** do DL como tokens (`--space-*`, breakpoints nomeados) antes de novas telas.
4. **Unificar motion**: uma fonte (recomendado `motion.ts` estendido ou tokens CSS) — hoje duas.
5. **Tratar legado Vancouver/coolors** como camada de deprecação: migrar consumidores e remover.
