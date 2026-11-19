# Manual de Animações

Estado: tokens CONFIRMADOS (`motion.ts`, `globals.css`); padrões por componente PARCIAL; medidas de desempenho NÃO EXECUTADAS.
Stack real: **framer-motion** (124 arquivos), CSS keyframes/Tailwind (`motion-safe:`), `MotionConfig` na raiz de `App.tsx`.

## Princípios (PROPOSTO, ancorados no código)

1. Movimento comunica estado, não decora (feedback, entrada, continuidade).
2. Preferir `opacity` e `transform`; evitar animar `width/height/top/left` (exceção justificada).
3. Interações ≤ 250 ms; entradas de página ≤ 350 ms; narrativas (landing/orbit) até 800 ms.
4. Toda animação tem alternativa estática com `prefers-reduced-motion`.

## Tokens

| Token | Valor | Onde |
|---|---|---|
| `--duration-instant/fast/normal/slow/slowest` | 100/150/250/350/500 ms | CSS |
| `MOTION_DURATION` | instant .1, fast .15, base .25, deliberate .35, gentle .6, slow .8 s | TS |
| Easings | `EASE_PREMIUM [.22,1,.36,1]`, `EASE_OUT_EXPO [.16,1,.3,1]`, `EASE_IN_OUT_SMOOTH [.4,0,.2,1]`, `EASE_SMOOTH [.25,.1,.25,1]`, `EASE_SPRING_SOFT [.34,1.56,.64,1]` | TS |
| Springs | `SNAPPY` 420/32/.7, `SOFT` 260/24/.9, `TACTILE` 500/28/.6, `MOMENTUM` 350/25/.8, `ORGANIC` 280/22/.8 | TS |

Duplicatas: `SPRING_ELASTIC = SPRING_BOUNCY = SPRING_SOFT` (valores idênticos); `EASE_BOUNCE` == `EASE_PREMIUM`. Manter um nome canônico (C-07).
Descompasso: `slowest 500ms` e `gentle .6`/`slow .8` não correspondem entre CSS e TS.

## Padrões (variants existentes em `motion.ts`)

| Padrão | Inicial → final | Duração/easing |
|---|---|---|
| `fadeIn` | opacity 0→1 | .25s `EASE_OUT_EXPO` |
| `fadeInUp` / `fadeInDown` | opacity 0→1, y ±8→0, blur 3→0 px | .3s `EASE_OUT_EXPO` |
| `pillReveal` | opacity 0, scale .94, y 6 → 1,1,0 | spring 300/22 |
| `nodePulse` (hover) | scale 1→1.08 | spring 400/15 |
| `journeyConnector` | pathLength 0→1 | .8s `EASE_PREMIUM` |
| Botão press | `active:scale-[.97]` | 200ms ease-out (`motion-safe`) |
| Botão hover | `brightness(1.1)` / sombra | token `--interactive-hover-filter` |

Modais, menus, tabs, skeleton, toast, onboarding, landing: padrões **NÃO VERIFICADOS** (não lidos). Regra provisória: modal fade+scale .96→1 em 250ms `--ease-enter`; saída 150ms `--ease-exit`.

## Movimento reduzido

- `<MotionConfig reducedMotion="user">` em `src/App.tsx:70` (CONFIRMADO): framer-motion respeita a preferência do SO automaticamente (desativa transforms/layout; mantém opacity).
- `useReducedMotion` em 40 arquivos, CSS `prefers-reduced-motion` em 17; **diferença aproximada de ~84 arquivos** entre uso de framer-motion (124) e uso do hook (40, contagem independente); (cobertura depende do `MotionConfig`).
- Regra: com reduced motion, desativar translação/escala/blur/parallax/partículas/loops (`ParticleSystem`, `BorderBeam`, `OrbitRing`); manter apenas fades curtos (≤150ms) ou troca instantânea.

## Interrupção

Preferir springs (reversíveis) a keyframes longos para estados interativos; em `AnimatePresence`, saídas não bloqueiam navegação.
