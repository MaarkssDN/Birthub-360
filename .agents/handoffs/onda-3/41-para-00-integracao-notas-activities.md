De: 41 — Cadu (Leads, Contatos e Contas — timeline comercial)
Para: 00 — Coordenador
Onda: 3
Status: aberto
Prioridade: normal
Bloqueador-ref: ONDA3-41-ACTIVITIES
Sprint destino: onda-3

## Problema

Notas de integração e itens fora do ownership encontrados durante ONDA3-41-ACTIVITIES
(branch `agente/41-activities-onda3`).

## 1. Duplicata deliberada de `wallTimeInZoneToUtcIso` — reconciliar na integração

- Meu: `src/features/activities/domain/activityDate.ts` (Agente 41).
- Agente 45: `src/features/crm/tasks/calendar.utils.ts` (branch `agente/45-crm-agenda-onda3`,
  ainda não mergeada).
- Lógica idêntica (mesma técnica de `zoneOffsetMs` via Intl, mesmo default
  `America/Sao_Paulo`). Não editei arquivo do 45 por ownership; sugiro que na integração um
  dos dois importe do outro ou um util compartilhado seja promovido (ex.: `src/lib/` —
  definir dono antes).

## 2. `src/features/calendar/**` sem dono na matriz de 100 agentes

O handoff do Agente 45 citava `Calendar.tsx`/`calendar.util.ts`; a matriz não lista
`src/features/calendar/**` para nenhum ID (só `src/lib/integrations/calendar/**` → 57 e
`src/features/crm/tasks/**` → 45). O AGENTS.md local diz "Agente 04" (legado). Itens residuais
possíveis lá (ex.: `timeLabel` caindo no dia anterior para registros legados, `?owner=` no link
do .ics — que agora é ignorado pelo servidor): preciso que o 00 defina o dono ou abra handoff.

## 3. Edições mínimas em `tests/unit/**` (propriedade Agente 03/08)

Para não deixar o gate vermelho, atualizei
`tests/unit/features/activities/services/activity.service.test.ts` (mock de `prisma.lead`,
expectativas de `deletedAt: null` e soft delete). Nenhum assert foi enfraquecido — as
expectativas antigas codificavam o comportamento bugado. Avisar 03/08 se houver objeção.

## 4. Sugestões fora do meu domínio (não bloqueadores)

- `src/api/**` (Agente 22): `activitySchema`/`validateRequest` poderia validar `leadId`
  pertencente ao tenant no boundary HTTP como defesa em profundidade. A correção real já está
  no domínio (repositório + service legado cobrem todos os chamadores, inclusive tools de IA).
- `GET /api/activities` não tem `requireRole` (só authenticateToken/requireTenant em
  `bootstrap/routes.ts:145`, arquivo do Agente 00): confirmar se listagem irrestrita é
  intencional.
- `prisma/**` (Agente 11/12): garantia em banco para `Activity.leadId → Lead.organizationId`
  (CHECK/FK composta) fica como hardening opcional — a validação em aplicação já cobre.

## 5. Ownership matrix vs. missão

A matriz dá ao Agente 41 `src/features/crm/leads/**` e `src/features/crm/contacts/**`, mas
`src/features/crm/contacts/**` não existe no baseline e `src/features/activities/**` não está
listada para nenhum agente (AGENTS.md local diz Agente 04 legado). Segui a missão
(`activities/**` + `crm/contacts/**`); se a matriz quiser registrar `activities/**` formalmente
para o 41, é decisão do 00.

## Evidência

- 4 commits locais na branch; `npx tsc --noEmit` limpo; vitest direcionado verde
  (41 + 561 testes); biome lint limpo nos arquivos do domínio.
- Detalhes por item no handoff `41-para-45-atividades-bugs-resolvidos.md`.
