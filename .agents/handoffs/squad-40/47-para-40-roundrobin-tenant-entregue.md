# Handoff 47 → 40 — Round-robin determinístico por tenant entregue; integração com store de cursor sugerida

- De: 47 — Dante (Playbooks e Roteamento de Leads — Squad 40)
- Para: 40 — Ravi (Coordenador Squad 40)
- Onda/Demanda: DEM-20261123-001 (`SQUAD40-47-ROUTING`)
- Data: 2026-11-24
- Status: entregue para revisão/auditoria (SHA congelado no run doc)
- Prioridade: médio
- Ownership: `src/features/crm/routing/**`

## Entrega

`src/features/crm/routing/round-robin.ts` ganhou
`selectTenantRoundRobinDeterministic({ tenantId, candidates, cursor })`:

- função pura, sem Redis/DB/estado global — cursor injetado e devolvido em
  `nextCursor`;
- ordenação canônica por `id` (independente da ordem do array);
- offset por tenant via hash FNV-1a estável (`stableHash(tenantId) % n`),
  descorrelacionando o ponto de partida entre tenants;
- filtra `active && !onVacation`; lança erro observável quando não há elegível;
- retorna `TenantRoutingDecision` com trilha de auditoria
  (`reason`, `eligibleRepIds`, `tenantOffset`, `nextCursor`) — sem PII (só ids).

Testes: `src/features/crm/routing/__tests__/tenant-round-robin.unit.test.ts`
(9 casos: determinismo, ordem do array, elegibilidade, equilíbrio exato N/M,
redistribuição justa com mudança de disponibilidade, independência de cursor
entre tenants, ausência, validação de entrada, trilha de decisão).

## Sugestão de integração (fora do ownership do 47)

O consumidor natural é `src/shared/services/leadAssignment.service.ts`
(`assignLeadRoundRobin`, ownership shared/Agente 01) ou
`src/features/crm/services/assignment.service.ts` (re-export). Hoje ele usa
`INCR roundrobin:<org>:last_assigned_index` + `users[nextIndex]` — a nova função
pode ser adotada trocando o índice por `cursor = INCR ... :cursor - 1` e
passando `tenantId = organizationId` e candidatos ordenados por `createdAt`
(com `id` como desempate para estabilidade). Ressalva: o serviço atual ordena
por `createdAt` (ordem de entrada do closer), enquanto a função nova ordena por
`id` — decidir se a ordem canônica deve ser `createdAt,id` exigiria ajuste de
contrato; registrado como decisão pendente para o coordenador/owner do shared.

## Pendências / não escopo

- Playbooks visuais dinâmicos: não implementados nesta fatia (menor fatia de
  valor escolhida foi o algoritmo de roteamento). Candidato a próxima missão.
- Nenhuma escrita fora de `src/features/crm/routing/**`,
  `.agents/runs/leases/`, `.agents/runs/squads/`, `.agents/handoffs/squad-40/`.
