De: 45 — Otto (Tarefas, Agendas e Atividades)
Para: 00 — Coordenador
Onda: 3
Status: resolvido (missão executada; achados fora do ownership encaminhados via handoff)
Prioridade: normal
Bloqueador-ref: ONDA3-45-CRM-AGENDA
Sprint destino: onda-3

# Relatório de conclusão — ONDA3-45-CRM-AGENDA

Agente: 45 — Otto
Worktree: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-45-crm-agenda`
Branch: `agente/45-crm-agenda-onda3` (baseline `32d07c375`)
Ownership de escrita: `src/features/crm/tasks/**` (contém apenas `calendar.utils.ts`).

## Diagnóstico por item da missão

1. **Falhas reproduzíveis em tarefas (criação/edição/conclusão/exclusão/listagem)**
   - Hub (Bitrix): create/toggle/list implementados e persistem no Bitrix — **aprovado com
     ressalvas** (handoff 45→06: toggle sem ownership check; filtro CREATED_BY esconde tarefas
     delegadas ao usuário).
   - Activity (CRM/Agenda): CRUD persiste no Postgres — **aprovado com bug comprovado**:
     atividade criada via `<input type="date">` (`YYYY-MM-DD`) é gravada como meia-noite UTC e
     renderiza no dia ANTERIOR em America/Sao_Paulo (off-by-one). Handoff 45→04.
   - Prospecting outbound `tasks` (SQLite): CRUD funciona; **autorização intra-tenant falha**
     (`GET /users/:userId/tasks` sem self-check). Handoff 45→05.
   - Exclusão: Activity tem soft-delete (ADMIN/GESTOR); Hub tasks não têm delete;
     prospecting tasks não deletam por design. **Aprovado/não reproduzido** conforme desenho.

2. **Vínculos atividade↔lead/organização**
   - **Bug comprovado**: `leadId` nunca é validado contra `organizationId` → é possível gravar
     Activity apontando para Lead de outro tenant (Activity.organizationId = meu tenant passa
     na RLS; TimelineEvent com leadId estrangeiro viola a policy e derruba a transação ou deixa
     estado inconsistente via `ActivityService` legado). Handoff 45→04 (itens 2 e 3).

3. **Persistência (backend/reflete no reload)**
   - Activities e Hub tasks persistem de verdade (Postgres/Bitrix), reload refaz fetch —
     **aprovado**, exceto o bug de fuso do item 1 que faz o item "aparecer" no dia errado.

4. **Isolamento por tenant**
   - Activity/TimelineEvent têm RLS por `organizationId`/lead — **aprovado na leitura da
     policy**, com a brecha do leadId estrangeiro acima.
   - Hub tasks: isolado pela conexão Bitrix por org — **aprovado cross-tenant**, falha só
     intra-tenant (handoff 45→06).
   - Prospecting tasks: tenant via JOIN `leads.company` — correto; falha de autorização
     intra-tenant (handoff 45→05).

5. **Agenda e histórico de reuniões (meeting/call)**
   - Tipos `Reunião`/`Ligação`/`Visita` são `Activity` — cobertos pelo item 1 (off-by-one) e
     pelo bug de fuso do `feed.ics` (`setHours` no fuso do servidor + sufixo `Z`).
   - `src/features/cadence/**` (agendamento de reunião por cadência, dono Agente 17) —
     verificação superficial apenas (`scheduleMeeting` propaga organizationId/leadId);
     **não auditado em profundidade — dependente de outro agente** se a missão esperar
     cobertura total. Sinalizo para o 00 decidir se abro handoff ao 17.

## Alterações feitas (dentro do ownership)

- `src/features/crm/tasks/calendar.utils.ts` — novo export `wallTimeInZoneToUtcIso(date,
  time?, timeZone='America/Sao_Paulo')`: converte data civil + horário de parede no fuso para
  instante UTC via `Intl` (respeita DST; rejeita data inexistente, horário e fuso inválidos).
  É a peça que falta para corrigir o off-by-one do item 1 — pronta para adoção pelo Agente 04.
- `src/features/crm/tasks/__tests__/calendar.utils.test.ts` — 14 testes (novos + regressão
  dos exports existentes).

## Testes executados

- `npx vitest run -c vitest.unit.config.ts src/features/crm/tasks/__tests__/calendar.utils.test.ts`
  → **14/14 verdes**.
- `npx tsc --noEmit` → **limpo** (exit 0).
- `npx biome check src/features/crm/tasks` → limpo após `--write` (formatação).
- Não rodei `test:unit`/`test:integration` completos (escopo: testes direcionados, 8 agentes
  em paralelo, DB compartilhado).

## Handoffs abertos

- `.agents/handoffs/onda-3/45-para-04-atividades-agenda-bugs.md` (prioridade alto — 5 achados)
- `.agents/handoffs/onda-3/45-para-05-prospecting-tasks-authz.md` (prioridade alto — authz)
- `.agents/handoffs/onda-3/45-para-06-hubtasks-bitrix.md` (prioridade alto — IDOR + filtro)

## Commits

(ver `git log` da branch — commits locais pequenos, sem push/PR/merge)
