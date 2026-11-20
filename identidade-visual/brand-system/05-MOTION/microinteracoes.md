# Microinterações

**Birth Hub 360° — Brand System · 05-MOTION**

- **Propósito:** catalogar as microinterações exportadas em `src/lib/motion.ts`, seus valores e **quando usar** — distinguindo as efetivamente adotadas das ociosas.
- **Escopo:** `src/lib/motion.ts`, `src/components/ui/Button.tsx`, `TiltCard.tsx`, `Magnetic.tsx`, `Skeleton.tsx`, `SinglePageDashboard.tsx`.
- **Estado da informação:** CONFIRMADO em 2026-11-19. "[OCIOSO]" = sem consumidor `.tsx` verificado.
- **Fontes:** `src/lib/motion.ts`, greps de consumo em `src/**`.
- **Relacionados:** `motion-tokens.md`, `transicoes.md`, `movimento-reduzido.md`.

---

## 1. Tabela de microinterações

| Variant/Hook | Comportamento | Valores | Origem | Uso verificado |
|---|---|---|---|---|
| `buttonMotion` **[OCIOSO]** | `rest` scale 1 → `hover` y −1.5 (150ms) → `tap` scale 0.97 (80ms) | lift 1.5px, compressão 3% | `motion.ts:470-474` | nenhum — `Button.tsx` usa props `shine`/`magnetic`/`soundClick` próprias, não esta variant |
| `cardHoverMotion` **[OCIOSO]** | `hover` y −2 (200ms), `tap` scale 0.99 | lift 2px | `motion.ts:479-483` | nenhum |
| `ctaGlow` **[OCIOSO]** | box-shadow glow ciano só no hover (`rest`=sem glow) | `0 0 24px rgba(0,229,255,.45)` | `motion.ts:398-408` | nenhum — documentado "usar como initial='rest' whileHover='glow'" |
| `badgePop` **[OCIOSO]** | scale 0→1 spring 450/22 | entrada de badge/contador | `motion.ts:286-293` | nenhum |
| `pillReveal` **[OCIOSO]** | opacity+scale .94+y 6, spring 300/22 | entrada de pill/tag | `motion.ts:34-42` | nenhum |
| `shimmerBeam` **[OCIOSO]** | feixe `x −100%→200%` no hover, opacity [0,.7,0] | 850ms `EASE_OUT_EXPO` inline | `motion.ts:268-275` | nenhum |
| `shimmer` | background-position loop 2.5s linear | skeleton/loading | `motion.ts:171-181` | **EM USO** — `Skeleton.tsx` + `SinglePageDashboard.tsx` |
| `metricReveal` + `metricsContainer` | entrada KPI: y24+rotateX8+blur8→0, 550ms; container stagger 0.09 | dashboards | `motion.ts:372-392` | **EM USO** — `SinglePageDashboard.tsx` |
| `pulseGlow` / `pulseGlowInfinite` **[OCIOSO]** | scale+opacity loop 2s/2.4s | indicadores "vivos" | `motion.ts:158-169,277-284` | nenhum |
| `float3D` **[OCIOSO]** | y ±3px + rotateZ ±0.8°, loop 4s | flutuação decorativa | `motion.ts:295-302` | nenhum |
| `scanLineEntry` **[OCIOSO]** | scaleX 0→1 + opacity pulse único, 1.4s + delay .3 | ambient único de layout | `motion.ts:414-421` | nenhum (regra: não repetir — comentário linhas 411-413) |
| `useTilt(intensity=10)` | rotateX/Y seguem cursor, springs; **desativa em touch/reduced** | intensidade padrão 10° | `motion.ts:207-235` | **EM USO** — `TiltCard.tsx` + 1 |
| `useMagnetic(strength=0.35)` | conteúdo do botão "puxa" ao cursor; desativa em touch/reduced | força padrão 0.35 | `motion.ts:240-266` | **NÃO USADO** — `Magnetic.tsx` implementa lógica própria (não importa o hook) |
| `useCursorSpotlight()` | gradiente radial `rgba(0,229,255,.14)` segue cursor; desativa em touch/reduced | raio 400px | `motion.ts:308-341` | nenhum |
| `useGlobalCursorDepth()` | parallax de fundo por posição do cursor; retorna 0,0 em reduced | normalizado [−0.5,0.5] | `motion.ts:349-366` | nenhum |
| `useIsTouchDevice()` | detecção coarse pointer/touch | — | `motion.ts:192-205` | interno de `motion.ts` |

## 2. Microinterações implementadas fora de `motion.ts`

- `Button.tsx`: props `shine` (varredura), `magnetic` (efeito próprio), `soundClick`/`soundHover` (`SoundFX`), variants cva (`default/primary/electric/lime/brand/...`) — microfeedback sonoro + visual embutido no primitivo.
- `Toaster.tsx`: sons `success`/`error`/`focus` por tipo de toast + auto-dismiss 4500ms (`AUTO_DISMISS_MS`, linha 22).
- `ClickSpark.tsx`, `Glow.tsx`, `HolographicCard.tsx`, `AuroraButton.tsx`: efeitos de cursor/partículas próprios com `useReducedMotion` individual.
- Keyframes CSS de microefeito: `border-beam`, `shimmer`, `float`, `pulse-glow` (globals.css).

## 3. Diretrizes de uso

1. **Lift sutil é o padrão de hover**: 1.5–2px (`buttonMotion`, `cardHoverMotion`) — nunca transforms grandes em elementos operacionais.
2. **Tap comprime ~3%** (`scale 0.97–0.99`, 80ms) — feedback tátil instantâneo.
3. **Glow só no hover e só em CTA** — `ctaGlow` documenta "nunca em resting state" (linhas 395-397).
4. **Efeitos de cursor são desktop-only por construção** — todo hook novo DEVE checar `useReducedMotion()` + `useIsTouchDevice()` (ver `movimento-reduzido.md`).
5. **Loops ambientes são exceção**: `scanLineEntry` roda uma vez; `pulseGlow*`/`float3D` estão ociosos — **[PROPOSTO]** não introduzir novos loops infinitos em superfícies operacionais sem revisão.
6. **Som é microinteração**: `SoundFX` em Button/Toaster é parte do sistema de feedback, não de motion — documentado em `06-EXPERIENCIA/feedback.md`.

## 4. Lacunas

- ~60% das variants de microinteração exportadas não têm consumidor — risco de divergência se novos componentes usarem valores inline em vez dos tokens. **[PROPOSTO]:** ao adotar uma variant ociosa, preferir o token a valores ad hoc.
