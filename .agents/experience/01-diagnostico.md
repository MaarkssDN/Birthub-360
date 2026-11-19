# 01 — Diagnóstico: Governança Atual e Inventário de Experiência

**Data:** 2026-11-18 · **Executor:** Agente 00 (missão master US/UX) · **Base:** `main @ 8b40cdb90` + working tree com WIP não relacionado (auditoria `audit-2026-11-18`, reorganização de handoffs, ajustes docker-compose).

## 1. Arquivos efetivamente consultados

### Governança
- `/AGENTS.md` (íntegra, §§1–41)
- `/CLAUDE.md`, `/docs/orchestration/PROTOCOLO.md`, `PROTOCOLO_QUALIDADE_E_ACEITE.md` (referenciados via CLAUDE.md)
- `/AGENTS.md` locais: `src/components/ui/`, `src/components/layout/`, `src/styles/`, `tests/`, `docs/`
- Prompts: `00-coordenador.md`, `02-produto-ux.md`, `03-design-a11y.md`, `03A`–`03G`, `08-qa-release.md`, `09-mobile.md`, `11-marca-institucional.md`, `14-ambiente-execucao-harness.md`, `24-revisao-independente.md`
- `/AGENTS.md` de features: ~20 arquivos em `src/features/*/AGENTS.md` (cada módulo tem dono de domínio)
- `/AGENTS.md` locais adicionais encontrados por busca

### Coordenação e conhecimento
- `/.agents/README.md`, `/.agents/COMO-CHAMAR-OS-AGENTES.md` (íntegra)
- `/.agents/BIRTH_HUB_DESIGN_CONSTITUTION.md` (constituição visual vigente)
- `/.agents/prompts/` — inventário completo (33 prompts oficiais)
- `/.agents/handoffs/` — dezenas de ondas; handoffs UX/UI relevantes localizados
- `/.agents/runs/audit-2026-11-18/` — auditoria de release readiness executada hoje (14 relatórios de domínio, incl. `ux-completude.md` do Agente 02)
- `/.agents/runs/` — relatórios de ondas, matriz de propriedade, revisões
- `/.agents/reviews/` — pareceres do Agente 24 (incl. `24-revisao-release-readiness-audit-2026-11-18.md`)
- `/.agents/skills/` — 440 entradas; suíte `birthhub-*` dedicada a design/acessibilidade

### Produto e frontend
- `/src/App.tsx` (194 linhas, ~19 rotas declaradas)
- `/src/components/layout/` — `AppLayout`, `Sidebar`, `ModuleRail`, `ModuleNavPanel`, `AppTopbar`, `AppBreadcrumbs`, `MobileNav`, `MobileNavDrawer`, `PageTransition`, `ProtectedRoute`, `RequireRole`, `RequireModuleAccess`, `RequireProductModule`, `OnboardingGate`, `OfflineBanner`, `SyncIndicator`, `ThemeToggle`, `NavLaunchTransition`, `moduleRegistry.ts`, `moduleThemes.ts`, `tabMeta.ts`, `settingsPillarNav.ts`
- `/src/components/ui/` — 96 arquivos (primitives + showcases + stories)
- `/src/components/` — `brand/` (logos, orbit, emblems), `charts/`, `commercial/`, `crm/`, `editor/`, `icons/`, `intelligence/`, `onboarding/`, `pdf/`, `workspace/`
- `/src/styles/` — `globals.css`, `official-identity.css`, `luxury-tokens.css`, `elegance.css`, `AGENTS.md`
- `/src/features/` — ~50 módulos de domínio, cada um com `AGENTS.md` próprio
- `/src/features/landing/` — `Landing360.tsx` (roteada em `/`, `/welcome`, `/login`) e `Landing360Impeccable.tsx` (não roteada — candidata a código morto); `LandingAdaptive/Cinematic/ConversionV5/RegenerationV4.css` são estilos internos de `Landing360.tsx`
- `/src/pages/` — apenas `Ldr.tsx`, `PrivacyPolicy.tsx`, `TermsOfUse.tsx`
- `/src/lib/motion.ts` — utilitário de motion (Framer Motion é o padrão do projeto)
- `/identidade-visual/` — `birthhub360/tokens/*.css` (fonte canônica de tokens), brandbooks, guias de personagens
- `/design-system-guide/`, `/design-system-capture/` (snapshots JSON de telas e tokens), `/visual-regression/`, `/docs/design/` (incl. `TOKEN-AUDIT.md`, `BIRTHHUB-360-DESIGN-SYSTEM.md`, `BIRTHHUB-360-DESIGN-LANGUAGE.md`, `HANDOFF-DESIGN-SYSTEM.md` em `/docs/`)
- `/DESIGN.md`, `/PRODUCT.md`, `/docs/orchestration/*`
- `package.json` — inventário de scripts/gates
- Git: `git status`, `git worktree list`, `git branch -a`, `git log`, `gh pr list`

## 2. Estado real da plataforma (evidência)

- **Veredito de release em curso:** auditoria de 2026-11-18 (`audit-2026-11-18/relatorio-executivo.md`) declara **NO-GO**, com 4 P0, 22 P1 confirmados. O freeze de escopo (§23) está efetivamente ativo para funcionalidades novas.
- **Achados UX reais já catalogados** (`audit-2026-11-18/ux-completude.md`, Agente 02): UX-01 (sem criação manual de lead/oportunidade — DEBT-0024), UX-02 (botão morto em Playbooks), UX-03 (erro de API exibido como empty state), UX-04 (score heurístico local apresentado como avaliação), UX-05 (componentes/auth legados mortos), UX-07 (KPI `null` renderizado como "R$ 0"), UX-08 (3/4 abas de settings de pilar não persistem), UX-09 (perfil read-only), UX-10 (funil "Negócio" com estágios hardcoded de pilotos de cliente), UX-11 (deep link inválido silencioso).
- **PRs abertos relevantes a UX:** #368 (paleta oficial — migração hex neon → `var()`), #412 (retorno pós-login), #398 (permissões mobile/safe-area), #402 (`integracao/onda-5` com gate `verify-file-ownership`). 22+ PRs abertos no total; vários em CONFLICTING.
- **Worktrees ativos:** 20+ worktrees de agentes `agente/*-handoffs-20261117` + worktrees de fix/docs — saneamento de handoffs em andamento.
- **Working tree sujo:** 424 deleções de handoffs antigos + novos artefatos de auditoria + modificações em `docker-compose*.yml` e `infrastructure/observability/alertmanager.yml`. **Não é trabalho meu** — não tocar.

## 3. Inventário do frontend (Fase 1)

### Arquitetura
- React + TypeScript + Vite; roteamento por `src/App.tsx` com lazy routes e guards (`ProtectedRoute`, `RequireRole`, `RequireModuleAccess`, `RequireProductModule`); backend Express em `server.ts` + workers BullMQ dedicados.
- Shell de aplicação em `src/components/layout/` sob propriedade do Agente 02: sidebar modular (`moduleRegistry.ts`, `moduleThemes.ts`), rail de módulos, topbar, breadcrumbs, transições de página, navegação mobile.
- ~50 features de domínio em `src/features/*`, cada uma com `AGENTS.md` próprio definindo dono.

### Design system e tokens — cadeia canônica verificada
1. `identidade-visual/birthhub360/tokens/birthhub360.css` + `characters.css` — **fonte canônica** (propriedade do Agente 11).
2. `src/styles/official-identity.css` — importa os tokens canônicos e define adaptadores de compatibilidade (`--bg`, `--surface`, `--ink`, `--brand`, etc.).
3. `src/styles/globals.css`, `luxury-tokens.css`, `elegance.css` — camada de aplicação.
4. `docs/design/TOKEN-AUDIT.md` documenta dívida de tokens em voice-hub. **Atualização verificada em 2026-11-18 (correção pós-revisão 24):** `src/features/voice-hub/components/tokens.ts` hoje é um *re-export shim* (`export * from './design-system/tokens.js'`) — a duplicação byte-for-byte foi eliminada. A dívida residual é hex hardcoded dentro de `design-system/tokens.ts`, divergente dos tokens oficiais — relacionada a DEBT-0054/ARQ.
5. `DESIGN.md` declara paleta Neon oficial (Preto Neon `#0D0D0D`, Azul `#00D4FF`, Rosa `#FF2D9B`, Dourado `#FFC107`), trinca tipográfica Sora/Inter/IBM Plex Mono, radius ramp 12/16/20/9999px.
6. PR #368 aberto migra hex neon → `var()` — convergência em andamento.

### Identidade visual
- `identidade-visual/` (Agente 11): brandbooks, manuais, tokens, personagens. `BIRTH_HUB_DESIGN_CONSTITUTION.md` é o contrato superior de interface, com ordem de autoridade explícita. A regra de que **Landing Page e Login permanecem intocadas** em reformas visuais está em `COMO-CHAMAR-OS-AGENTES.md` (blocos 03A/03G) e no prompt `03G` — não na constituição.

### Movimento e microinterações
- `src/lib/motion.ts` + Framer Motion como padrão; skill `birthhub-motion-design-engineering` e prompt `03D` já governam isso. Débito conhecido: `framer-motion` + `motion` duplicados (ARQ-08/DEBT-0054).

### Responsividade e mobile
- Breakpoints oficiais documentados: 360/390/768/1024/1440px (prompt 03F). Agente 09 é dono de `android/**` e `capacitor.config.ts`; app mobile aponta para backend sem DNS (DEBT-0004, depende de decisão de escopo).

### Testes visuais e de acessibilidade — estado real (corrigido pós-revisão 24)
- `playwright.config.ts` + `playwright.visual.config.ts` + `tests/e2e/accessibility.spec.ts` existem.
- `tests/e2e/visual.spec.ts` está **ATIVO** (`test.describe` na linha 67) desde o commit `dff5677d8` ("habilita regressão visual com baselines Linux geradas no CI"); baselines `*-chromium-linux.png` e `*-chromium-win32.png` existem em `tests/e2e/visual.spec.ts-snapshots/`. **A informação anterior de "suíte inteira skipped" estava desatualizada** — veio de `tests/AGENTS.md` §6, que está defasado (achado para o Agente 08).
- Dívida real remanescente: 11 snapshots divergentes reportados (DEBT-0041, issue #201) — regeneração/reconciliação de baseline pendente.
- `design-system-capture/` contém snapshots JSON de ~18 telas + tokens; `visual-regression/` e `visual-regression-report/` existem.
- Skills dedicadas: `birthhub-accessibility`, `axe-a11y`, `birthhub-visual-qa`, `birthhub-web-interface-guidelines`, `impeccable`, `ui-ux`, `frontend-design`, `motion-design`, `web-design-guidelines`, `a11y-violation-gate`.

### Landing pages e conversão — inventário corrigido (pós-revisão 24)
- `src/features/landing/pages/` tem 2 páginas `.tsx`: `Landing360.tsx` (canônica, roteada) e `Landing360Impeccable.tsx` (**não importada por `App.tsx` — código morto candidato**). `LandingAdaptive/Cinematic/ConversionV5/RegenerationV4.css` são estilos internos de `Landing360.tsx`, não páginas. `src/App.tsx` roteia `/`, `/welcome`, `/login` → `Landing360`; `/landing-new` → **`LandingInnovative` em `src/features/voice-hub/pages/` — dono: Agente 12**.
- `landing/` na raiz e `landing-page.html` na raiz — material paralelo de status não verificado.
- Não existe `AGENTS.md` em `src/features/landing/` → **lacuna de propriedade** (ver §5). Canonização precisa de handoff cruzado com o Agente 12.

## 4. Análise de sobreposição (Fase 2)

### O que já existe — evidência

| Especialização proposta pela missão | Equivalente existente | Status |
|---|---|---|
| 03-UI (UI & Visual Design) | 03B (arquiteto UI/UX, layouts/bento/4 estados) + direção do 03A | Existe |
| 03-DS (Design System) | 03C (engenheiro DS, tokens, radius ramp, tipografia) | Existe |
| 03-FE (Front-end Presentation) | 03B/03C na camada compartilhada + donos de `src/features/*` na camada de feature | Existe (distribuído) |
| 03-A11Y | 03E (auditor WCAG 2.2 AA) + `tests/e2e/accessibility.spec.ts` (08) | Existe |
| 03-MOTION | 03D (engenheiro motion, `src/lib/motion.ts`, reduced-motion) | Existe |
| (extra) Orquestração do enxame visual | 03A diretor + pipeline de 7 etapas | Existe |
| (extra) QA visual/renderizado | 03F inspetor (5 breakpoints, dark/light) | Existe |
| (extra) Anti-slop/refinamento | 03G guardião Impeccable | Existe |
| 02-UXR (UX Research & Usability) | **Nada** — 02 é dono de navegação/UX mas sem perfil de auditoria de usabilidade | Lacuna |
| 02-CJ (Customer Journey) | Parcial: 02 mapeia módulos, mas sem protocolo de jornada ponta-a-ponta | Lacuna |
| 02-IA (Information Architecture) | Parcial: 02 é dono de navegação, mas sem perfil de auditoria de arquitetura de informação | Lacuna |
| 02-CRO (Landing & Conversão) | **Nada** — e landing carece de dono explícito | Lacuna + lacuna de propriedade |

### Decisão: Estratégia C confirmada

**Confirmada com evidências.** A criação de novos agentes oficiais (Estratégia B) seria redundante: o slot 03 já opera um enxame interno homologado (03A–03G, commit `ae3ff8418`, documentado em `COMO-CHAMAR-OS-AGENTES.md` §"Enxame de Transformação de Design"). A Estrategia A pura (só ampliar 02/03) subaproveita a especialização já provada no 03 e não resolve a lacuna real do 02.

A melhor arquitetura é a **híbrida**:

1. **Agente 03** — enxame 03A–03G existente, mantido como está. Nenhum agente novo no domínio visual.
2. **Agente 02** — recebe **perfis de missão especializados** (02-UXR, 02-CJ, 02-IA, 02-CRO), no mesmo padrão de `06A`/`01A`: especialista interno do slot, sem consumir slot adicional de concorrência, sem alterar o prompt base `02-produto-ux.md`.
3. **Prompts dos perfis** ficam como proposta em `.agents/experience/propostas/` até decisão humana (prompts são protegidos por §5/§40).
4. **Sem novos números oficiais** — 19 e 20 permanecem reservados; nenhum agente existente é renumerado.

## 5. Problemas de governança identificados

1. **Lacuna de propriedade em landing pages** — `src/features/landing/**` não tem `AGENTS.md` local nem dono declarado. Risco real: landing "intocável" por regra de reforma interna, mas ninguém é dono de corrigi-la. Proposta de dono: Agente 02 (perfil 02-D para conversão; camada visual compartilhada continua 03 mediante handoff). **Exceção:** `/landing-new` → `LandingInnovative` vive em `src/features/voice-hub/` e pertence ao Agente 12.
2. **Divergência de tokens documentada** — `TOKEN-AUDIT.md` apontava duplicação byte-for-byte em voice-hub; verificado em 2026-11-18 que `tokens.ts` virou shim de re-export — a dívida residual é hex hardcoded em `design-system/tokens.ts`. `identidade-visual/` ainda documenta paleta Neon anterior em partes (DEBT-0039). Regra já existente: `official-identity.css` proíbe redefinir paleta canônica — reforçar na matriz.
3. **Superfícies de landing não canonizadas** — `Landing360` é a única página roteada em `src/features/landing/`; `Landing360Impeccable.tsx` é candidata a código morto; `/landing-new` usa `LandingInnovative` do Agente 12; `landing/` e `landing-page.html` na raiz têm status não verificado.
4. **Regressão visual com baseline divergente** — `visual.spec.ts` está ativo, mas 11 snapshots divergem (DEBT-0041, issue #201) e `tests/AGENTS.md` §6 está desatualizado (diz que a suíte está skipped). Qualquer onda de UI deve tratar regressão visual como **verificável, porém com baseline a reconciliar**.
5. **Sobreposição 02×03 em features** — `src/features/*/AGENTS.md` dá dono de domínio a cada módulo; ajustes visuais em features exigem coordenação (já previsto no prompt 03: "ajustes estritamente visuais mediante coordenação com o dono"). A matriz abaixo torna isso explícito.
6. **Working tree com reorganização de handoffs em andamento** — 424 deleções staged/unstaged de `.agents/handoffs/**`. Criar novos handoffs agora é seguro (arquivos novos), mas merges de documentação devem evitar tocar nos paths deletados até a reorganização convergir.
7. **`server.ts`, `package.json`, lockfile** — exigem aprovação do 00; nenhuma especialização de UX pode tocá-los.

## 6. Oportunidades reais de expansão

- Formalizar os 4 perfis do Agente 02 com escopo, propriedade e critérios — maior ganho de capacidade com menor risco.
- Criar protocolo de auditoria UX/UI reutilizável (Fase 6) que alimente o inventário `DEBT-*` existente sem duplicar IDs.
- Ligar a suíte de skills `birthhub-*`/`impeccable` aos perfis por referência explícita (skills já existem; falta o mapa perfil→skill).
- Estabelecer gate visual honesto: `visual.spec.ts` está ativo, mas com 11 snapshots divergentes e doc `tests/AGENTS.md` §6 desatualizada — regressão visual deve ser reportada com baseline reconciliada, nunca presumida.
