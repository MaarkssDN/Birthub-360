# 09 — Auditoria de Performance Frontend
**Operação:** Birthub Experience 360 · **Data:** 2026-11-22 · **Base:** `origin/main @ 0d790443d`
**Método:** análise estática de build config, imports, hooks e padrões de render. Sem Lighthouse/RUM executado nesta sessão — métricas CWV **não medidas**; baseline visual do Agente 14: carga ≤2,2 s em 70 rotas.

## 1. Pontos fortes (verificados)

- **Code splitting quase total:** 11 `React.lazy` em App.tsx + **59 lazy** em AppLayout cobrindo ~75 rotas; entry carrega só providers + shell.
- **`manualChunks` afinado** (vite.config.ts:155-238): vendor-react, vendor-motion, vendor-icons, vendor-dnd, vendor-echarts, vendor-excel, vendor-tiptap, vendor-pdf, vendor-carousel, vendor-3d, vendor-charts, vendor-auth — libs pesadas isoladas e sob demanda.
- **3D com gates duplos:** OnboardingTour gated por localStorage; RevenueSignalOrb lazy+IntersectionObserver; Gamified3DOrb pausa frameloop por reduced-motion/IO/hidden.
- **PWA:** vite-plugin-pwa generateSW autoUpdate, navigateFallbackDenylist `/api/`+`/webhook/`, CacheFirst p/ fontes, gate `verify-precache.ts`.
- **Budgets CI:** `check-bundle-budget.mjs` (total ≤3MB gzip, arquivo ≤500KB) e `check-public-budget.mjs` (public ≤60MB).
- **Fontes self-hosted** com swap + unicode-range; anti-FOUC inline em index.html.

## 2. Achados

| ID | Sev | Achado | Evidência |
|---|---|---|---|
| PERF-001 | P2 | `useFetch` central (`useDatabase.ts:29-53`) sem AbortController/cancel/race-guard — respostas fora de ordem podem sobrescrever; `refetch` força `loading=true` (skeleton full-screen em toda mutação). Hook de dados de companies/contacts/leads | `src/hooks/useDatabase.ts:29-53` |
| PERF-002 | P2 | SW precache cobre **todos** os chunks lazy (~123 arquivos, ~1.78MB gzip) — anula parcialmente o lazy loading no 1º install/rede lenta/Capacitor | `vite.config.ts:54` `globPatterns:['**/*.js']` |
| REND-001 | P2 | 5 providers de contexto com `value={{}}` não memoizado (Auth, Theme, ExperienceMode, DailyClosing, ActiveRecord) — qualquer re-render do provider invalida todos os consumidores | AuthContext.tsx:170-178; ThemeContext.tsx:54; ExperienceModeContext.tsx:53; DailyClosingContext.tsx:67; ActiveRecordContext.tsx:23 |
| PERF-003 | P3 | `ClickSpark` re-renderiza no nível do App a cada clique (listener window global, sem throttle, sem gate reduced-motion) | `ClickSpark.tsx:13-25`, `App.tsx:78` |
| PERF-004 | P3 | `optimizeDeps.include` contém `'pino'` (logger Node) — prebundle desnecessário em dev; pode mascarar import acidental | `vite.config.ts:97` |
| PERF-005 | P3 | 11 `@font-face` IBM Plex Mono com fallback TTF (~3-4× maior) — confirmar se todos os pesos/itálicos são usados | globals.css:40-173 |
| PERF-006 | P3 | `<img>` sem lazy/decoding fora da galeria (logos em listas) | CompanyList.tsx:221 etc. |
| PERF-007 | P3 | `Landing360.tsx` (~2.800-3.190 linhas) é o chunk de `/`, `/welcome` e `/login` — primeiro download de todo visitante; candidato a split da variante login | App.tsx:118-131 |
| REND-003 | P3 | `VirtualTable` usado em só 3 arquivos; `.map` completo em PropostasList, ForecastHub (3 tables), JourneyTab (4), SwarmDashboard, EliteCommercialAgentWorkspace, GroqTelemetryPanel | refs |
| REND-004 | P3 | Kanban: `KanbanCard` memoizado (bom), mas colunas re-renderizam inteiras a cada drag state | CrmBoard/KanbanColumn |

## 3. CWV — estado

- **Não medido** nesta operação (sem Lighthouse/RUM). Metas do prompt (LCP≤2,5s p75, INP≤200ms, CLS≤0,1) registradas como alvo; evidência indireta: carga ≤2,2s no inventário do 14 (ambiente local, não representativo de produção).
- Recomendado: Lighthouse CI por rota prioritária (skill `lighthouse-perf` existe) + RUM via Sentry se já instrumentado (verificar).

## 4. Recomendações priorizadas

1. **P2:** `AbortController` + race-guard + refetch silencioso no `useFetch` central — maior alavanca de render/perf percebida do app inteiro.
2. **P2:** `useMemo` nos `value` dos 5 providers — correção padrão de baixo risco, impacto em todos os consumidores.
3. **P2:** `globIgnores` no Workbox para vendor-3d/vendor-echarts/vendor-excel/vendor-tiptap/vendor-pdf (manter runtime caching seletivo).
4. **P3:** gate reduced-motion no ClickSpark; remover `pino` do optimizeDeps; lazy+decoding em imgs de lista; split do chunk de login da landing (depende de decisão — landing intocável, mas split técnico não muda visual).
