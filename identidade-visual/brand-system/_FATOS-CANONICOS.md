# FATOS CANÔNICOS — Pacote de evidências para redatores do Brand System
**Gerado em:** 2026-11-19 · **Uso interno da documentação** — não é documento público.
Todo redator DEVE ler este arquivo antes de escrever. Ele consolida evidências verificadas com caminhos. Nada aqui deve ser apresentado como proposta.

---

## 0. Regras de escrita para TODOS os documentos

- Português brasileiro. Tom técnico-objetivo, verificável.
- Toda afirmação factual cita caminho de arquivo (ex.: `src/styles/globals.css`, `identidade-visual/birthhub360/tokens/birthhub360.css:34`).
- Classifique achados: **CONFIRMADO / PARCIALMENTE IMPLEMENTADO / DOCUMENTADO-NÃO-IMPLEMENTADO / HISTÓRICO / CONFLITANTE / PROPOSTO / NÃO VERIFICADO**.
- Se algo é proposta sua, marque **[PROPOSTO]** e justifique.
- Não invente componentes, rotas, tokens ou funcionalidades. Se não achou evidência, escreva NÃO VERIFICADO.
- Documento deve ter: título, propósito, escopo, estado da informação, data de referência (2026-11-19), fontes, definições, normas, exemplos, referências à implementação, decisões pendentes, documentos relacionados.
- Grafia de trabalho: **"Birth Hub 360°"** (decisão de grafia PENDENTE — ver conflitos). Em código/identificadores use os nomes reais (`BirthHub360`, `birthub360`).

## 1. Fontes canônicas (ordem de precedência para IDENTIDADE)

1. `identidade-visual/v2/FONTE-DE-VERDADE.md` — decisões pinadas pelo usuário em 2026-11-13 (paleta, tipografia, posicionamento, limites).
2. `identidade-visual/README.md` — ordem de precedência dos HTMLs: Brandbook > Manual Visual > Manual Produto > Catálogo.
3. `identidade-visual/birthhub360/tokens/birthhub360.{css,json,ts}` + `characters.{css,json,ts}` — tokens machine-readable oficiais.
4. `src/styles/official-identity.css` → importa os tokens acima; adapters de compatibilidade.
5. `src/styles/globals.css` — tokens `:root`/`.dark`/`@theme` Tailwind 4 (runtime real).
6. `src/config/brand.ts` — espelho TS da marca (`BRAND.name`, `BRAND.colors`, `BRAND.logos`).
7. `DESIGN.md` (raiz) — design-schema impeccable, escopo `/app/*` modo Operate; landing/login intocáveis.
8. `docs/BrandConstitution.md` — constituição da marca (essência, paleta, voz, regras de logo).
9. `PRODUCT.md` — propósito do produto.
10. `.agents/BIRTH_HUB_DESIGN_CONSTITUTION.md`, `.agents/TRANSFORMACAO-DESIGN-ENTERPRISE.md`, `.agents/GA_VISUAL_EXPERIENCE_GATE.md` — governança de design.
11. `BIRTHUB360_JORNADAS_OPERACIONAIS.md` — 20 jornadas canônicas (J01–J20).
12. `BIRTHUB360_CATALOGO_FUNCIONALIDADES.csv` — catálogo P01–P11 + M09–M11.
13. `identidade-visual/v2/` — sistema V2 completo (auditoria, brandbook HTML, DS tokens, motion, componentes) — **NÃO HOMOLOGADO**, tratar como proposta avançada.

## 2. Identidade de marca (evidências)

- **Nome oficial de trabalho:** `Birth Hub 360°`. Proibidos: "BirthHub" junto, "Birthub360", "360 Hub", "Birth CRM" (MANUAL-MESTRE §1.1). Grafia PENDENTE vs "Birthub 360°" (v2) e `360º` (brand.ts usa `º`).
- **Posicionamento fixado (FONTE-DE-VERDADE §2):** "Sistema Operacional de Inteligência Comercial, impulsionado por IA e Revenue Intelligence." PRODUCT.md: "Sistema Operacional de Revenue Intelligence". Taglines: "A Central de Comando 360° do seu Ciclo de Receita"; BrandConstitution: essência "dar à inteligência uma forma em que se pode confiar".
- **Personalidade:** "Cibernética de Luxo", "Rigor Métrico"; bots não-humanos; DADOS→INTELIGÊNCIA→DECISÃO→EXECUÇÃO (MANUAL-MESTRE, BrandConstitution).
- **Voz (BrandConstitution §5):** Profissional · Tecnológica · Direta · Empowering. IA comunicada por insight/confiança/raciocínio — nunca "sparkles"/"AI-powered" genérico.
- **Valores (BrandConstitution §1):** Innovation, Data Intelligence, Efficiency, Scalability; ICP = qualquer empresa com área comercial.
- **Arquitetura de marca:** marca-mãe + 11 módulos (P01–P08 pilares + M09–M11 complementares; Hub Central fora da numeração; M10 mobile-only; M11 rota top-level) — registro canônico `src/components/layout/moduleRegistry.ts`. 29 personagens SVG = 9 avatares-pilar + 20 personagens-agente (contagem de "agentes" diverge: 20/24–26 — PENDENTE).

## 3. Paleta oficial Neon (CONFIRMADO em tokens + DESIGN.md + manuais)

Dark canônico (`birthhub360.css:9-117` e `globals.css`):
- Marca: Azul Neon `#00D4FF`, Rosa Neon `#FF2D9B`, Dourado `#FFC107`, Íris IA `#8B7DFF`.
- Superfícies: background `#0D0D0D`, surface `#14141A`, elevated `#1C1C24`, hover `#252532`, code-bg `#09090D`.
- Texto: primary `#F8F9FF`, secondary `#9EADC8`, muted `#A1A1B5`.
- Semânticos: success `#22C55E`, warning `#FFC107`, danger `#EF4444`, info `#3B82F6`.
- Bordas: `rgba(0,212,255,.18/.22/.45)`, pink `.25`, gold `.30`.

Light AA (`birthhub360.css:119-186` + overrides em `official-identity.css:62-107,264-315`):
- background `#F4F7FB` (canônico V2; `#F8FAFC` aparece como legado/DESIGN.md — divergência registrada), surface `#FFFFFF`, elevated `#EDF2F7`, hover `#E2E8F0`.
- ink `#0F172A`, secondary `#64748B`, muted `#475569`.
- Marca adaptada AA: cyan `#0369A1`/`#0284C7` (color-mix), pink `#D91B7C`/`#BE185D`, gold `#D97706`/`#92400E`, iris `#7C3AED`/`#6D28D9`, danger `#DC2626`/`#B91C1C`.
- Foco light: `#0369A1`; dark: `#00D4FF`.

Aliases legados (official-identity.css:6-61): `--bg→--color-background`, `--surface→--color-surface`, `--ink→--color-text-primary`, `--brand→--color-interactive-primary`, etc. Tokens `--bg/--ink/...` marcados `@deprecated` em birthhub360.css:101-116 — **regra: usar `--color-*` canônicos**.

## 4. Gradientes e efeitos de assinatura (CONFIRMADO)

- `--grad-brand`: `linear-gradient(135deg,#00D4FF 0%,#FF2D9B 50%,#FFC107 100%)` — títulos.
- `--grad-cta`: `linear-gradient(135deg,#FF2D9B 0%,#00D4FF 100%)` — CTAs.
- `--grad-vancouver`: `linear-gradient(135deg,#0EA5E9,#3B82F6 50%,#8B5CF6)`.
- `--grad-orbit`: `conic-gradient(from 0deg,#FFC107,#FF2D9B,#00D4FF,#FFC107)` — anel 360°.
- `--grad-cyan-pink`, `--grad-gold` (#FFC107→#FF8F00), `--grad-glow` (radial topo).
- Glows: `0 0 24px rgba(0,212,255,.45)` / `rgba(255,45,155,.45)` / `rgba(255,193,7,.45)`; bordas glow `0 0 20px rgba(...,.35)`.
- Utilitários: `.bh-glass`, `.border-glow-{brand,cyan,pink,gold}`, `.shadow-glow-{blue,pink,gold}`, `.text-gradient-{brand,cta}`, `.bg-orbit-conic`, `.btn-neon-cta`, `.btn-vancouver-outline`, `.badge-coolors-{yellow,orange,pink,purple,blue}` (globals.css + official-identity.css).

## 5. Tipografia (CONFIRMADO)

Trinca exclusiva, 100% self-hosted em `public/fonts/` via `@font-face` em `globals.css:12-198`:
- **Sora** (`--font-display`/`--font-heading`) — títulos H1–H6, heroes, CTAs, números de destaque. Pesos 400–800, tracking `-0.02em`.
- **Inter** (`--font-interface`/`--font-body`) — interface. Obrigatório `font-feature-settings:"cv05","cv11","ss01"`, tracking `-0.012em`.
- **IBM Plex Mono** (`--font-mono`/`--font-data`/`--font-kpi`/`--font-code`) — dados tabulares, KPIs, R$, logs.
- Proibidas: Bodoni Moda, Playfair, Cabin, JetBrains Mono, Montserrat, Plus Jakarta Sans, Outfit, Nunito, Bricolage Grotesque, Roboto/Open Sans/Poppins (MANUAL-MESTRE §3.1, BRANDBOOK cap.04).
- Regra: títulos nunca `#000`/`#FFF` puros — usar `bh-heading`/`data-accent` (cyan|gold|pink|iris|blue|success|danger).

## 6. Geometria

- Raios: control/input `12px` (`--radius-control`), card `16px` (`--radius-card`), modal `20px` (`--radius-modal`), pill `9999px` (`--radius-pill`).
- Espaçamento base 4px (escala até 64px no MANUAL-MESTRE §6).
- Sombras: `--shadow-card: 0 6px 20px rgba(0,0,0,.25)`, `--shadow-elevated: 0 12px 30px rgba(0,0,0,.65)` (dark; light usa rgba(15,23,42,.08)).
- Foco: `outline: 2px solid` + `outline-offset: 3px` (`--color-focus-ring`, `--focus-offset`); `focus-shadow` extra.

## 7. Motion (CONFIRMADO — implementação real)

`src/lib/motion.ts` (573 linhas, Framer Motion 13; 114 arquivos .tsx importam framer-motion/motion):
- Easings: `EASE_PREMIUM [0.22,1,0.36,1]`, `EASE_SPRING_SOFT [0.34,1.56,0.64,1]`, `EASE_OUT_EXPO [0.16,1,0.3,1]`, `EASE_IN_OUT_SMOOTH [0.4,0,0.2,1]`, `EASE_SMOOTH [0.25,0.1,0.25,1]`.
- Durações: instant .1s, fast .15s, base .25s, deliberate .35s, gentle .6s, slow .8s. CSS tokens `--duration-instant/fast/normal/slow` em globals.css (~100–500ms) + `--ease-standard/enter/exit/emphasized`.
- Springs: SNAPPY 420/32, SOFT 260/24, TACTILE 500/28, MOMENTUM 350/25, ORGANIC 280/22.
- ~30 variants exportadas: fadeIn(Up/Down/Scale), slideInRight/Left, staggerContainer/Item, pageTransition, pageTransitionClean (mobile), pillReveal, journeyConnector, nodePulse, scaleIn, badgePop, float3D, shimmer, shimmerBeam, pulseGlow(Infinite), metricReveal, metricsContainer, ctaGlow, scanLineEntry, staggerGridContainer, gridItemEntrance, buttonMotion, cardHoverMotion, scrollRevealFadeUp/Scale, modalBackdrop/DialogMotion, drawerSlideRight/Bottom, tableRowEntrance.
- Hooks: `useTilt`, `useMagnetic`, `useCursorSpotlight`, `useGlobalCursorDepth`, `useIsTouchDevice` — todos desativam em `prefers-reduced-motion` e/ou touch.
- `MotionConfig reducedMotion="user"` em `src/App.tsx`; `@media (prefers-reduced-motion)` global em globals.css e official-identity.css:212-219.
- Divisão Comercial vs Operacional (FONTE §7, v2/04-motion) = **PROPOSTA não homologada**; hoje existe só o nível operacional.
- Keyframes CSS: toast-in, float, pulse-glow, gradient-xy, gradient-flow, shimmer, fade-in-up, pulse-slow, fade-in, border-beam, spin-slow, vancouverFadeUp, balloon-explode (globals.css @theme).

## 8. Componentes (CONFIRMADO)

- `src/components/ui/` — **~95 arquivos .tsx**, design system próprio estilo shadcn (não é shadcn de verdade; só `@radix-ui/react-slot` direto; Dialog/Drawer usam radix via vaul). Primitivos: Button (cva: variants default/primary/electric/lime/brand/secondary/tertiary/success/destructive/outline/ghost/link/cosmic/vancouver; sizes default/sm/lg/pill/pill-sm/icon*; props asChild/loading/soundClick/soundHover/shine/magnetic), Input, Textarea, Select, Card, Badge, Dialog, Drawer, Modal, ConfirmDialog, DropdownMenu, Tooltip, Toggle, Table, VirtualTable, Pagination, Skeleton, Alert, Label, Toaster, BottomSheet, Fab, IconButton, EmptyState, ErrorBoundary, PageHeader, PageTitleCard, KpiCard, StatsGrid, CompareTable/Bar, DealsGrid, CommandPalette, ThemeSwitcher, ClickSpark, Carousel (embla), bento/*, icons/*.
- `src/components/layout/` (23 arq): Sidebar, MainLayout, AppLayout, AppTopbar, ExecutiveHeader, MobileNav(+Drawer), ModuleRail, ModuleNavPanel, AssistantsDock, ProtectedRoute, RequireRole, RequireModuleAccess, RequireProductModule, OnboardingGate, PageTransition, NavLaunchTransition, OfflineBanner, SyncIndicator, ThemeToggle, AppBreadcrumbs, `moduleRegistry.ts`, `moduleThemes.ts`, `settingsPillarNav.ts`, `tabMeta.ts`.
- `src/components/brand/`: BirthHubLogo, AnimatedBirthHubEmblem, BirthHubOrbit360, PillarIcons, title-icons/*. `src/components/icons/`: AnimatedIcon, BrandIcons.
- `src/features/voice-hub/components/design-system/` — **segundo mini DS** (tokens.ts, ThemeContext, CommandPalette, ErrorBoundary, useReducedMotion) — divergência a registrar.
- Classes de superfície/estado: `.bh-platform-card` (+`[data-accent]` gold/pink/iris/success/danger/blue/neutral/brand/cyan), `.bh-landing-card`, `.bh-card`/`.bh-heading`/`.bh-kicker` (+`data-accent`), `.bh-official-control`, `.bh-state-{default,hover,active,focus,selected,disabled,loading,success,warning,error}`, `.bh-skeleton-shimmer`, `.bh-page/.bh-page-stack/.bh-section/.bh-surface-elevated/.bh-metric/.bh-label`, `.bh-display/.bh-headline/.bh-data`, `.bh-orbit-ring`, `.glass-panel(-elevated)`, `.glass-card(-interactive)`, família `.vancouver-*`.
- Catálogo de 30 componentes oficiais em DESIGN.md (seção "Catálogo de Componentes Oficiais").
- Storybook: só 3 `.stories.tsx` (Badge/Button/Card/Input) + `DesignLabPage` (`/design-lab/*`) como catálogo vivo.

## 9. Rotas (CONFIRMADO — react-router-dom v7, BrowserRouter em main.tsx)

Públicas: `/` `/welcome` `/login` → Landing360 (initialScreen intro/login); `/landing-new` → LandingInnovative; `/privacy`, `/terms`; `/privacidade/dsr/verificar|acompanhamento` (LGPD); `/reset-password`; `/book/:slug` (agendamento público); `/select-brand`→`/welcome`; `/hub`→`/app`; `*`→`/welcome`.
Autenticadas fora de /app: `/design-lab/{command-language,components-v2,home-proposals}`, `/social-selling` (RequireModuleAccess), `/setup` (ADMIN), `/app/*` → AppLayout.
`/app/*`: index/home→CentralModulesHome, dashboard→AdaptiveDashboard, workspace→WorkspaceHome, prospect→ProspectingHub, crm→CrmBoard, crm360→CrmOverview, signals-risks(+radar/deal-risks), intelligence(+elite-agent/pending-actions), companies, contacts, activities, cadence, playbooks, jornadas, processos, roteiros, chatbook, roleplay, gamification, qualification_matrix, objections_matrix, topic_training, bitrix, reports, integrations, knowledge, analytics, winloss, war-room, market-intelligence(+hub/accounts/:id/deck), prospect/inteligente, propostas, daily-plan, sdr-diagnostic, calendar, notifications, automations, editor, settings(+pillars/:pillar, 8 legadas→redirects), characters. Com RequireRole: mesa-tratamento, copiloto_ia, commercial_intelligence, forecast, metas, pipeline_ponderado, usage/team/module-access (ADMIN), failover/resilience (ADMIN|GESTOR). Shell fixo: OnboardingTour (lazy, 1ª vez), LiveCopilotHUD (lazy). Todas as rotas /app são React.lazy + Suspense + PageTransition.

## 10. Módulos/features (CONFIRMADO — src/features/, 47+ dirs)

Produto: activities, analytics (WinLoss/Cohort/churn), auth, automations (engine+dry-run+DLQ+N8n), billing, cadence (multicanal+opt-out), calendar(+booking público), chatbook, commercial-intelligence (DailyPlan, forecast/metas/pipeline_ponderado, diagnóstico), companies, contacts, copiloto-ia, crm (CrmBoard/Kanban/LeadDetailDrawer), crm360 (propostas+rotas públicas), dashboard (AdaptiveDashboard/SinglePageDashboard), document-editor (Tiptap), gamification(+WarRoomArena), home (CentralModulesHome "círculos"), intelligence (hub, EliteCommercialAgent, AIPendingActions, TopicTraining, ai-suite/swarm), integrations, knowledge, landing (Landing360 ~3200 linhas + landing/luxury 6 atos + Landing360Impeccable + CSS alternativos), lgpd (DSR público), market-intelligence (LDR/Account360/LeadApprovalDeck), mesa-tratamento, module-access, notifications (SSE), onboarding (SetupWizard/OnboardingTour), playbook (matrizes+living-playbook), predictability, prospecting (+outbound/ sub-app quase standalone com próprio main/css/server), roleplay, sales-orchestration, settings (PillarSettingsHub/dedup/memory/failover), signals-risks, social-selling, team, voice-hub (VoiceHubView+studio ReactFlow+LandingInnovative), workspace, design-lab.
Backend: ~80 arquivos `src/features/*/routes/*.routes.ts`; `server.ts` fino → `src/bootstrap/*`.

## 11. Hardcoded colors / dívida (CONFIRMADO — grep)

- 583 arquivos .tsx em src/; **2039 hex literals em 150 arquivos** (~26%); **1275 classes arbitrárias `[#…]` em 101 arquivos**.
- Piores: Landing360.tsx (125), NewLoginScreen.tsx (39), landing/luxury Act*.tsx (~200), Analytics.tsx (19), PredictiveScoringNbaCard.tsx (18), Button.tsx (vários `bg-[#0369a1]` etc.).
- Mitigação parcial: official-identity.css:264-315 reescreve `text-[#00D4FF|#FF2D9B|#F59E0B|#8B7DFF|#EF4444]` no tema claro (só texto, só esses 5 hex).
- PR #368 `agente/00-paleta-oficial-migracao`: migração hex→var() em ~100 arquivos (+7768/−2238); OPEN com 5 gates vermelhos; decisão 00: NÃO integra; handoff `onda-review-20261119/00-para-03-paleta-pr368-gates-vermelhos.md`.

## 12. CSS morto / identidades concorrentes (CONFIRMADO)

- Mortos (sem import): `src/index.css`, `src/styles/elegance.css` (paleta champagne/sage/pearl "Elegance v3.0"), `src/styles/luxury-tokens.css` (`--lux-*`, JetBrains Mono).
- Divergentes vivos: `landing/` sub-app (Cabin+IBM Plex Mono, zinc/`#d4af37`), `landing-page.html` raiz (navy `#0B132B`/gold `#D4AF37`, Google Fonts CDN).
- `src/features/voice-hub/components/design-system/` — segundo mini DS.
- `src/features/prospecting/outbound/` — sub-app com design próprio escuro/lime.
- Docs obsoletos: `docs/DESIGN_SYSTEM.md`, `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` (navy/gold+Bodoni), `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` (misto: cores neon ok, tipografia errada Plus Jakarta/JetBrains), `docs/strategy/DESIGN-playbook.md` + playbook HTML (gold/navy/Bodoni).
- `.claude/skills/design-system/SKILL.md` parcialmente desatualizada (documenta Antique Gold/Bodoni). `.claude/CLAUDE.md` descreve paleta "Strategic Command Center" gold/iris/navy e afirma que `identidade-visual/birthhub360/` é a identidade ANTERIOR — **desatualizada** (birthhub360/tokens hoje É neon).
- `.agents/skills/birthhub-*` declaram `docs/design/BIRTHHUB-360-DESIGN-LANGUAGE.md` como "autoridade visual máxima" — apontam para doc obsoleto (conflito de governança).
- Resíduos marca antiga: `#FF5618` (laranja) corrigido em meetingInvite/executiveExport mas `public/tools/social-selling/` ainda servido em `/tools`; `public/tools/*` portais atlas; `BirthubLogo.tsx`/`Birthub360Logo.tsx`/`brand (1).ts` na pasta de trabalho usam paleta orbit5 (`#D4AF37→#FF3158→#FF4FA3→#7C3AED→#1677FF→#9C5A7E`, núcleo `#0B132B`) — divergente do Neon.
- SVGs mestres `identidade-visual/birthhub360/logos/*.svg` contêm cores históricas navy/gold "preservadas por determinação do usuário" (README); versões neon animadas existem em `04_ASSETS_VISUAIS/` da pasta de trabalho e `identidade-visual/v2/assets/logos/`.

## 13. Assets (CONFIRMADO)

- Logos canônicos repo: `identidade-visual/birthhub360/logos/{birthhub360-icone,birthhub360-logo-horizontal,birthhub360-simbolo}.svg` + espelho `public/brand/`; favicon `public/brand/birthhub360-icone.svg` referenciado em index.html; PWA icons `public/icons/icon-{192,512,512-maskable}.png`.
- Personagens: 29 SVGs em `identidade-visual/birthhub360/characters/` + `public/brand/characters/` (25 servidos) + `identidade-visual/v2/assets/characters/`; runtime `src/features/characters/` (characterCatalogPillars.ts 9 + characterCatalogAgents.ts 20 + characterRuntime.ts).
- Fontes: `public/fonts/` WOFF2/TTF Sora/Inter/IBM Plex Mono; `public/fonts/brand/` tem Nunito/Outfit/Plus Jakarta Sans legadas não referenciadas.
- Ícones UI: `lucide-react` (393 arquivos .tsx importam).
- Em `DOCUMENTOS/IDENTIDADE-VISUAL/04_ASSETS_VISUAIS/`: SVGs logo neon animados ("Cores-Atuais"), favicon/avatar, variantes dark/light, PNGs de referência, goldens Playwright `visual.spec.ts-snapshots__*` (dashboard/crm/contact-form light/dark win32), `hero-team.jpg`, screenshots landing.
- Duplicatas a evitar: prefixos `brand__`, `logos__`, `symbol.svg/avatar.svg/favicon.svg/logo-horizontal-*` (símbolo "Birthub" divergente — 3 arcos `#4C82F7/#9B6BF3/#D4AF37`, Bricolage Grotesque), `birthhub360-*.svg` raiz sem prefixo = legado navy/gold.

## 14. Acessibilidade (CONFIRMADO)

- WCAG 2.2 AA inegociável (DESIGN.md, BrandConstitution, skills). Contraste texto ≥4.5:1, não-texto ≥3:1; foco visível; targets 44×44px.
- Rampas light AA já implementadas em tokens; overrides de texto arbitrário em official-identity.css.
- Skills: `.agents/skills/{accessibility,birthhub-accessibility,wcag-2.2-aa,wcag-color-contrast,wcag-keyboard-navigation,a11y-violation-gate,axe-a11y,...}`, `.claude/skills/accessibility`.
- Auditorias existentes: `03-audit-a11y-ui-*.md` (pasta de trabalho), `docs/audits/prontidao-producao-20261017/08-relatorio-frontend-ux-acessibilidade-pwa.md`, `.agents/runs/audit-2026-11-18/ux-completude.md` (UX-01..11 → débitos DEBT-0024/0032/0033/0059/0060/0065: sem criação manual de lead, botão morto em Playbooks, erro de API como empty state, score heurístico como "avaliação", settings de pilar não persistem, estágios de funil hardcoded, KPI null→"R$ 0").
- i18n mínimo: `src/i18n/index.tsx` ~60 strings (setup.*, firstSteps.*, common.*) pt-BR/en-US; resto hardcoded pt-BR.

## 15. Responsividade (CONFIRMADO)

- Breakpoint principal `lg`=1024px (`.claude/skills/ui-ux`); viewports de QA: 1440/1366/768/390 (GA gate) + 360/390/768/1024/1440 (prompt 03).
- Mobile real: Capacitor Android (`android/`, `capacitor.config.ts` → Agente 09); M10 mobile-only; `useIsTouchDevice` desativa tilt/magnetic/spotlight; `pageTransitionClean` otimizado p/ mobile; BottomSheet/MobileNav/Drawer existem.
- PWA: vite-plugin-pwa, manifest inline (theme_color `#F4F7FB`, start_url `/app`, shortcuts CRM/Prospecção), Workbox runtimeCaching de fontes.

## 16. Jornadas e UX Writing (CONFIRMADO)

- `BIRTHUB360_JORNADAS_OPERACIONAIS.md` v4.0.0: J01 onboarding (SetupWizard 5 etapas + OnboardingGate + OnboardingTour), J02 RBAC/equipes, J03–04 prospecção→Lead Approval Deck, J05–06 distribuição+cadência multicanal, J07–08 resposta WhatsApp/voz→handoff Closer, J09–11 proposta→aprovação→assinatura→War Room, J12 pós-venda/CS, J13 Win/Loss, J14 Forecast Monte Carlo, J15–16 agentes autônomos (health score, Supervisor anti-conflito), J17 sync Bitrix24 (BitrixGuardian), J18 mobile offline-first, J19 social selling, J20 reestruturação.
- 4 estados obrigatórios por módulo (DESIGN.md cap.5): Loading (Skeleton), Empty (EmptyState+CTA), Error (causa+retry), Stale (timestamp de sync). Componente: `<OperationalStateContainer>`.
- `documentacao-aplicacao/inventario/mapa-de-navegacao.md` — navegação por papel (Closer/Gestor/SDR com ordens de grupos diferentes).
- Tom de voz: ver §2. Microcopy i18n existe só em setup/firstSteps.

## 17. Governança aplicável (CONFIRMADO — AGENTS.md)

- Propriedade: `identidade-visual/**`, `documentacao-aplicacao/**` → Agente 11; `src/styles/**`+`src/components/ui/**` → Agente 03; `src/App.tsx`+Sidebar → Agente 02; `docs/**` → Agente 08; `.agents/prompts/**` → humano; `.agents/runs|reviews|handoffs` → 00/24/cada agente.
- Handoffs: `.agents/handoffs/onda-<n>/<de>-para-<para>-<slug>.md`; status aberto/em-andamento/resolvido.
- Gates: local `npx tsc --noEmit` + `npm run lint` + testes; merge exige parecer APROVADO do Agente 24; verdade operacional: IMPLEMENTADO/TESTADO/VALIDADO/VERIFICADO VISUALMENTE/NÃO EXECUTADO/BLOQUEADO.
- Este trabalho = documentação em `identidade-visual/brand-system/` (Agente 11). NÃO altera código.

## 18. Histórico de decisões de marca (linha do tempo)

- 09/2026: marca laranja `#FF5618` (Montserrat/Space Grotesk) aposentada.
- 09/2026: era navy/gold "Strategic Command Center" (`docs/design/*` v2.0, Bodoni/Playfair) — depois substituída.
- 2026-09-15: constituição de design + reconstrução "central de comando executiva".
- 2026-10-11: **paleta Neon homologada** (`MODERNIZACAO-UI-ONDA-A.md` §8 + handoff `00-para-11-decisao-paleta-oficial.md`, merge `36d097a17`, parecer 24 APROVADO).
- 2026-11-10/12: Brandbook/Manuais oficiais; 29 personagens ratificados; BrandConstitution→tokens neon (`c3eaefd34`); fontes self-hosted (TAREFA-SANEAMENTO-017).
- 2026-11-13/14: missão V2 → `identidade-visual/v2/` completo, NÃO homologado.
- 2026-11-19: PR #368 (migração hex→var) OPEN com gates vermelhos, não integra; presente missão GENESIS.

## 19. Pendências de decisão humana (consolidado — NÃO resolver)

1. Grafia oficial: "Birth Hub 360°" vs "Birthub 360°" vs `360º`/`360°`.
2. Contagem oficial de personagens/agentes (9/20/24–26/29).
3. Mapeamento módulo→accent (`data-module`→`--module-accent`) — proposto em v2.
4. Contraste CTA gradiente em light (~3:1) — ajuste proposto.
5. Destino de CSS morto (`elegance.css`, `luxury-tokens.css`, `index.css`), `landing/`, `landing-page.html`, docs navy/gold (marcar superseded?).
6. Destino do PR #368 e convergência com PR #310.
7. Light canvas `#F4F7FB` vs `#F8FAFC`.
8. `BirthHubLogo.tsx` orbit5 vs Neon; `BirthubLogo.tsx`/`Birthub360Logo.tsx` legados divergentes.
9. Homologação do sistema V2 (`identidade-visual/v2/`).
10. Área de proteção/mínimos do logo: Manual Mestre (30%, 140px/24px) vs BrandConstitution (1/4 raio, 96px/32px).
11. Motion em 2 níveis (Comercial/Operacional) — proposta v2.
12. Verificar `.env` em `DOCUMENTOS/IDENTIDADE-VISUAL/05_TOKENS_E_TEMAS/` (possível segredo) — reportar, não copiar.
