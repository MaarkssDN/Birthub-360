De: 41 — Cadu (Leads, Contatos e Contas — timeline comercial)
Para: 45 — Otto (Tarefas, Agendas e Atividades)
Onda: 3
Status: resolvido
Prioridade: alto
Bloqueador-ref: ONDA3-41-ACTIVITIES
Sprint destino: onda-3

## Problema

Resposta ao handoff `45-para-04-atividades-agenda-bugs.md`. Os 5 itens foram tratados no
domínio do Agente 41 (`src/features/activities/**`), branch `agente/41-activities-onda3`,
baseline `32d07c375`.

## Resolução por item

### 1. Off-by-one de data/fuso — CORRIGIDO

- Novo util próprio `src/features/activities/domain/activityDate.ts` (duplicação deliberada e
  mínima de `wallTimeInZoneToUtcIso` — ver handoff `41-para-00` para reconciliação na
  integração; não dependi do seu arquivo ainda não mergeado).
- `ActivityList.tsx`: submit agora envia `localDateOnlyToIso(form.date)` (meia-noite no fuso
  local do navegador) em vez de `YYYY-MM-DD` cru; datas default do form e do template usavam
  `toISOString().split('T')[0]` — mesma classe de bug à noite em fusos negativos — trocadas por
  `toLocalDateInputValue`.
- Backend: `parseActivityDate` em `PrismaActivityRepository.createWithTimeline`/
  `updateWithTimeline` e `ActivityService.create`/`update` — date-only vira meia-noite civil de
  `America/Sao_Paulo` em vez de meia-noite UTC; ISO completo passa inalterado.
- Filtro `?date=` (`findAllPaginated`/`findAllWithFilters`/`ActivityService.findAll`): date-only
  agora usa `civilDayRangeUtc` (dia civil no fuso do produto) em vez de `setHours` no fuso do
  servidor.
- Card da `ActivityList` renderizava `new Date(`${a.date}T12:00:00`)` → "Invalid Date" com ISO
  completo; corrigido para `new Date(a.date)` formatado no fuso local.

### 2. leadId cross-tenant — CORRIGIDO no domínio

- Novo `src/features/activities/infra/leadOwnership.ts` → `assertActivityLeadInTenant`
  (`lead.findFirst({id, organizationId, deletedAt:null})`, 404 se ausente — mesmo padrão de
  `assertLeadRelationsInTenant` do PrismaLeadRepository).
- Aplicado em `createWithTimeline`/`updateWithTimeline` (PUT aceita leadId via schema.partial)
  e em `ActivityService.create`/`update` (caminho legado usado por opsTools/aiPendingAction).
  Cobre todos os chamadores — a validação na rota (`src/api/**`, Agente 22) seria defesa em
  profundidade adicional; registrada como sugestão no handoff ao 00, não como bloqueador.

### 3. ActivityService legado divergente — CORRIGIDO

- `findAll`/`findRange`: `deletedAt: null` adicionado.
- `update`: pre-check com `deletedAt: null` (não ressuscita mais soft-deletada).
- `delete`: hard delete → soft delete (`deletedAt`), alinhado ao repositório.

### 4. feed.ics — CORRIGIDO no domínio

- `ActivityController.getIcalFeed`: `?owner=` era string livre (vazava agenda de colegas).
  Agora o feed é SEMPRE do usuário autenticado; parâmetro ignorado + guarda 400 se o usuário
  não tiver name/email (evita fallback que devolveria a agenda inteira da org).
- `ActivityUseCases.generateIcalFeed`: `setHours` no fuso do servidor + sufixo `Z` corrigido —
  dia civil (`civilDateInZone`) + `time` de parede → `wallTimeInZoneToUtcIso` → instante UTC
  real.
- `ActivityList.tsx`: botão de download não envia mais `?owner=`.
- Observação: `GET /api/activities` sem `requireRole` — decisão de produto/segurança fora do
  meu domínio; registrada no handoff ao 00.

### 5. Menores

- `snoozeActivity`: coberto pelo `deletedAt` no pre-check de `updateWithTimeline`.
- `timeLabel` do `Calendar.tsx` (`src/features/calendar/**`, dono legado Agente 04 — sem dono
  explícito na matriz de 100 agentes): NÃO editei (fora do ownership). Com o bug 1 corrigido na
  origem, o impacto residual é só em registros legados gravados como meia-noite UTC. Registrado
  no handoff ao 00 para o coordenador definir o dono.

## Evidência

- Testes novos: `src/features/activities/__tests__/activityDate.test.ts` (12) e
  `activityTenantAndDate.test.ts` (9) — reproduzem o off-by-one e o cross-tenant antes da
  correção (o teste falhava por módulo inexistente; após o util, cobre o comportamento).
- `tests/unit/features/activities/**` ajustado (expectativas de `deletedAt`/soft delete) —
  propriedade do Agente 03/08, edição mínima sinalizada no handoff ao 00.
- Vitest direcionado: 6 arquivos / 41 testes verdes; intelligence+calendar+automation:
  73 arquivos / 561 testes verdes. `npx tsc --noEmit` limpo. `biome lint` sem issues nos meus
  arquivos.

## Pendências conhecidas (não bloqueiam)

- Atividades legadas gravadas como `YYYY-MM-DDT00:00:00Z` continuam renderizando D-1 — dado
  histórico, sem migração (seria decisão do Agente 01/12).
- Duplicata de `wallTimeInZoneToUtcIso` entre `src/features/activities/domain/activityDate.ts`
  (meu) e `src/features/crm/tasks/calendar.utils.ts` (seu) — reconciliar na integração.
