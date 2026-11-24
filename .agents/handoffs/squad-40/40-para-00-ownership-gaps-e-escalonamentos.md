# Handoff 40 → 00 — Pendências de ownership e escalonamentos do Squad 40

- De: 40 — Ravi (Coordenador Squad 40)
- Para: 00 — Astra (Coordenador Global)
- Onda/Demanda: DEM-20261123-001 · topologia de squads
- Data: 2026-11-24
- Base: `93e82c220` (`integracao/onda-3-dem20261123`)
- Status: aberto
- Prioridade: alto (ownership gaps bloqueiam remediação de IDOR e novas missões)
- Evidência: `.agents/handoffs/squad-40/00-consolidacao-handoffs-onda3.md`;
  pareceres `.agents/reviews/09-dem-20261123-slot4{0,1,2,3,4,5}-*.md`

## 1. Publicação de ownership já regularizada por parecer (MATRIZ_PROPRIEDADE.md)

Os pareceres do Agente 09 regularizaram ownerships que ainda não constam na matriz.
Solicito publicação formal:

| Path | Owner vigente (por parecer) | Parecer |
|---|---|---|
| `src/features/crm/components/**` | 40 — Ravi | `09-dem-20261123-slot40-f3fc2f203` |
| `src/features/activities/**` | 41 — Cadu | `09-dem-20261123-slot41-59738d5cf` |
| `src/features/prospecting/**` | 43 — Amon | `09-dem-20261123-slot43-2fc7570d0` |
| `src/features/cadence/**` | 44 — Lola (além de `crm/cadences/**`) | `09-dem-20261123-slot44-aeb9004f4` + `44-para-00-ownership-cadence-fix.md` |

## 2. Ownership gaps SEM dono (decisão necessária)

1. **`src/features/calendar/**`** — citado por 41 (residual: `timeLabel` legado,
   `?owner=` do .ics) e 45. Candidatos: 45 — Otto (agenda) ou 57 — Nico
   (integrações de calendário, squad 50).
2. **`src/features/integrations/bitrix/hubTasks.routes.ts` +
   `service/hubTasks.service.ts`** — IDOR confirmado em `POST /hub-tasks/:id/toggle`
   (sem verificação CREATED_BY/RESPONSIBLE_ID/role; IDs Bitrix enumeráveis) e filtro
   `CREATED_BY` que torna tarefas delegadas invisíveis. Evidências:
   `onda-3/45-para-06-hubtasks-bitrix.md`, `onda-3/43-para-50-hubtasks-bitrix-authz.md`.
   Candidatos: 50 — Atlas (coordenação) / 51 — Bela. Fora de `src/lib/integrations/**`,
   portanto fora da propriedade atual do Squad 50.
3. **`src/features/crm360/**` e `src/components/CrmBoard.tsx`** — sem owner; abrigam a
   semântica real de estágios do funil (transições sem máquina de estados, campos de
   fechamento — handoff `onda-3/42-para-04-kanban-transicoes-sem-maquina-de-estados.md`).
   Candidato natural dentro do squad: 46 — Sofia (forecast/metas conhece ganho/perda),
   ou squad-30 se a prioridade for o componente compartilhado.

## 3. Decisões de produto pendentes (não-bloqueantes para código)

- **Gatilho de cadência em mudança de estágio de Deal** (`onda-3/42-para-44-...`):
  sem contrato formal; mantido como débito. Se aprovado, definir payload
  (dealId/fromStageId/toStageId/tenantId), ponto de emissão (pós-commit em deals) e
  idempotência.
- **Reabertura de `unavailableLegacyModule('outbound')`** (`src/bootstrap/routes.ts:212`):
  os IDORs de `prospecting/outbound/.../tasks.routes.ts` já estão corrigidos e aprovados
  (`2fc7570d0`), mas o módulo segue inacessível. Depende também da decisão sobre
  rate-limiting (ver handoff 40→25).
- **Filtro do widget hub-tasks**: "minhas tarefas delegadas a mim" vs "minhas delegações"
  — decisão de produto (ver `45-para-06`).

## 4. Pedido de encaminhamento

- Itens §1 e §2.1/§2.3: publicação/decisão de ownership (MATRIZ_PROPRIEDADE.md é do 00/Astra).
- Item §2.2: designar owner e rotear handoffs `45-para-06`/`43-para-50` ao squad correto.
- Item §3: registrar decisões de produto no backlog do squad correspondente.
