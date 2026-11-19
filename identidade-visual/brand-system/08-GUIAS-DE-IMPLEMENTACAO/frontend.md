# Guia de Implementação — Frontend — Birth Hub 360°

**Propósito:** orientar desenvolvedores na aplicação correta da identidade visual em código React/Tailwind, com regras verificáveis e gates.

**Escopo:** `src/` (componentes, estilos, features), exceto landing/login que têm governança própria (`src/features/landing/AGENTS.md` — mudança visível exige autorização humana). Não substitui `DESIGN.md` (design-schema impeccable, escopo `/app/*` modo Operate).

**Estado:** regras derivadas de evidências verificadas em 2026-11-19; dívida de hardcode registrada como está.

**Data:** 2026-11-19 · **Fontes:** `src/styles/globals.css`, `src/styles/official-identity.css`, `identidade-visual/birthhub360/tokens/*`, `src/lib/motion.ts`, `src/components/ui/`, `DESIGN.md`, `docs/BrandConstitution.md`, `_FATOS-CANONICOS.md` §5-§11, `AGENTS.md` §15/§28.

**Documentos relacionados:** `designers.md`, `agentes-de-ia.md`, `checklist-de-qualidade.md`, `contribuicao.md`, `../07-ATIVOS/catalogo-de-assets.md`, `../07-ATIVOS/rastreabilidade.md`.

---

## 1. Regras invioláveis

1. **Tokens, não hex.** Use variáveis `--color-*` canônicas (`--color-background`, `--color-surface`, `--color-text-primary`, `--color-interactive-primary`, `--color-heading-cyan|gold|pink|iris|blue|success|danger`, `--color-focus`, `--color-border*`). Os aliases `--bg/--ink/--surface/--brand/--gold/…` existem apenas por compatibilidade e estão **`@deprecated`** (`identidade-visual/birthhub360/tokens/birthhub360.css:101-116`; adapters em `src/styles/official-identity.css:6-61`).
2. **Nunca escreva hex literal** em componente. Dívida atual medida: **2039 hex em 150 arquivos .tsx** e **1275 classes arbitrárias `[#…]` em 101 arquivos** (`_FATOS-CANONICOS.md` §11). Não aumente esse número; ao tocar um arquivo, prefira migrar os hex adjacentes para `var(--color-*)` **somente se estiver no escopo da missão** (P3 — alterações cirúrgicas).
3. **Paleta Neon apenas.** Dark: `#0D0D0D/#14141A/#1C1C24`, texto `#F8F9FF/#9EADC8/#A1A1B5`, marca `#00D4FF/#FF2D9B/#FFC107/#8B7DFF`. Light: canvas `#F4F7FB` (canônico V2; `#F8FAFC` é legado — pendência §19.7), tintas `#0F172A/#64748B/#475569`, marca adaptada AA (`#0369A1`, `#D91B7C`, `#D97706`, `#7C3AED`, `#DC2626`). Valores completos em `birthhub360.css:9-186` e `globals.css`.
4. **Tipografia:** Sora (display/títulos), Inter (interface — sempre com `font-feature-settings:"cv05","cv11","ss01"` via tokens `--font-features-rounded`), IBM Plex Mono (dados/KPIs/R$/logs). `@font-face` em `globals.css:12-198`; fontes self-hosted em `public/fonts/` — **nunca** adicione Google Fonts/CDN ou nova família sem handoff.
5. **Gradientes e glows de assinatura** já existem como tokens/utilitários: `--grad-brand`, `--grad-cta`, `--grad-vancouver`, `--grad-orbit`, `--glow-*`, `.text-gradient-{brand,cta}`, `.bg-orbit-conic`, `.border-glow-*`, `.shadow-glow-*`, `.btn-neon-cta`, `.btn-vancouver-outline`, `.badge-coolors-*` (`official-identity.css:329-486`, `globals.css @theme`). Reutilize antes de criar.
6. **Superfícies:** use `.bh-platform-card` (com `data-accent` ∈ gold/pink/iris/success/danger/blue/neutral/brand/cyan), `.bh-landing-card`, `.bh-card`/`.bh-heading`/`.bh-kicker` (`data-accent`), `.bh-official-control`, `.bh-state-*`, `.bh-skeleton-shimmer`, `.glass-panel(-elevated)`, `.glass-card(-interactive)`, família `.vancouver-*`. Títulos nunca `#000`/`#FFF` puros — usar `bh-heading`/`data-accent`.
7. **Componentes:** prefira `src/components/ui/` (~95 arquivos, DS próprio estilo shadcn — não é shadcn; primitives via `@radix-ui/react-slot`, Dialog/Drawer via vaul). Variants do `Button` (cva): `default/primary/electric/lime/brand/secondary/tertiary/success/destructive/outline/ghost/link/cosmic/vancouver`; sizes `default/sm/lg/pill/pill-sm/icon*`; props `asChild/loading/soundClick/soundHover/shine/magnetic`. Não recrie botão/card/input na feature se já existe equivalente.
8. **Motion:** use `src/lib/motion.ts` (573 linhas; ~30 variants exportadas — `fadeIn*`, `staggerContainer/Item`, `pageTransition`, `pageTransitionClean` (mobile), `pillReveal`, `metricReveal`, `shimmer*`, `modalBackdrop/DialogMotion`, `drawerSlide*`, etc.; easings `EASE_*`, springs `SNAPPY/SOFT/TACTILE/MOMENTUM/ORGANIC`, hooks `useTilt/useMagnetic/useCursorSpotlight/useGlobalCursorDepth/useIsTouchDevice`). 114 arquivos .tsx já importam framer-motion/motion — siga o padrão existente. `MotionConfig reducedMotion="user"` já está em `src/App.tsx`.
9. **Reduced motion:** todo efeito novo deve respeitar `prefers-reduced-motion` — os hooks de `motion.ts` já desativam em reduced-motion/touch; CSS global tem `@media (prefers-reduced-motion)` em `globals.css` e `official-identity.css:212-219`.
10. **Dois temas sempre:** toda tela deve ser verificada em dark **e** light. Overrides de texto arbitrário no light já existem em `official-identity.css:264-315`, mas cor de fundo/borda nova precisa de variante light própria nos tokens — não dependa do override.
11. **4 estados obrigatórios por módulo** (DESIGN.md cap.5): Loading (Skeleton), Empty (EmptyState + CTA), Error (causa + retry), Stale (timestamp de sync) — componente `<OperationalStateContainer>`.
12. **Geometria:** raios `--radius-control` 12px, `--radius-card` 16px, `--radius-modal` 20px, `--radius-pill` 9999px; espaçamento base 4px; foco `outline: 2px solid var(--color-focus-ring)` + `outline-offset: var(--focus-offset)`; targets ≥44×44px.
13. **Acessibilidade WCAG 2.2 AA inegociável:** contraste texto ≥4.5:1, não-texto ≥3:1, foco visível, cor nunca como único indicador de estado (regra de `src/styles/AGENTS.md`).

## 2. Dívida conhecida — não replicar

- Não usar `style={{ color: '#…' }}` nem classes `bg-[#…]/text-[#…]/border-[#…]`.
- Não usar `--bg/--ink/--surface/--brand` em código novo.
- Não importar fontes remotas; não usar `public/fonts/brand/*` (legado).
- Não usar paleta de `src/index.css`, `elegance.css`, `luxury-tokens.css` (mortos), nem a do mini DS de `src/features/voice-hub/components/design-system/` (divergente — ver `docs/design/TOKEN-AUDIT.md`).
- Não usar logos `BirthubLogo`/`Birthub360Logo`/`BirthHubLogo` (orbit5) — ver `../07-ATIVOS/catalogo-de-assets.md` §1.3.
- PR #368 (migração hex→var) **não integra** no estado atual — não basear trabalho nele (handoff `00-para-03-paleta-pr368-gates-vermelhos.md`).

## 3. Gates antes de concluir

Gate local obrigatório (`AGENTS.md` §28): `npx tsc --noEmit` + `npm run lint` + testes relevantes ao domínio + `npm run build` quando aplicável. Merge exige parecer APROVADO do Agente 24. Evidência de UI exige verificação visual real (Agente 22 quando persistência/PII).

## 4. Propriedade e handoffs

- `src/styles/**` e `src/components/ui/**` → **Agente 03**. Se sua missão exigir token/componente novo ou ajuste de estilo compartilhado, abra handoff `.agents/handoffs/onda-<n>/<de>-para-03-<slug>.md` em vez de editar.
- `src/App.tsx`, Sidebar, navegação → Agente 02. `identidade-visual/**`, `public/brand/**` → Agente 11. `docs/**` → Agente 08.
- `package.json`/lockfile exigem aprovação explícita do 00.
- Formato de handoff: ver `contribuicao.md` §3 e `AGENTS.md` §18.

## 5. Checklist rápido pré-commit

- [ ] Zero hex/`[#…]` novo introduzido
- [ ] Somente tokens `--color-*`/`--font-*`/`--radius-*`/`--duration-*`/`--ease-*`
- [ ] Componente existente reutilizado (ver `src/components/ui/` e catálogo de 30 em `DESIGN.md`)
- [ ] Motion via `src/lib/motion.ts`; reduced-motion respeitado
- [ ] 4 estados cobertos quando for módulo operacional
- [ ] Light + dark verificados; contraste AA
- [ ] i18n: strings novas passam por `src/i18n/index.tsx` quando no escopo de i18n existente (hoje ~60 strings; resto pt-BR hardcoded — não piorar)
