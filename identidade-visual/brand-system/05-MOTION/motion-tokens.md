# Motion Tokens — Tabela de Referência

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** catálogo exato dos tokens de motion em uso: easings, durations, springs, staggers, com valores e origem no código.
- **Escopo:** `src/lib/motion.ts` (JS) e `src/styles/globals.css` (CSS custom properties + `@theme`).
- **Estado da informação:** CONFIRMADO em 2026-11-19. Marcação **[OCIOSO]** = exportado em `motion.ts` sem consumidor `.tsx` verificado.
- **Fontes:** `src/lib/motion.ts`, `src/styles/globals.css:390-399`, `src/styles/official-identity.css:212-219`.
- **Relacionados:** `manual-de-animacoes.md`, `principios-de-motion.md`.

---

## 1. Easings (cúbicos `[x1,y1,x2,y2]`)

Origem: `src/lib/motion.ts:10-15`.

| Token | Valor | Uso observado |
|---|---|---|
| `EASE_PREMIUM` | `[0.22, 1, 0.36, 1]` | Padrão de entradas, staggers, transições de página |
| `EASE_SPRING_SOFT` | `[0.34, 1.56, 0.64, 1]` | Easing "com overshoot" leve (nome enganoso: é curva, não spring) |
| `EASE_OUT_EXPO` | `[0.16, 1, 0.3, 1]` | Entradas de texto/blur, microinterações |
| `EASE_IN_OUT_SMOOTH` | `[0.4, 0, 0.2, 1]` | Saídas/exits |
| `EASE_SMOOTH` | `[0.25, 0.1, 0.25, 1]` | Loops ambientes (`pulseGlow`, `pulseGlowInfinite`) |
| `EASE_BOUNCE` | `[0.22, 1, 0.36, 1]` | **Alias idêntico a `EASE_PREMIUM`** (linha 14, "Replaced bounce with smooth") — não usar |

CSS (`globals.css:396-399`):

| Token | Valor | Equivalente JS |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | ≈ `EASE_IN_OUT_SMOOTH` |
| `--ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | = `EASE_PREMIUM` |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | sem equivalente JS exportado |
| `--ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | = `EASE_OUT_EXPO` |

## 2. Durações

`src/lib/motion.ts:17-24` (`MOTION_DURATION`, em segundos):

| Token | Valor | Equivalente CSS |
|---|---|---|
| `instant` | 0.1s | `--duration-instant: 100ms` (globals.css:390) |
| `fast` | 0.15s | `--duration-fast: 150ms` (:391) |
| `base` | 0.25s | `--duration-normal: 250ms` (:392) |
| `deliberate` | 0.35s | `--duration-slow: 350ms` (:393) |
| `gentle` | 0.6s | sem equivalente CSS |
| `slow` | 0.8s | sem equivalente CSS |

CSS adicional: `--duration-slowest: 500ms` (globals.css:394).

**Nota:** `MOTION_DURATION` é exportado mas **não tem consumidor `.tsx`** — as variants embutem durações literais. Usar os valores literais das variants como referência real.

## 3. Springs (Framer Motion `type:'spring'`)

Origem: `src/lib/motion.ts:26-32`.

| Token | stiffness | damping | mass | Alias/observação |
|---|---|---|---|---|
| `SPRING_SNAPPY` | 420 | 32 | 0.7 | resposta tátil rápida |
| `SPRING_SOFT` | 260 | 24 | 0.9 | padrão de scale-in |
| `SPRING_ELASTIC` | 260 | 24 | 0.9 | **alias de SOFT** (nome legado) |
| `SPRING_BOUNCY` | 260 | 24 | 0.9 | **alias de SOFT** — "Replaced with softer spring" |
| `SPRING_TACTILE` | 500 | 28 | 0.6 | toque mais rígido |
| `SPRING_MOMENTUM` | 350 | 25 | 0.8 | inércia média |
| `SPRING_ORGANIC` | 280 | 22 | 0.8 | movimento "vivo" |

Springs inline fora dos presets: `pillReveal` 300/22, `nodePulse` 400/15, `badgePop` 450/22.

## 4. Staggers

| Helper | Assinatura | Default |
|---|---|---|
| `staggerContainer(stagger, delayChildren)` | `motion.ts:123-128` | stagger 0.04, delay 0 |
| `metricsContainer` (variants) | `motion.ts:387-392` | staggerChildren 0.09, delayChildren 0.1 |
| `staggerGridContainer(stagger, delayChildren)` **[OCIOSO]** | `motion.ts:450-456` | stagger 0.04, delayChildren 0.05 |

## 5. Durações por contexto (valores reais nas variants)

| Contexto | Enter | Exit | Origem |
|---|---|---|---|
| Página `/app/*` (`pageTransitionClean`) | 0.22s ease `EASE_PREMIUM` | 0.15s `EASE_IN_OUT_SMOOTH` | `motion.ts:433-445`; usado em `PageTransition.tsx` |
| Página rica (`pageTransition`) **[OCIOSO]** | 0.4s `EASE_PREMIUM` | 0.25s `EASE_PREMIUM` | `motion.ts:140-156` |
| Fade genérico (`fadeIn`) | 0.25s `EASE_OUT_EXPO` | — | `motion.ts:58-61` |
| Entradas com blur (`fadeInUp/Down/Scale`, `slideIn*`) | 0.28–0.3s `EASE_OUT_EXPO` | — | `motion.ts:63-121` |
| Stagger item (`staggerItem`) | 0.4s `EASE_PREMIUM` | — | `motion.ts:130-138` |
| Métrica (`metricReveal`) | 0.55s `EASE_PREMIUM` | — | `motion.ts:372-381` |
| Grid item (`gridItemEntrance`) **[OCIOSO]** | 0.28s `EASE_PREMIUM` | — | `motion.ts:458-465` |
| Modal backdrop (`modalBackdropMotion`) | 0.2s `EASE_OUT_EXPO` | 0.15s `EASE_IN_OUT_SMOOTH` | `motion.ts:510-514` |
| Modal dialog (`modalDialogMotion`) | 0.25s `EASE_PREMIUM` | 0.16s `EASE_IN_OUT_SMOOTH` | `motion.ts:516-530` |
| Drawer lateral (`drawerSlideRight`) | 0.3s `EASE_PREMIUM` | 0.22s `EASE_IN_OUT_SMOOTH` | `motion.ts:535-547` |
| Drawer inferior (`drawerSlideBottom`) **[OCIOSO]** | 0.3s / 0.22s | — | `motion.ts:549-561` |
| Linha de tabela (`tableRowEntrance`) **[OCIOSO]** | 0.2s `EASE_PREMIUM` | — | `motion.ts:566-573` |
| Scroll reveal (`scrollRevealFadeUp/Scale`) **[OCIOSO]** | 0.32–0.35s | — | `motion.ts:489-505` |
| Scan line (`scanLineEntry`) **[OCIOSO]** | 1.4s `EASE_OUT_EXPO`, delay 0.3 | — | `motion.ts:414-421` |

## 6. Keyframes CSS (`globals.css`)

| Keyframe | Linha aprox. | Uso |
|---|---|---|
| `toast-in` | 968 | entrada de toast |
| `float` | 980 | flutuação ambiente |
| `pulse-glow` | 991 | glow pulsante |
| `gradient-xy` / `gradient-flow` | 1002 / 1013 | gradientes animados |
| `shimmer` | 1027 | skeleton/loading shimmer |
| `fade-in-up` | 1037 | entrada editorial |
| `pulse-slow` | 1049 | pulso lento |
| `fade-in` | 1062 | fade simples |
| `border-beam` | 958 | feixe de borda |
| `spin-slow` | — | rotação lenta (`.bh-orbit-ring`, globals.css:1657) |
| `vancouverFadeUp` | 1809 | entrada da família `.vancouver-*` |
| `balloon-explode` | 509 | celebração (gamificação) |

Todos são neutralizados por `@media (prefers-reduced-motion: reduce)` global (`globals.css:1582-1597`, `!important` em duration/iteration/scroll-behavior) e por regras específicas em `official-identity.css:212-219` e `Sidebar.css:254`.

## 7. Lacunas

- Não existe arquivo único de tokens motion em formato DTCG (`.json`); os tokens vivem em TS (`motion.ts`) e CSS (`globals.css`). O DTCG de motion existe apenas na proposta V2: `identidade-visual/v2/04-motion/motion-tokens.json` — **[PROPOSTO, não homologado]**.
