# Handoff — Relatórios executivos e calibragem de forecast (Onda F4)

De: 00 — Coordenador
Para: 04 (CRM/BI) + 10 (SRE/perf) + 23 (custo/perf IA) + 08 (QA)
Onda: F4
Status: em-andamento
Prioridade: normal
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §3.5–3.6, §6

## Problema

O Documento Mestre prevê para P04 "17 relatórios executivos (<800ms),
autópsia Win/Loss, War Room SSE" e para P05 "forecast calibrado MAPE<8%,
health score". É preciso inventariar o que existe de fato em
`/app/reports`, `/app/analytics`, `/app/winloss`, `/app/war-room`,
`/app/forecast`, `/app/metas`, `/app/pipeline_ponderado` e medir a
calibragem contra dados reais.

## Evidência

- `src/features/analytics/` (17 arquivos, PrismaAnalyticsRepository).
- `src/features/predictability/` — contrato honesto já implementado
  (null sem dado), motor em `/api/commercial-intelligence`.
- War Room: telemetria SSE a verificar.

## Alteração necessária

1. 04: produzir checklist dos relatórios executivos existentes vs os 17
   do Documento Mestre; implementar os faltantes prioritários.
2. 10/23: medir p95 dos endpoints de analytics (gate do doc: p95<200ms
   sob k6) e custo dos cálculos de forecast.
3. 08: registrar baseline de MAPE atual com dados de teste.

## Teste esperado

- Checklist 17/17 com status (existe/parcial/ausente).
- Benchmark p95 documentado; MAPE medido.

## Fora de escopo

- Novo design visual; reescrever motor de forecast.
