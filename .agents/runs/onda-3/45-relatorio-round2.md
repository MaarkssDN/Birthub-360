# Relatório de execução — ONDA3-45-CRM-AGENDA · ROUND 2 (Agente 45 · Otto)

- MISSÃO: ONDA3-45-CRM-AGENDA Round 2 — corrigir os 5 achados do handoff
  `45-para-04-atividades-agenda-bugs.md` após ampliação de ownership para
  `src/features/activities/**` (decreto do Agente 00).
- AGENTE: 45 — Otto
- BRANCH: `agente/45-crm-agenda-onda3` | WORKTREE: `wt-45-crm-agenda`
- SHA INICIAL da rodada: `8e2c0d1e0` | SHA ATUAL: `2cf644cf0` (+ docs)
- STATUS: concluído

## Correções implementadas (todas dentro do ownership)

### 1. Off-by-one de fuso na criação de atividade — CORRIGIDO em 2 camadas
- **Frontend** (`ActivityList.tsx`): `handleSubmit` agora envia `date` como instante UTC
  completo via `wallTimeInZoneToUtcIso(form.date, form.time, tzDoNavegador)`. Bônus:
  valor default do campo Data e datas dos templates usam data LOCAL
  (`localDateInputValue`) — `toISOString().split('T')[0]` já abria o form no dia errado
  após 21h em SP. `formattedDate` do card corrigido (`${a.date}T12:00:00` sobre ISO
  completo gerava Invalid Date).
- **Backend** (`PrismaActivityRepository.createWithTimeline/updateWithTimeline` e
  `activity.service.create/update`): novo `normalizeActivityDateToUtcIso` trata
  date-only `YYYY-MM-DD` como dia civil no fuso (default America/Sao_Paulo) em vez de
  `new Date()` → UTC. Protege qualquer cliente que ainda envie date-only.
- **Filtro `?date=`**: date-only agora usa `civilDayRangeInZoneToUtcIso` (dia civil SP
  inteiro) em vez de `setHours` no fuso do servidor.

### 2. leadId cross-tenant — CORRIGIDO
- Novo `src/features/activities/infra/leadScopeGuard.ts` → `assertLeadInOrganization`
  (lead existe no tenant e `deletedAt: null`, senão AppError 404).
- Aplicado em `createWithTimeline`, `updateWithTimeline` (quando leadId muda),
  `activity.service.create` e `activity.service.update`.

### 3. ActivityService legado divergente — ALINHADO
- `findAll`/`findRange`: `deletedAt: null` adicionado.
- `delete`: hard delete → soft delete (`deletedAt`), mesmo padrão do repositório.
- `update`: pré-check com `deletedAt: null` (não "ressuscita" deletadas — cobre o snooze).
- `create`/`update`: Activity + TimelineEvent na mesma `prisma.$transaction`
  (mantido o padrão array congelado pelo parecer 15 #40, com biome-ignore).

### 4. feed.ics?owner= arbitrário — CORRIGIDO
- `ActivityController.getIcalFeed`: sem `owner` → próprio usuário; `owner` igual a
  name/email da sessão (case-insensitive) → permitido; owner de terceiro → somente
  ADMIN/GESTOR (hierarquia real via `hasRequiredRole`), senão 403.
- `generateIcalFeed`: match de owner case-insensitive/trim; bug de fuso corrigido —
  `act.time` agora é interpretado como horário de parede America/Sao_Paulo via
  `wallTimeInZoneToUtcIso` (antes `setHours` no fuso do servidor + sufixo `Z`).

### 5. Menores
- snooze em atividade soft-deletada → coberto pelo `deletedAt: null` no update (item 3).
- `timeLabel` em `Calendar.tsx` (`src/features/calendar/**`, fora do ownership): sem
  ação — com a escrita corrigida, novos registros renderizam certo; registros legados
  gravados como meia-noite UTC continuam no dia anterior (correção de dados exigiria
  backfill/migration — proibido nesta onda; decisão do 00 se vira demanda).

## Novos helpers (src/features/crm/tasks/calendar.utils.ts)
`normalizeActivityDateToUtcIso`, `civilDateKeyInZone`, `civilDayRangeInZoneToUtcIso`.

## Testes executados (vitest.unit.config.ts)
- `src/features/crm/tasks/__tests__/calendar.utils.test.ts` — 22/22
- `src/features/activities/presentation/__tests__/ActivityController.test.ts` — 5/5 (novo)
- `tests/unit/features/activities/**` — 17/17 (service 13 + usecases 4)
- `tests/unit/features/automation-triggers.test.ts` — 4/4 (mock $transaction adicionado)
- `tests/unit/prisma/softDeleteActivityTimeline.test.ts` — 3/3
- `tests/unit/db/crm-repositories-n-plus-one.test.ts` — 3/3
- `tests/unit/features/calendar.test.tsx` + `tests/unit/calendar/**` — sem regressão
- `tests/unit/onda4And5Complete.test.tsx` — 14/14
- **Total rodada completa: 83/83 verdes em 10 arquivos**
- `npx tsc --noEmit` → exit 0 | `npx biome check` nos paths tocados → limpo

Não executados: suítes completas (test:unit/integration/e2e) e testes de integração com
banco — ambiente sem DB dedicado nesta rodada; recomendo ao gate de integração cobrir
`tests/integration/activities.test.ts` e `rbac-e2e-crm-write-routes.test.ts` (o POST
/integration continua válido: lead do mesmo tenant passa no novo guard).

## Ressalvas / pendências para o Agente 00
- `GET /api/activities` (listagem) segue sem `requireRole` — qualquer autenticado vê a
  agenda da equipe. Mantido por ser provavelmente intencional (agenda compartilhada);
  confirmar se vira handoff de RBAC.
- `Activity.owner` é texto livre: a checagem self do feed.ics compara nomes — dois
  usuários homônimos no mesmo tenant compartilhariam o "self". Aceitável dado o modelo
  atual; se `owner` virar FK de User, a checagem deve migrar para id.
- Fuso default do backend é America/Sao_Paulo (não há tz por usuário/tenant no schema);
  documentado nos helpers.
