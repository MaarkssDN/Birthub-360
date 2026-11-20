# Dashboards e Visualização de Dados

**Birth Hub 360° — Brand System · 06-EXPERIENCIA**

- **Propósito:** documentar os padrões de dashboard e gráficos do produto: componentes, paleta de dados, estados e densidade.
- **Escopo:** `src/features/dashboard/`, `src/components/ui/{KpiCard,StatsGrid,bento/*,CompareTable,CompareBar,DealsGrid,Table,VirtualTable}.tsx`, `src/components/charts/`, `src/shared/constants/chartPalette.ts`, `src/features/analytics/`.
- **Estado da informação:** CONFIRMADO em 2026-11-19.
- **Fontes:** arquivos citados inline + `_FATOS-CANONICOS.md` §8/§10.
- **Relacionados:** `feedback.md`, `acessibilidade.md`, `responsividade.md`.

---

## 1. Arquitetura de dashboard

`src/features/dashboard/components/`:

- **`AdaptiveDashboard.tsx`** — dashboard principal da rota `/app/dashboard`.
- **`SinglePageDashboard.tsx`** — variante single-page; consome `metricReveal`/`metricsContainer` de `motion.ts` (entrada escalonada de KPIs).
- Suporte: `DashboardBuilderModal`, `RealtimeFeed`, `RealtimeCockpitWidget`, `ProductivityHeatmapWidget`, `RevenueSignalOrb`, `DeferredRevenueSignalOrb`, `AiGatewayShowcase`.

## 2. Primitivos de KPI/métrica

| Componente | Papel |
|---|---|
| `KpiCard.tsx` | Card de KPI com tones semânticos via tokens: `brand`, `ink`, `ok`, `gold`, `critical`, `iris`, `cyan` — chips `border-*/text-*/bg-*/10` + glow `color-mix` (linhas 7-40+) |
| `StatsGrid.tsx` | Grid de estatísticas |
| `bento/` | Sistema bento-grid (`BentoCard` com `useReducedMotion`) |
| `PageHeader`/`PageTitleCard`/`CommandCenterHeader` | Cabeçalhos de página |
| `CompareTable`/`CompareBar`, `DealsGrid`, `FunnelBars`, `CalendarHeatmap`, `ChannelDonut`, `Timeline` | Visualizações de domínio |

## 3. Gráficos

- **Libs:** `recharts` (chrome compartilhado documentado em `chartPalette.ts`) e `echarts` (imports em `GlowChart`, `TrendChartCard`, `Billing`, `MetricsChart`, `PerformanceTab`, `CallAnalysisReport`, `Observability`, `src/components/charts/index.tsx`). **Ambas coexistem** — não há wrapper único.
- **Paleta de dados:** `src/shared/constants/chartPalette.ts` — cores validadas contra superfície escura `#0a1022` com ΔE ≥ 9.4 (CVD) e ≥ 20.9 (visão normal):
  - `SINGLE = '#3987e5'` (série única)
  - `SERIES = { created:'#3987e5', won:'#199e70', lost:'#d95926' }` (categórico 1–3)
  - `INK = { muted:'#898781', grid:'#2c2c2a', axis:'#383835' }`
  - `tooltipStyle` consistente (bg `#0d0d0d`, radius 12).
- **Cores semânticas:** tokens `--ok`/`--critical`/`--gold`/`--iris`/`--brand` em chips e trends de `KpiCard` — o KPI usa token, o gráfico usa hex validado (duas camadas intencionais, documentadas no cabeçalho de `chartPalette.ts`).

## 4. Estados obrigatórios

Todo dashboard segue os 4 estados via `OperationalStateContainer` (`loading`/`empty`/`error`/`stale`) — ver `feedback.md`. **Dívida conhecida:** UX-07 — KPI "Volume em Pipeline" exibe `R$ 0` quando backend retorna `null` (`SinglePageDashboard.tsx:82,174-181` faz `?? 0`); contrato correto seria "—" (`db.ts:202-203`).

## 5. Densidade e hierarquia

- `.bh-metric`, `.bh-data`, `.bh-display`/`.bh-headline` (tipografia de KPI em `globals.css`) + IBM Plex Mono para valores tabulares (`--font-mono`/`--font-kpi`).
- KPIs entram com `metricReveal`/`metricsContainer` (stagger 0.09s) — ver `05-MOTION`.
- Títulos de seção usam gradiente de marca (`--grad-brand`), números em mono.

## 6. Regras **[PROPOSTO]**

1. Novo gráfico de série única → `chartPalette.SINGLE`; multi-série ≤3 → `SERIES`; >3 séries → escalar/aggregate antes (**não há paleta >3 validada**).
2. Valor monetizado nulo → "—", nunca `R$ 0` fabricado (lição UX-07).
3. KPI novo → `KpiCard` com tone semântico adequado; não criar card de KPI paralelo.
4. Dashboard novo → registrar rota em `/app/*` com `PageTransition` + `OperationalStateContainer`.

## 7. Lacunas

- `echarts` e `recharts` coexistem sem critério documentado de escolha — **divergência a registrar**.
- Não há design tokens de gráfico (espaçamentos, eixos) além de `chartPalette` — **NÃO VERIFICADO** cobertura completa.
- Storybook cobre apenas Badge/Button/Card/Input — dashboards não têm stories (`_FATOS-CANONICOS.md` §8).
