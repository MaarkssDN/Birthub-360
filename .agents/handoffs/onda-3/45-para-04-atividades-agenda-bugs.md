De: 45 — Otto (Tarefas, Agendas e Atividades)
Para: 04 — CRM e BI
Onda: 3
Status: aberto
Prioridade: alto
Bloqueador-ref: ONDA3-45-CRM-AGENDA
Sprint destino: onda-3

## Problema

Investigação de tarefas/atividades/agenda encontrou 5 problemas comprovados por leitura de
código no domínio do Agente 04 (`src/features/activities/**`, `src/features/calendar/**`).
Nenhum arquivo fora de `src/features/crm/tasks/**` foi editado por mim — a correção cabe ao
proprietário.

### 1. Atividade criada pela Agenda cai no dia anterior (off-by-one de fuso) — REPRODUZÍVEL

- `ActivityList.tsx` (`handleSubmit`, ~linha 296): `<input type="date">` produz `form.date` no
  formato `YYYY-MM-DD` e o POST envia esse valor cru em `date`.
- Backend: `PrismaActivityRepository.createWithTimeline` / `activity.service.create` fazem
  `new Date(data.date)`. `new Date('2026-11-23')` SEMPRE resulta em
  `2026-11-23T00:00:00.000Z` (meia-noite UTC — date-only ISO é UTC por especificação).
- Em `America/Sao_Paulo` (UTC-3) esse instante é 22/11 21:00 locais. O calendário agrupa por
  `dayKey(new Date(item.date))` (`src/features/calendar/calendar.util.ts:74-79`), que usa o fuso
  LOCAL do navegador → a atividade aparece em 22/11, um dia antes do escolhido.
- O mesmo erro atinge o filtro `?date=` (`findAllPaginated`/`findAllWithFilters` usam
  `setHours(0,0,0,0)` no fuso do SERVIDOR, não do cliente) e o feed iCal
  (`generateIcalFeed` faz `startDate.setHours(hh,mm)` no fuso do servidor e exporta com sufixo
  `Z`, declarando UTC — horário errado no calendário do usuário).

Correção sugerida (menor): no submit do formulário e/ou no backend, interpretar `YYYY-MM-DD`
(+ `time` opcional) como horário de parede do fuso do cliente, não como UTC. Já existe helper
pronto e testado em `src/features/crm/tasks/calendar.utils.ts`:
`wallTimeInZoneToUtcIso(date, time, 'America/Sao_Paulo')` (novo, Onda 3, com testes em
`src/features/crm/tasks/__tests__/calendar.utils.test.ts`). Ideal: frontend envia ISO completo
via esse helper; backend pode rejeitar/normalizar date-only.

### 2. `leadId` da atividade não é validado contra `organizationId` — vínculo cross-tenant

- `activitySchema` (`src/lib/zod.ts:145`) exige `leadId` mas nada verifica que o Lead pertence
  à organização da sessão.
- `createWithTimeline`/`updateWithTimeline` gravam `Activity{ organizationId: minhaOrg,
  leadId: <lead de outra org> }`. A FK não impede (constraint bypassa RLS), e a policy de
  `Activity` só olha `organizationId` da própria linha (migration
  `20260722020322_enable_rls`, linhas 54-58).
- Consequência: `TimelineEvent` criado com `leadId` estrangeiro viola a policy
  `tenant_isolation_policy` de `TimelineEvent` (leadId IN leads do tenant, linhas 76-82) →
  no caminho do repositório a `$transaction` inteira falha (500 sem atividade); no caminho
  legado `ActivityService.create` a Activity é gravada e o `timelineEvent.create` falha depois
  (estado inconsistente + erro).
- Mesmo no caso "sucesso" (leadId de lead soft-deletado ou de outra org com bypass), a
  atividade fica órfã de lead visível — o `include: { lead }` retorna null pela RLS de Lead.

Correção sugerida: validar `Lead.organizationId === organizationId` (e `deletedAt IS NULL`)
antes de create/update; idealmente também CHECK/trigger ou FK composta no schema (handoff ao
01 se quiserem garantia em banco).

### 3. `ActivityService` legado diverge do repositório (usado por tools de IA)

`src/features/activities/services/activity.service.ts` ainda é usado por
`src/features/intelligence/tools/opsTools.ts` e `aiPendingAction.service.ts`:

- `findAll`/`findRange` NÃO filtram `deletedAt: null` → atividades soft-deletadas pelo
  repositório continuam aparecendo para os agentes de IA.
- `delete` faz hard delete (`prisma.activity.delete`), enquanto o repositório faz soft delete —
  inconsistência de retenção/LGPD.
- `create`/`update` não checam `deletedAt` no update e criam `TimelineEvent` fora de transação.
- `update` usa `where: { id, organizationId }` (OK), mas o repositório usa `where: { id }` no
  update após pre-check — o pre-check não filtra `deletedAt`, então é possível atualizar/
  "ressuscitar" atividade soft-deletada via PUT.

### 4. `feed.ics` aceita `?owner=` arbitrário e vaza agenda da equipe

`ActivityController.getIcalFeed` usa `owner || userName` e `generateIcalFeed` filtra por
`a.owner === owner` — string livre de nome. Qualquer autenticado pode exportar a agenda de
qualquer colega (`?owner=Nome Completo`). Além disso o GET `/api/activities` não tem
`requireRole` (só `authenticateToken`/`requireTenant` em `bootstrap/routes.ts:145`) — confirmar
se listagem irrestra é intencional.

### 5. Menores

- `snoozeActivity` usa `updateWithTimeline`, que não verifica `deletedAt` (item 3).
- `timeLabel` no `Calendar.tsx:66-68`: sem `activity.time`, exibe `toLocaleTimeString` de um
  instante que pode ser 21h do dia anterior por causa do bug 1.

## Arquivo(s) envolvido(s)

- `src/features/activities/components/ActivityList.tsx` (~296-320, 786-795)
- `src/features/activities/infra/PrismaActivityRepository.ts` (createWithTimeline ~118,
  updateWithTimeline ~153, delete ~193)
- `src/features/activities/services/activity.service.ts` (findAll ~51, create ~121, delete ~206)
- `src/features/activities/application/ActivityUseCases.ts` (snooze ~59, generateIcalFeed ~127)
- `src/features/activities/presentation/ActivityController.ts` (getIcalFeed ~106)
- `src/features/calendar/calendar.util.ts` (groupByDay ~74), `src/features/calendar/components/Calendar.tsx`
- `prisma/migrations/20260722020322_enable_rls/migration.sql` (policies Activity/TimelineEvent)
- `src/features/crm/tasks/calendar.utils.ts` (helper `wallTimeInZoneToUtcIso` já disponível,
  de minha propriedade)

## Evidência

Leitura direta dos arquivos acima na branch `agente/45-crm-agenda-onda3` (baseline 32d07c375).
Sem execução de banco nesta investigação (diagnóstico por código); recomendo teste de
integração com dois tenants sintéticos para os itens 2 e 4.

## Alteração necessária

Ver "Correção sugerida" em cada item. Prioridade: item 1 (bug visível diário para todo usuário
BR) e item 2 (integridade/tenancy).

## Teste esperado

- Criar atividade com data D via UI → GET /api/activities?from/to deve retorná-la no dia D no
  fuso America/Sao_Paulo (antes: D-1).
- POST /api/activities com leadId de outro tenant → 400/404, sem linha gravada.
- DELETE → GET não retorna a atividade (soft delete filtrado em todas as leituras).
- feed.ics sem `?owner=` retorna só a agenda do usuário logado.

## Contexto adicional

Escopo de escrita do Agente 45 é somente `src/features/crm/tasks/**`; por isso abro handoff
em vez de corrigir. O helper `wallTimeInZoneToUtcIso` está testado
(`src/features/crm/tasks/__tests__/calendar.utils.test.ts`, 14 testes verdes).
