# Relatório de Execução — Agente 35 · Mia

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 1 — Fundação
**Branch:** `agente/35-mia-motion-v2` (base: `agente/33-celia-design-tokens-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. `src/lib/motion.ts` (v1) já é extenso e maduro — não foi alterado; v2 é um sistema paralelo em `motion-v2.ts`.
2. O sistema v2 usa Framer Motion para variantes e CSS para utilitários pontuais + guarda de reduced motion.
3. Flag dedicada `design.newMotion` adicionada a `feature-flags.ts` (além das 9 originais).

## Plano executado

- **Etapa 1 — Auditoria:** `src/lib/motion.ts` revisado — já possui easings/durações e springs; componentes existentes usam `useReducedMotion`/`MotionConfig reducedMotion="user"` (ex.: `MotionWrapper.tsx`). Nenhuma alteração necessária no v1.
- **Etapa 2 — Sistema v2:** `src/lib/motion-v2.ts` criado com durações (100–500ms) e easings alinhados aos tokens CSS `--duration-*`/`--ease-*` do design-v2; variantes fade/reveal/scale/stagger/page; hook `useMotionV2()` que combina flag + `useReducedMotion` do Framer Motion.
- **Etapa 3 — Microinterações:** `src/styles/motion-v2.css` com `.motion-v2-interactive` (hover/active via transform/opacity) e `.motion-v2-spinner`; `src/components/motion/Reveal.tsx` — wrapper de entrada que renderiza estado final quando flag off ou reduced motion.
- **Etapa 4 — Performance:** todas as animações restritas a `transform`/`opacity`; stagger limitado a listas curtas; sem animações infinitas exceto spinner (800ms linear, desligado em reduced motion).
- **Etapa 5 — Acessibilidade:** `useMotionV2()` zera animação quando `prefers-reduced-motion`; `@media (prefers-reduced-motion: reduce)` em `motion-v2.css` desliga utilitários CSS; `MotionConfig reducedMotion="user"` do v1 preservado.

## Arquivos alterados

- `src/lib/motion-v2.ts` (novo)
- `src/components/motion/Reveal.tsx` (novo)
- `src/styles/motion-v2.css` (novo)
- `src/styles/globals.css` (+1 `@import`)
- `src/config/feature-flags.ts` (+flag `design.newMotion`)
- `.agents/runs/35-mia-motion-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo para arquivos da missão (erro pré-existente `swarmAudit.service.ts` persiste, fora do escopo).
- `npx biome lint` nos arquivos alterados → limpo.

## Testes

- Typecheck e lint verdes. Medição de FPS em dispositivo real fica para a fase de QA visual (Fase 5) — as animações usam apenas propriedades GPU-accelerated por construção.

## Evidências

- `useMotionV2()` = `isDesignV2Enabled(NEW_MOTION) && !useReducedMotion()` — rollback e acessibilidade num único ponto de decisão.
- Durações/easings espelham `design-v2.css` (`--duration-instant…slowest`, `--ease-standard/enter/exit/emphasized`).

## Problemas fora do escopo

- Animações legadas decorativas (Glow, ParticleSystem, BorderBeam etc.) não foram auditadas individualmente — inventário completo é trabalho das fases 2–3 com os agentes de tela.

## Handoffs abertos

- Para Agentes 31/32/36/37/38: consumir `Reveal`, `motionV2*` e classes `.motion-v2-*` atrás da flag `design.newMotion`.
- Para Agente 34 (Ari): validar que `Reveal` e utilitários respeitam reduced motion (já implementado; falta validação com leitor de tela).

## Aprendizados reutilizáveis

- Padrão "flag + reduced motion" num único hook (`useMotionV2`) evita espalhar `if`s por componente.
- Manter motion v1 intocado e criar v2 paralelo é o caminho de rollback seguro.

## Pendências

- Transições de página integradas ao router (depende do App Shell — Agente 31).
- Validação de FPS em mobile real (Fase 5).

## Riscos

- Baixo: tudo novo está atrás de flag; CSS adicionado é mínimo e inerte sem as classes.
