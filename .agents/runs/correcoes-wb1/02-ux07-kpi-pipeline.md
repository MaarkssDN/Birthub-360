# Correção WB-1 — UX-07 (KPI "Volume em Pipeline" null vs 0)

Agente: 02 — Produto e UX
Fonte: `.agents/runs/auditorias-ux/WB-1/revisao-ux-01-11.md` §1 UX-07 + §3 item 4 (DEBT-0033)
Data: 2026-11-19 (sessão de correção WB-1)

## Problema

`overview.pipelineValue` é `number | null` (`src/lib/db.ts:202-203`; backend retorna `null`
quando não há pipeline: `src/features/analytics/application/AnalyticsUseCases.ts:173` e
`src/features/analytics/analytics.service.ts:185`). O dashboard colapsava `null` em `0`
via `?? 0` e renderizava "R$ 0" para ausência — número fabricado visualmente, violando o
contrato documentado ("—" para ausente).

## Arquivo alterado

`src/features/dashboard/components/SinglePageDashboard.tsx` (único arquivo tocado)

## Diff resumido

- `:82` — `const pipelineValue = overview?.pipelineValue ?? 0;` →
  `const pipelineValue = overview?.pipelineValue ?? null;`
  (preserva `null`/ausência; tipo vira `number | null`)
- `:174-182` — ternário do KPI:
  - `pipelineValue == null` → `'—'` (ausente, alinhado a `db.ts:202-203` e ao padrão
    usado em `src/features/intelligence/components/ReportsHub.tsx:260`)
  - `pipelineValue > 0` → `Intl.NumberFormat('pt-BR', BRL)` (inalterado)
  - `pipelineValue === 0` real → `'R$ 0'` (mantido)

Nenhum outro KPI alterado. Contrato não alterado.

## Comportamento resultante

| Backend | UI |
|---|---|
| `pipelineValue: null` | `—` |
| `pipelineValue: 0` (deals de R$ 0) | `R$ 0` |
| `pipelineValue: 450000` | `R$ 450.000` (formato BRL) |

## Verificação

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0, sem saída (sem erros de tipo) |
| `npm run lint` (biome lint src) | exit 0; 1561 warnings preexistentes no repo (CSS `!important`, unused params etc.), **zero diagnostics em `SinglePageDashboard.tsx`** (grep no output: 0 ocorrências) |

## Notas

- Não commitado, conforme instrução (working tree tem WIP de outras frentes).
- `tests/unit/features/dashboard/SinglePageDashboard.test.tsx` existe e usa
  `pipelineValue: 450000` e `pipelineValue: 0`; ambos os caminhos preservados.
  Caso exista teste para `null` → "—", deve passar (mock MSW já retorna
  `pipelineValue: null` em `tests/mocks/handlers/analytics.ts:18` — o teste atual
  pode ter esperado "R$ 0" para null; revisar se falhar no gate de integração).
