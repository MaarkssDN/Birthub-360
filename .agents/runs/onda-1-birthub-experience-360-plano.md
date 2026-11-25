# Onda 1 — Estabilização (Operação Birthub Experience 360)
Autor: Agente 00 · 2026-11-19 · Base: origin/main (após #420 e frentes A+B+C de tokens neon) · Fonte dos achados: `.agents/runs/14-inventario-visual-app-20261119.md`
Autorização humana: "POD COMECAR" (Orquestrador Humano). Escopo: SOMENTE a11y/contraste comprovados no inventário. Landing e Login intocáveis. Sem redesign.

## Passo 0 (obrigatório antes de qualquer correção)
O inventário foi medido em main ANTES dos commits `9b01b0a23`/`1a078e10c` (tokens neon, `official-identity.css`, `tokens.test.ts`), que podem já ter resolvido parte dos achados. Cada agente DEVE reexecutar o axe/medição nas rotas do seu escopo no HEAD atual da main e corrigir apenas o que ainda reproduz; o que já passou é registrado como "já resolvido por <commit>".

## Critérios de aceite (PROTOCOLO_QUALIDADE_E_ACEITE §2)
OBRIGATÓRIO (verificado com o harness local do 14, tema claro e escuro, 1280x800):
- A1 `settings/pillars/{hub,market,sales,performance,predictability,ai,automation,engagement}`: 0 violações axe `label` e `select-name`.
- A2 `/app/gamification`: 0 `button-name`.
- A3 `/app/characters` H1: contraste >= 3:1 no tema claro (era 1,52:1; H1 30px), via token existente (`--title-color-*`).
- A4 0 `color-contrast` sério em `/app/voice-hub`, `/app/failover`, `/app/resilience`, `/app/roleplay`, `/app/market-intelligence/hub`, `/app/signals-risks/deal-risks` (claro e escuro); `/app/dashboard` reavaliar.
- A5 Sem regressão: `npx tsc --noEmit`, `npm run lint` (0 erros; não aumentar warnings), testes unitários dos arquivos afetados, `accessibility.spec.ts` e `auth.spec.ts`, `npm run test:architecture`.
- A6 Diff cirúrgico (P3): sem refatoração adjacente; cores por tokens, sem hex novo cru; `prefers-reduced-motion` e estados preservados.
OPCIONAL: 429 em `/app/editor` (artefato de carga), avisos three.js, warnings biome pré-existentes.
DECISÃO HUMANA (fora da Onda 1): tipografia governante (DS-003).
NÃO TOCAR: `src/components/ui/sign-in-page.tsx`, `src/components/ErrorBoundary.tsx`, `src/bootstrap/frontend.ts` (PR #415 aberto); `playwright.config.ts` e testes de integração (PR #403); snapshots visuais e `visual-regression/baselines` (fluxo de baseline do 08).

## Divisão por propriedade (disjunta; um PR em rascunho por agente; sem merge)
- Agente 02 (settings/gamification/layout): A1, A2 — branch `agente/02-onda1-a11y-labels`.
- Agente 03 (design system/estilos/ui): A3, A4 — branch `agente/03-onda1-contraste`.
- Agente 14 (harness): reproduzir com evidência bruta o 500 de `/api/agent/characters` e os 404 de agentes — branch `agente/14-onda1-repro-500`; só então handoffs para 13 e 07/18.
- Agente 24: revisão independente de cada PR antes de integração (AGENTS.md §40). Agente 08A: merge somente com autorização humana explícita.
- Arquivo de outro dono: não editar; abrir handoff (AGENTS.md §16).

## Evidência esperada por PR
Comandos e saídas reais (axe antes/depois por rota, testes), arquivos alterados, o que NÃO foi executado. Nada "verde" sem execução.
