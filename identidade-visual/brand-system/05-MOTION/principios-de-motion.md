# Princípios de Motion

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** registrar os princípios de movimento **observados** na implementação atual (não os propostos).
- **Escopo:** `src/lib/motion.ts`, `src/App.tsx`, `src/styles/globals.css`, `src/styles/official-identity.css`, `src/components/layout/*`, `src/components/ui/*`.
- **Estado da informação:** CONFIRMADO por leitura de código em 2026-11-19. Recomendações marcadas **[PROPOSTO]**.
- **Fontes:** idem + `identidade-visual/v2/04-motion/motion-system.md` (**[PROPOSTO — não homologado]**).
- **Relacionados:** `manual-de-animacoes.md`, `motion-tokens.md`, `movimento-reduzido.md`.

---

## P1 — Motion comunica estado

Animações existem para comunicar transição de estado (entrada, saída, hover, foco, loading), não como enfeite. Evidência: todas as variants de entrada em `src/lib/motion.ts` combinam `opacity` + `y`/`x`/`scale` pequenos (4–24px) com durações de 0.15–0.55s.

## P2 — Propriedades compostas primeiro; blur só em entradas

- Entradas usam `filter: blur(2–8px) → blur(0)` como efeito de "materialização" (`fadeInUp` blur 3px, `pageTransition` blur 8px→0, `metricReveal` blur 8px→0 — `src/lib/motion.ts:63-91,140-156,372-381`).
- Animações contínuas/ambient **não** usam blur: `pulseGlow`/`pulseGlowInfinite`/`float3D` animam apenas `scale`, `opacity`, `y`, `rotateZ` (linhas 158-169, 277-284, 295-302).
- `pageTransitionClean` (linha 433-445) remove blur e `scale` explicitamente "para mobile/WebView: apenas transform e opacity, sem blur pesado em runtime".

## P3 — Springs para toque; easings para coreografia

- Toque/feedback tátil usa springs: `SPRING_SNAPPY/TACTILE` em `buttonMotion.tap` e `badgePop` (stiffness 420–500, damping 22–32 — linhas 26-32, 286-293, 470-474).
- Entradas e transições usam easings cúbicos (`EASE_*`, linhas 10-15), tipicamente `EASE_OUT_EXPO`/`EASE_PREMIUM`.

## P4 — Durações operacionais curtas

Faixa operacional observada: **0.08s–0.55s** para interações e entradas de conteúdo; loops ambientes 2–4s (`pulseGlow` 2s, `pulseGlowInfinite` 2.4s, `float3D` 4s). Transição de página operacional: enter 0.22s / exit 0.15s (`pageTransitionClean`); versão com blur (`pageTransition`): enter 0.4s / exit 0.25s.

## P5 — Ambient único, não repetido

`scanLineEntry` (linhas 414-421) é explicitamente "entra uma única vez na montagem do layout... NÃO repetir em loop". Não há outro loop ambiente de layout em uso — `pulseGlow*`/`float3D` estão exportados sem consumidor.

## P6 — Cursor-depth desativado em touch e reduced-motion

Todos os hooks de cursor verificam `useReducedMotion()` **e** `useIsTouchDevice()` antes de registrar listeners:

- `useTilt` (207-235), `useMagnetic` (240-266), `useCursorSpotlight` (308-341): retornam `style: undefined` quando touch/reduced.
- `useGlobalCursorDepth` (349-366): retorna `{x:0,y:0}` e não registra `mousemove`.
- `useIsTouchDevice` (192-205): detecta `(pointer: coarse)`, `ontouchstart`, `navigator.maxTouchPoints` — cobre Capacitor/Android.

**[PROPOSTO — v2 não homologado]:** estender essa regra a qualquer novo efeito de cursor/parallax; hoje é convenção observada, não norma escrita fora do código.

## P7 — Movimento nunca bloqueia conteúdo

`PageTransition` renderiza children dentro de `motion.div` com `AnimatePresence` no shell; em `prefers-reduced-motion` retorna um `<div>` simples sem animação (`src/components/layout/PageTransition.tsx:13-16`). Rotas `/app/*` são `React.lazy` + `Suspense` + `PageTransition` (`src/App.tsx`).

## P8 — Camadas de movimento não se sobrepõem descontroladamente

Stagger é usado com parcimônia: `staggerContainer(stagger=0.04)` e `metricsContainer(staggerChildren=0.09, delayChildren=0.1)` — delays máximos ~0.3s para listas longas. **[PROPOSTO]:** limitar stagger acumulado a <0.5s em listas >10 itens (não há evidência de regra implementada).

## Conflitos/divergências registradas

- `pageTransition` (com blur/scale, 0.4s) está exportado mas **sem consumidor**; o shell usa `pageTransitionClean`. A versão "rica" existe só como API ociosa.
- `EASE_BOUNCE` (linha 14) é alias idêntico a `EASE_PREMIUM` com comentário "Replaced bounce with smooth" — nome enganoso, não usar.
- `SPRING_ELASTIC` e `SPRING_BOUNCY` (linhas 28-29) são aliases de `SPRING_SOFT` — nomes legados.
