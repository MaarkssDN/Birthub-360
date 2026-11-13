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

## Resolução (parcial — Agente 04, 2026-11-12)

**Item 1 do handoff (checklist 17 relatórios): CONCLUÍDO.**
O inventário `docs/architecture/RELATORIOS-EXECUTIVOS-INVENTARIO.md` (commit `37e968c68`, Onda F4) já continha o checklist dos 17 relatórios do Documento Mestre com status e evidência: 16 com endpoint próprio + `bitrixSyncHealthReport` parcial (só sub-métrica de `/crm-quality`).

**Item "implementar os faltantes prioritários" (parcela do 04): PARCIALMENTE executado.**
- ✅ Implementado: `GET /api/commercial-intelligence/bitrix-sync-health` — endpoint dedicado do 9º relatório (era o único "Parcial" do checklist). Novo `CommercialIntelligenceUseCases.bitrixSyncHealth` reutiliza `computeBitrixSyncHealth` sobre todos os negócios abertos do funil Negócio (sem filtro comercial — saúde de sincronização é operacional). Rota em `commercialIntelligence.routes.ts`, controller, entrada em `docs/openapi.yaml` (gate `verify:openapi-drift` verde) e 2 testes unitários novos (caminho com/sem conexão Bitrix, exclusão de negócios fechados). Checklist atualizado para **17/17 existem**.
- ⏳ Restantes — fora do alcance cirúrgico desta execução / dependência de outros agentes:
  - **War Room executivo SSE** (ausente — `/app/war-room` hoje é arena de gamificação, semântica diferente): feature nova que exige decisão de produto/UX → handoff para 02/03 + 00.
  - **Win/Loss autopsy estatística por segmento/concorrente** (hoje só análise em prosa via IA): fundação existe (`lossTaxonomy.ts`, `/ai/loss-reason-analysis`); implementação estatística é item de produto → registrar como follow-up.
  - **SLA <800ms / benchmark p95**: atribuído a 10/23 no próprio handoff.
  - **MAPE<8% medido em dados reais**: depende do worker semanal de snapshot em produção (infra 10/16) + baseline de 08.

**Status mantido `em-andamento`** até os itens multi-agente acima serem endereçados; a parcela do Agente 04 está implementada e com gates verdes (`tsc`, `lint`, vitest 266/266 nos módulos tocados, openapi-drift, architecture).
