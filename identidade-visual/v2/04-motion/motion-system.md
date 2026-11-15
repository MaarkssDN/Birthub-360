# Motion System V2.0 — Birthub 360° (PROPOSTA)

**Status:** PENDENTE DE HOMOLOGAÇÃO. Dois níveis de movimento conforme
FONTE-DE-VERDADE §7. Em produção, Framer Motion é a lib padrão
(`src/lib/motion.ts`) — este documento é a especificação que ele e o CSS
(`motion-tokens.css`) devem implementar.

**Princípio central:** movimento comunica hierarquia e estado, nunca decora.
No nível Operacional a regra é *imperceptível mas perceptível*: o usuário
sente fluidez, não animação.

---

## 1. Os dois níveis

| | **Comercial** (Persuade) | **Operacional** (Operate) |
|---|---|---|
| Superfícies | landing, marketing, hero, reveals editoriais | workspaces, dashboards, formulários, listas |
| Caráter | monumental, cinematográfico | rápido, discreto, funcional |
| Durações típicas | 600–900ms entradas; loops ambientes 2–20s | 100–350ms; loops ambientes ≤2.4s |
| Stagger | 90ms | 40ms |
| Permitido | parallax, tilt 3D, órbita 360° contínua, blur cinematográfico | apenas transform+opacity em 90% dos casos; blur só em entradas de página |
| Proibido | — | springs elásticos em dados, loops chamativos, scale em hover de input |

**Tabela de decisão:**

| Cenário | Nível |
|---|---|
| Tela de vendas/landing, hero, manifesto | Comercial |
| Reveal editorial de seção de marketing | Comercial |
| Workspace de módulo (P01–P08, M09–M11) | Operacional |
| Hub Central — visão executiva | Operacional (aceita 1 elemento orbital comercial no topo) |
| Assistente global — respostas de IA | Operacional (typing sutil permitido) |
| Transição de tema dark/light | Operacional (250ms crossfade) |
| Onboarding first-run | Comercial *suave* (uma única coreografia) |

---

## 2. Tokens

`motion-tokens.json` (DTCG) + `motion-tokens.css`. Durations/easings base
idênticos aos homologados em `docs/design/BIRTHHUB-360-DESIGN-SYSTEM.md` §14
e `src/lib/motion.ts`:

- **Durations (Operacional):** instant 100 / fast 150 / normal 250 /
  slow 350 / gentle 600 / ambient 800ms.
- **Durations (Comercial):** enter 700 / emphasize 900 / ambient-long 2400ms.
- **Easings nomeados:**
  - `ease-standard` `cubic-bezier(0.4,0,0.2,1)` — transições gerais.
  - `ease-enter` `cubic-bezier(0.22,1,0.36,1)` — entradas (EASE_PREMIUM).
  - `ease-exit` `cubic-bezier(0.4,0,1,1)` — saídas.
  - `ease-emphasized` `cubic-bezier(0.16,1,0.3,1)` — reveals, modais.
  - `ease-smooth` `cubic-bezier(0.25,0.1,0.25,1)` — loops ambiente.
- **Springs (Framer):** snappy 420/32, soft 260/24, tactile 500/28,
  momentum 350/25 — usar só onde física agrega (botões, drawers).

---

## 3. Sequenciamento e stagger

- **Stagger operacional:** 40ms entre filhos diretos de container; máximo
  ~8 itens animados por sequência — além disso, agrupar.
- **Stagger comercial:** 90ms, com `delayChildren` para coreografia
  headline → sub → CTA → visual.
- **Ordem de leitura = ordem de animação:** elementos nunca entram fora de
  sequência espacial (esquerda→direita, topo→base).
- `viewport: { once: true, margin: '-40px' }` em reveals por scroll —
  animação de scroll nunca repete.

---

## 4. Catálogo de variantes (mapa para `src/lib/motion.ts`)

| Variante | Operacional | Comercial |
|---|---|---|
| Entrada de tela | `pageTransitionClean`: y10+opacity, 220ms enter | `pageTransition`: y18+blur8+scale.99, 400ms + elementos hero em 700–900ms |
| Reveal por scroll | `scrollRevealFadeUp` y16, 350ms; `scrollRevealScale` .97 | idem + blur 4px, até 600ms |
| Stagger grid | `staggerGridContainer` 40ms + `gridItemEntrance` y12 | 90ms + blur leve |
| Métricas/KPI | `metricReveal` y24+rotateX8+blur8, 550ms; container stagger 90ms | + glow sweep único |
| Botão | `buttonMotion`: hover y-1.5/150ms, tap scale .97/80ms; `ctaGlow` no hover (só CTA) | `shimmerBeam` no hover de CTA primário |
| Card | `cardHoverMotion`: y-2/200ms; spotlight sutil opcional | tilt 3D `useTilt` (só desktop, sem touch) |
| Modal/Drawer | `modalDialogMotion` 250ms; `drawerSlideRight` 300ms | entrada com scale .96→1 + blur |
| Tabela | `tableRowEntrance` y6, 200ms — sem reflow de largura | — |
| Skeleton | shimmer 2.5s linear; reduced-motion = pulso estático lento ou estático | — |

---

## 5. Assinaturas visuais de movimento

- **Elemento 360°/órbita:** anel `conic-gradient` (`--grad-orbit`) rotacionando
  — Comercial 12–16s linear infinite; Operacional apenas no hero do módulo,
  16s+, e **um por viewport**. Dourado é a cor do elemento 360°.
- **Iluminação neon:** glows `0 0 24px rgba(...,0.45)` em hover/estado ativo;
  transição de glow usa `ease-enter` 400ms. Nunca glow simultâneo em >1 CTA.
- **Profundidade/parallax:** `useGlobalCursorDepth` — offset máx. ±0.5%
  translate em camadas de fundo; desktop only, reduced-motion = 0. Sem
  parallax em tabelas ou formulários.
- **Scan line:** `scanLineEntry` one-shot 1.4s na montagem do layout.
  **Nunca em loop** (regra já registrada em motion.ts).
- **Transição dark/light:** crossfade de superfícies 250ms `ease-standard`;
  glows neon mantêm intensidade relativa (light usa alpha menor via tokens).
- **Feedback de dados:** contadores atualizam com `tabular-nums` + flash
  sutil de accent 300ms; nunca tween de número longo em KPI denso.

---

## 6. prefers-reduced-motion (obrigatório)

1. `@media (prefers-reduced-motion: reduce)` zera todas as durações
   (`motion-tokens.css` já implementa).
2. Toggle manual `html[data-motion="reduced"]` com o mesmo efeito — usado
   pela demo e disponível para preferência persistida do usuário.
3. Loops infinitos (órbita, shimmer, pulse) viram **estado estático**:
   shimmer → gradiente fixo; órbita → anel estático; pulse → opacidade fixa.
4. Parallax/tilt/spotlight retornam valores neutros (ver `useTilt`,
   `useGlobalCursorDepth` em motion.ts — já respeitam).
5. **Nenhuma informação depende só de movimento:** estados de loading,
   sucesso e erro têm equivalente textual/visual estático.

---

## 7. Performance

- Animar somente `transform` e `opacity` no nível Operacional; `blur` e
  `filter` só em entradas de página (GPU cara em WebView/Capacitor).
- `useIsTouchDevice()` desativa tilt/spotlight/parallax em coarse pointer.
- Springs com `mass`/`damping` moderados; evitar springs em listas >20 itens.
- `will-change` somente durante a animação; nunca permanente em cards.

---

## 8. Demo

`demo.html` — protótipo funcional (HTML/CSS/JS puro, file://) com: entrada de
tela, stagger editorial, botão glow, órbita 360°, skeleton, transição
dark/light e toggle "Movimento reduzido". **Não é produto.**
