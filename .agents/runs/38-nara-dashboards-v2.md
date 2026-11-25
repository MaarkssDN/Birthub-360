# Relatório de Execução — Agente 38 · Nara

**Onda:** ONDA-DESIGN-PREMIUM-2026-11-24
**Fase:** 3 — Experiência
**Branch:** `agente/38-nara-dashboards-v2` (base: `agente/37-suri-onboarding-v2`)
**Data:** 2026-11-24

---

## Suposições feitas

1. Dashboards existentes usam Recharts/ECharts com paleta validada (`src/shared/constants/chartPalette.ts`, ΔE testado em CVD) — v2 cria tema paralelo para superfícies navy sem tocar no validado.
2. KPI card v1 (`KpiCard.tsx`) é complexo (tons, som, glow) — v2 é componente novo e focado, sem efeitos sonoros/3D (alinhado ao brief anti-AI-slop).
3. Regra de honestidade de dados aplicada: `isEmpty` renderiza "—" em vez de zero/placeholder.

## Plano executado

- **Etapa 1 — Auditoria:** KpiCard v1, chartPalette.ts (SINGLE/SERIES/INK/tooltipStyle) e uso de recharts/echarts mapeados.
- **Etapa 2 — Charts v2:** `src/components/charts/v2/chartThemeV2.ts` — SERIES_V2 (gold/azul/verde/âmbar/vermelho), INK_V2 (labels ~7:1 sobre navy-800, grid sutil), tooltipStyleV2, REFERENCE_V2 para linhas de meta.
- **Etapa 3 — KPI v2:** `KpiCardV2` — Card v2, label uppercase pequeno, valor em `font-mono` (IBM Plex Mono = tokens de dados da marca), delta com seta+texto+% (cor + ícone, nunca só cor — WCAG 1.4.1), `invertTrend` para métricas onde queda é boa (churn), `isEmpty` → "—".
- **Etapa 4 — Acessibilidade:** delta nunca depende só de cor (seta + sinal + texto); valores numéricos em mono melhoram leitura de dígitos; Card v2 já acessível.
- **Etapa 5 — Adoção:** flag `design.newDashboards` reservada; componentes drop-in por props próprias.

## Arquivos alterados

- `src/components/charts/v2/{chartThemeV2,index}.ts` (novos)
- `src/components/kpi/v2/{KpiCardV2,index}.tsx/ts` (novos)
- `.agents/runs/38-nara-dashboards-v2.md` (este relatório)

## Comandos executados

- `npx tsc --noEmit` → limpo.
- `npx biome lint src/components/kpi/v2/ src/components/charts/v2/` → limpo (warnings restantes são de arquivos v1 pré-existentes, fora do escopo).

## Testes

- Typecheck/lint verdes nos arquivos novos.

## Evidências

- `INK_V2.muted #cbd5e1` sobre navy-800 ≈ 7:1; labels de eixo legíveis.
- Delta usa `success-700/dark:success-400` e `danger-700/dark:danger-400` — pares AA da paleta v2.

## Problemas fora do escopo

- Re-temar os dashboards existentes (AdaptiveDashboard, Analytics, widgets) — iteração por tela com flag `design.newDashboards`.

## Handoffs abertos

- Para agentes de feature/dashboard: usar `KpiCardV2` + `chartThemeV2` nas telas v2; validar contraste final com axe-core na Fase 5.
- Para Agente 34: incluir KPI/chart v2 na rodada axe-core.

## Aprendizados reutilizáveis

- Valor de KPI em `font-mono` (IBM Plex Mono) reforça a constituição tipográfica (mono = dados) e melhora scanability numérica.
- "—" para dado ausente é o padrão honesto que diferencia premium de template.

## Pendências

- Adoção nas telas de dashboard; testes visuais de gráficos na Fase 5.

## Riscos

- Baixo: arquivos novos isolados; chartPalette v1 intocado.
