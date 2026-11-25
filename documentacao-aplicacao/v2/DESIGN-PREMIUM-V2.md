# Design System Premium V2 — Birth Hub 360°

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Autor:** Agente 39 (Tina) — documento de referência para todos os squads
**Status:** Fases 1–3 implementadas; adoção progressiva via feature flags

---

## 1. Direção estética

Premium, sofisticado, elegante — **sem cara de SaaS de IA genérico**.

Anti-padrões proibidos no v2:
- Gradientes roxos/azuis decorativos, glassmorphism ornamental
- Sombras coloridas/neon em excesso, blobs animados sem propósito
- Métricas inventadas ou placeholders que parecem dados reais
- Cor como único indicador de estado (seta/ícone/texto sempre acompanham)

Princípios:
- **Cor como significado** — navy = estrutura, gold = ação/acento, semânticas = status
- **Tipografia como âncora** — Sora (display), Inter (corpo), IBM Plex Mono (dados/KPIs)
- **Borda sobre sombra** — estrutura explícita, elevação só quando funcional
- **Respiro > decoração** — hierarquia por espaçamento e tipografia

## 2. Tokens (`src/styles/design-v2.css`)

Importado por `globals.css`; utilities geradas via `@theme` do Tailwind v4.

| Grupo | Tokens | Uso |
|---|---|---|
| Navy | `navy-500…900` | Fundamentos, sidebar, superfícies escuras fixas |
| Gold | `gold-100…700` | Acento de ação; `-700` = texto sobre tintes claros |
| Off-white | `offwhite-50…500` | Neutros — **escala inverte no `.dark`** |
| Semânticas | `success/warning/danger/info` `-100/-400/-500/-700` | Pares AA: `bg-{c}-100` + `text-{c}-700` |
| Superfícies | `--v2-bg/fg/card/muted/border-*` | Reativas a tema via `bg-card`, `text-card-foreground`, `text-muted-foreground`, `border-border-default/strong/subtle` |

### Regra crítica — offwhite inverte
`--offwhite-*` troca de direção no `.dark` (50 vira fundo, 500 vira texto).
**Nunca usar offwhite em superfícies de cor fixa** (ex.: landing dark-only) —
use `white`/`slate-*` (fixos) nesses casos.

## 3. Componentes (`src/components/ui/v2/`)

`Button` `Card` `Input` `Badge` `Dialog` — mesmos padrões shadcn, tokens v2.
- Button default = `bg-gold-500 text-navy-900` (par de marca, AA)
- Badge = estilo soft (`-100`/`-700`), `span` (phrasing content)
- Input `variant="error"` → `aria-invalid` automático
- Dialog = Radix (focus trap, Escape)

## 4. Estados (`src/components/states/v2/`)

`EmptyStateV2` `ErrorStateV2` `LoadingStateV2` `StaleDataIndicatorV2` — mesma API do v1 (`components/feedback/`). `useUIState()` normaliza loading/error/empty/stale.

## 5. Motion (`src/lib/motion-v2.ts`)

`useMotionV2()` = flag `design.newMotion` + `!prefers-reduced-motion`.
Variantes: `motionV2Fade/Reveal/Scale/Stagger/Page`. `<Reveal>` é o wrapper padrão.

## 6. Navegação (`src/components/layout/v2/`)

`SidebarV2` — chrome premium sobre ModuleRail/ModuleNavPanel existentes.
Gated por `design.newNavigation` em `MainLayout`.

## 7. Feature flags (`src/config/feature-flags.ts`)

`design.newTokens` `newComponents` `newNavigation` `newUIStates` `newLanding` `newOnboarding` `newDashboards` `newMotion` `newBrandAssets` `v2Enabled`.
Dev: todas ON. Prod: opt-in via localStorage. Rollback = flag off (<5min).

## 8. Dashboards (`src/components/{kpi,charts}/v2/`)

`KpiCardV2` (valor em mono, delta seta+texto, "—" para ausente) e
`chartThemeV2` (paleta validada para navy-800).

## 9. Onboarding (`src/components/onboarding/v2/`)

`OnboardingChecklistV2` (progressbar ARIA, mesma persistência do v1) e
`WizardStepsV2` (aria-current="step").

## 10. Checklist para novos componentes v2

- [ ] Tokens `@theme`/`--v2-*`, zero hex arbitrário
- [ ] `focus-visible:ring-2` em todo interativo
- [ ] `type="button"` default em botões
- [ ] role/aria-live corretos em estados (status vs alert)
- [ ] Movimento só via `useMotionV2()`/`Reveal`
- [ ] `prefers-reduced-motion` respeitado
- [ ] Contraste AA medido, não estimado
- [ ] `npx tsc --noEmit` + `biome lint` verdes
