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

## Adendo v0.2 — dois níveis de movimento (fonte: Desktop `TUDO/v2/04-motion/motion-system.md`, lido)

Estado: **decisão de direção do usuário (FONTE-DE-VERDADE §7) + especificação V2 "PENDENTE DE HOMOLOGAÇÃO"**. Os tokens `--motion-*` da V2 **não existem** no runtime (`globals.css` usa `--duration-*`/`--ease-*`; mapeamento = DOCUMENTADO, NÃO IMPLEMENTADO).

| | Comercial (landing, marketing, hero) | Operacional (workspaces, dashboards, forms) |
|---|---|---|
| Caráter | monumental, cinematográfico | rápido, discreto, funcional |
| Duração típica | 600–900 ms; loops 2–20 s | 100–350 ms; loops ≤ 2,4 s |
| Stagger | 90 ms | 40 ms (máx. ~8 itens animados) |
| Permitido | parallax, tilt 3D, órbita 360° contínua, blur cinematográfico | `transform`+`opacity` em ~90% dos casos; blur só em entrada de página |
| Proibido | — | springs elásticos em dados, loops chamativos, scale em hover de input |

Regras adicionais da V2 (propostas): `viewport {once:true, margin:'-40px'}` em reveals; órbita 360° = um por viewport, dourado; glow nunca em >1 CTA ao mesmo tempo; scan line só one-shot (1,4 s); contadores com `tabular-nums` e flash de 300 ms (sem tween longo em KPI denso); `useIsTouchDevice()` desliga tilt/parallax; `will-change` só durante a animação; springs evitados em listas >20 itens.
Reduced motion (V2): zerar durações via `@media`, toggle manual `html[data-motion="reduced"]`, loops viram estado estático, nenhuma informação depende só de movimento.

Reconciliação com o runtime: V2 define `gentle 600 / ambient 800 ms` = `MOTION_DURATION.gentle/slow` em `motion.ts` (sem equivalente CSS) — confirma a lacuna apontada em C-07; resolver adotando os tokens V2 após homologação.
