# Manual de Animações — Motion System

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** visão geral do sistema de movimento implementado no produto: filosofia, stack, onde vive o código e como as peças se relacionam.
- **Escopo:** motion em `src/` (React/Vite + Framer Motion + CSS/Tailwind 4). Não cobre proposta V2 não homologada (ver `identidade-visual/v2/04-motion/motion-system.md`, citada como **[PROPOSTO]** onde relevante).
- **Estado da informação:** CONFIRMADO por leitura de código em 2026-11-19.
- **Fontes:** `src/lib/motion.ts`, `src/App.tsx`, `src/styles/globals.css`, `src/styles/official-identity.css`, `src/components/layout/PageTransition.tsx`, `identidade-visual/v2/04-motion/motion-system.md`.
- **Relacionados:** `principios-de-motion.md`, `motion-tokens.md`, `transicoes.md`, `microinteracoes.md`, `movimento-reduzido.md`.

---

## 1. Filosofia

Motion no Birth Hub 360° **comunica estado, não decora**:

- Entradas de página e componentes sinalizam "isto acabou de carregar/chegar" (fade + translate curto + blur progressivo).
- Microinterações sinalizam affordance tátil (hover levanta 1–2px, tap comprime ~3%).
- Ambient loops são raros e curtos: `scanLineEntry` roda **uma única vez** na montagem do layout — o próprio comentário em `src/lib/motion.ts:411-413` proíbe repetição em loop ("NÃO repetir em loop — Design Language §8").
- Efeitos que dependem de cursor (tilt, magnetic, spotlight, parallax global) são **desativados automaticamente** em dispositivos touch e em `prefers-reduced-motion` (`useIsTouchDevice`, `src/lib/motion.ts:192-205`).

A proposta V2 formaliza dois níveis — **Comercial** (hero, landing, reveals editoriais, mais cinematográfico) e **Operacional** (workspaces, dashboards, formulários, listas, contido) — mas isso é **PROPOSTO, não homologado**: `identidade-visual/v2/04-motion/motion-system.md` §tabela de superfícies. Hoje só existe o nível operacional na implementação.

## 2. Stack

| Camada | Tecnologia | Evidência |
|---|---|---|
| Animação declarativa React | `framer-motion` (pacote `motion`/`framer-motion` v13) | `src/lib/motion.ts:1-7`; ~114 arquivos `.tsx` importam `framer-motion`/`motion` |
| Tokens e keyframes CSS | Tailwind 4 `@theme` + CSS custom properties | `src/styles/globals.css` (durations ~linhas 390-399, easings 396-399, keyframes 958-1062, 1809) |
| Ponte React↔CSS | `MotionConfig reducedMotion="user"` | `src/App.tsx:70` |
| Som | `SoundFX` acoplado a toasts | `src/components/ui/Toaster.tsx:30-37` |

Não há biblioteca de animação adicional (GSAP, Lottie, etc.) no caminho principal — **NÃO VERIFICADO** qualquer uso fora de `framer-motion` + CSS.

## 3. Onde está implementado

| Local | Conteúdo |
|---|---|
| `src/lib/motion.ts` (573 linhas) | Módulo canônico: easings, durations, springs, ~30 variants `Variants`, 5 hooks de cursor/tilt |
| `src/components/layout/PageTransition.tsx` | Wrapper de transição de rota `/app/*` (usa `pageTransitionClean`) |
| `src/components/layout/Sidebar.tsx` + `Sidebar.css` | Motion de rail/painel; media query reduced-motion em `Sidebar.css:254` |
| `src/components/ui/Modal.tsx`, `Drawer.tsx` | `modalBackdropMotion`, `modalDialogMotion` |
| `src/features/crm/components/LeadDetailDrawer.tsx` | `drawerSlideRight` + `modalBackdropMotion` |
| `src/features/landing/pages/Landing360.tsx`, `src/features/voice-hub/pages/LandingInnovative.tsx`, `src/features/landing/components/CinematicFX.tsx` | Motion próprio de landing (usa `framer-motion` diretamente, `useReducedMotion`, `useScroll`/`useTransform`) |
| `src/styles/globals.css` | Keyframes `@theme`: `toast-in`, `float`, `pulse-glow`, `gradient-xy`, `gradient-flow`, `shimmer`, `fade-in-up`, `pulse-slow`, `fade-in`, `border-beam`, `spin-slow`, `vancouverFadeUp`, `balloon-explode` |

## 4. Consumidores verificados das variants de `motion.ts`

Verificação por grep em `src/**` (2026-11-19):

- **Com consumidores:** `pageTransitionClean` (`PageTransition.tsx`), `modalBackdropMotion`/`modalDialogMotion` (`Modal.tsx`, `LeadDetailDrawer.tsx`), `drawerSlideRight` (`LeadDetailDrawer.tsx`), `metricReveal`/`metricsContainer` (`SinglePageDashboard.tsx`), `shimmer` (`Skeleton.tsx` + 1), `staggerContainer`/`staggerItem`/`fadeIn`/`fadeInUp` (6–10 arquivos cada), `useTilt` (`TiltCard.tsx` + 1).
- **Exportados sem consumidor `.tsx` verificado:** `pageTransition`, `fadeInDown`, `fadeInScale`, `scaleIn`, `scaleInBouncy`, `slideInRight`, `slideInLeft`, `pillReveal`, `journeyConnector`, `nodePulse`, `pulseGlow`, `pulseGlowInfinite`, `badgePop`, `float3D`, `shimmerBeam`, `scanLineEntry`, `staggerGridContainer`, `gridItemEntrance`, `buttonMotion`, `cardHoverMotion`, `ctaGlow`, `scrollRevealFadeUp`, `scrollRevealScale`, `drawerSlideBottom`. Hooks `useMagnetic`, `useCursorSpotlight`, `useGlobalCursorDepth`, `useIsTouchDevice` (este último só usado internamente em `motion.ts`). `src/components/ui/Magnetic.tsx` implementa lógica própria e **não** usa `useMagnetic`. **Status: biblioteca parcialmente ociosa — tratar como API disponível, não como padrão em uso.**

## 5. Decisões pendentes

- Homologar ou não o modelo Comercial/Operacional do V2 (pendência humana nº 11 em `_FATOS-CANONICOS.md` §19).
- Convergir exports ociosos de `motion.ts` (adotar, deprecar ou documentar como reservados).
