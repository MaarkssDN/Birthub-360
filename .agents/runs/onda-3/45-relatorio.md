# Relatório de execução — ONDA3-45-CRM-AGENDA (Agente 45 · Otto)

- MISSÃO: ONDA3-45-CRM-AGENDA (demanda DEM-20261123-001, Onda 3)
- AGENTE: 45 — Otto (Tarefas, Agendas e Atividades)
- BRANCH: `agente/45-crm-agenda-onda3`
- WORKTREE: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-45-crm-agenda`
- SHA INICIAL (baseline): `32d07c375`
- SHA ATUAL: `f4afaa7dc` (+ commit deste relatório)
- STATUS: concluído (diagnóstico + correção no ownership + handoffs formais)
- Ownership de escrita respeitado: somente `src/features/crm/tasks/**` e artefatos de
  governança exigidos pela missão (`.agents/handoffs/onda-3/`, `.agents/runs/onda-3/`).

## Escopo auditado

Três sistemas de tarefas/agenda coexistem no produto:

1. `Activity` (CRM/Agenda) — `src/features/activities/**`, Postgres + RLS.
2. Tarefas do Hub (Bitrix24) — `src/features/integrations/bitrix/hubTasks.*`.
3. Tarefas do prospecting outbound — `src/features/prospecting/outbound/server/routes/tasks.routes.ts`.

O diretório de ownership `src/features/crm/tasks/` continha apenas `calendar.utils.ts`
(utils de fuso para tarefas). O domínio real vive nos módulos acima — auditados por
leitura de código; defeitos fora do ownership viraram handoffs formais.

## Achados (comprovados por leitura de código)

Detalhamento completo em `.agents/handoffs/onda-3/45-para-00-relatorio-crm-agenda.md`.
Resumo:

- **45→04 (atividades/agenda, prioridade alta)**: 5 achados — off-by-one de fuso na
  criação via `<input type="date">` (`new Date('YYYY-MM-DD')` = meia-noite UTC → dia
  anterior em America/Sao_Paulo); `leadId` não validado contra `organizationId`
  (vínculo cross-tenant); `ActivityService` legado diverge do repositório (sem filtro
  `deletedAt`, hard delete, TimelineEvent fora de transação); `feed.ics?owner=` aceita
  owner arbitrário (vaza agenda de colegas); menores (snooze em soft-deleted,
  `timeLabel` no Calendar).
- **45→05 (prospecting tasks, prioridade alta)**: `GET /users/:userId/tasks` sem
  self-check/requireManager; `POST`/`PUT` aceitam `userId` arbitrário do body;
  `dueDate` sem validação.
- **45→06 (hub tasks Bitrix, prioridade alta)**: `toggle` sem ownership check (IDOR
  enumerável); `list` filtra só `CREATED_BY` (tarefas delegadas invisíveis ao
  responsável); sem delete/edição.
- **45→00**: relatório consolidado + sinalização de que `src/features/cadence/**`
  (dono Agente 17) não foi auditado em profundidade — decisão do coordenador se abre
  handoff ao 17.

## Correção dentro do ownership

- `src/features/crm/tasks/calendar.utils.ts`: novo export `wallTimeInZoneToUtcIso(date,
  time?, timeZone='America/Sao_Paulo')` — converte data civil + horário de parede no fuso
  para instante UTC via `Intl` (offset calculado por fuso, respeita DST; duas passagens
  para borda de transição; rejeita data inexistente ex. 2026-02-30, horário >23:59:59 e
  fuso inválido com erros descritivos). É a peça pronta para o Agente 04 corrigir o
  off-by-one do item 1 do handoff.
- `src/features/crm/tasks/__tests__/calendar.utils.test.ts`: 14 testes (9 novos +
  regressão dos exports existentes).

## Testes executados

| Comando | Resultado |
|---|---|
| `npx vitest run src/features/crm/tasks/__tests__/calendar.utils.test.ts -c vitest.unit.config.ts` | 14/14 verdes |
| `npx vitest run tests/unit/onda4And5Complete.test.tsx -c vitest.unit.config.ts` | 14/14 verdes (inclui regressão dos utils) |
| `npx tsc --noEmit -p tsconfig.json` | exit 0, limpo |
| `npx biome lint src/features/crm/tasks` | limpo |
| Verificação manual `tsx` de `wallTimeInZoneToUtcIso` (SP, NY DST spring/fall, entradas inválidas) | correto |

Não executados: `test:unit`/`test:integration`/`test:e2e` completos (missão pede
testes direcionados; 8 agentes em paralelo; suíte E2E de acessibilidade da Agenda é de
outro ownership e não foi tocada — nenhum arquivo de UI foi alterado, logo sem risco de
regressão no Axe estabilizado pelo Agente 05 na Onda 1).

## Commits

- `68d2949ca` feat(crm/tasks): wallTimeInZoneToUtcIso + testes (onda3-45)
- `f4afaa7dc` docs(handoffs): onda-3 agente 45 — diagnostico tarefas/agenda + handoffs 04/05/06
- `<este commit>` docs(runs): relatório de execução onda-3 agente 45

Sem push, sem PR, sem merge — conforme regras duras.

## Pendências / bloqueios

- Nenhum bloqueio interno. Aguardando receptores dos handoffs 45→04, 45→05, 45→06 e
  decisão do Agente 00 sobre handoff ao Agente 17 (cadence/meeting scheduling).
- Auditoria independente (Agente 09 Silas) pendente sobre o SHA final — fora do meu
  controle.
