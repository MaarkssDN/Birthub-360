# 14 — Matriz de Testes e Critérios de Aceitação
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`

## 1. Infraestrutura de teste existente

| Camada | Ferramenta | Cobertura conhecida |
|---|---|---|
| Unit | Vitest (`vitest.unit.config.ts`) | 921 arquivos / 7.366 testes verdes (fase-zero §11) |
| Integration | Vitest (`vitest.integration.config.ts`) + Postgres/Redis `.env.test` | suites por domínio |
| Container | Vitest (`vitest.container.config.ts`) | serviços reais |
| E2E | Playwright (`playwright.config.ts`) | auth 4/4, accessibility 34/34 (Agente 14); mobile-sweep 37 módulos |
| Visual | Playwright (`playwright.visual.config.ts`) | 4 projetos (1440/1366/768/390), ~150 baselines light/dark, `updateSnapshots:'none'` |
| A11y | `@axe-core/playwright` em accessibility.spec.ts | ~40 rotas, threshold critical/serious |
| Perf | k6 (load:k6, k6-analytics-commercial-intelligence), bundle budgets CI | thresholds p95<500ms etc. |
| Arquitetura | dependency-cruiser + verify-ownership + hotspots | EXIT 0, 70 violações conhecidas |

## 2. Matriz por tipo de mudança proposta

| Mudança | Teste obrigatório |
|---|---|
| Tokens/CSS (05-CSS-TECH-DEBT) | `test:visual` diff + axe nas rotas afetadas + verificação manual light/dark |
| Navegação/rotas órfãs (OPP-06, UX-001/002) | E2E navegação + redirect assertions + axe + mobile-sweep |
| Command Palette (OPP-03/04) | unit (filtro por papel) + E2E ⌘K fluxos + axe focus trap |
| Criação de lead (OPP-01) | unit UseCases + integration API + E2E kanban + RBAC negativo |
| Estados erro/empty (OPP-05) | E2E com mock de falha (MSW/route abort) + axe |
| Modais responsivos (RSP-001) | visual spec mobile 390 + manual 360px |
| Providers memoizados (REND-001) | unit + verificação de renders (React DevTools/profiler) + typecheck |
| useFetch cancel (PERF-001) | unit race-condition + integration + E2E busca |
| Precache SW (PERF-002) | `verify:pwa-precache` + teste de install/offline (skill offline-fallback) |

## 3. Lacunas de cobertura a fechar

1. **Papéis não-ADMIN:** axe + visual sweep para GESTOR, SDR, MESA_TRATAMENTO, COPILOTO_IA, COMMERCIAL_INTELLIGENCE, VISUALIZADOR.
2. **`test:visual` nunca executado nesta operação** — rodar baseline antes de qualquer mudança visual (senão não há comparação before/after).
3. **Rotas fora do mobile-sweep** (~20): settings/pillars, characters, failover, war-room, resilience, forecast, metas, pipeline_ponderado.
4. **Interações:** formulários submetidos, kanban drag E2E, drawers, modais custom — só análise estática até aqui.
5. **Touch targets / reflow 320px / zoom 200%** — sem cobertura.
6. **Screen reader** — nunca executado; recomendado roteiro manual (skill `screen-reader-test-author`) para fluxos críticos.
7. **CWV/Lighthouse por rota** — não configurado; skill `lighthouse-perf` disponível.
8. **axe warns do Biome** — exportar inventário real (`biome lint` a11y rules) para backlog priorizado.

## 4. Critérios de aceitação globais desta operação

- Todo achado P0/P1 tem evidência arquivo:linha + classe (defeito confirmado / risco fundamentado / inconsistência / oportunidade / hipótese).
- Nenhuma recomendação implementada sem teste correspondente.
- Entregáveis rastreáveis: cada item do backlog aponta para achado + arquivo + dono + onda.
- Parecer do Agente 09 (Silas) obrigatório antes de declarar conclusão (§40 AGENTS.md).
