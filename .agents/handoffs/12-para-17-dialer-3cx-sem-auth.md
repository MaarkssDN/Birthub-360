# Handoff — `/api/dialer-3cx/*` é um app Express sem auth nem tenant

De: 12 — Voz e Telefonia
Para: 17 — Cadência Multicanal e Ciclo de Receita
Onda: F2
Status: resolvido
Prioridade: bloqueador (para reabertura do gate `dialer-3cx`)
Referência: `.agents/handoffs/12-para-00-voicehub-tenancy-auditoria.md` e
`.agents/handoffs/00-para-12-17-voicehub-reactivacao.md` item 4 (decisão sobre
o alias dialer→cadence)

## Problema

`src/features/cadence/dialer/interface/http/server.ts` (`createServer`) monta
`healthRoutes`, `campaignsRoutes`, `leadsRoutes`, `dncRoutes` **sem nenhum
middleware de autenticação e sem escopo de tenant** — as ports
(`CampaignRepository`, `DncRepository`, `ImportLeads`) não recebem
`organizationId`/tenant em assinatura nenhuma. É um app standalone que nunca
foi desenhado para HTTP multi-tenant.

O mount antigo em `src/bootstrap/routes.ts` era um placeholder que só chamava
`next()` (nunca serviu rotas de verdade). Se alguém montar `createServer()` em
`/api/dialer-3cx` — mesmo atrás de `authenticateToken`/`requireTenant` — o auth
externo passa e as rotas internas continuam públicas entre tenants (e o
`GET /health` vaza info de infra).

## Arquivo(s) envolvido(s)

- `src/features/cadence/dialer/interface/http/server.ts`
- `src/features/cadence/dialer/interface/http/routes/{campaigns,leads,dnc,
  health}.routes.ts`
- `src/features/cadence/dialer/application/ports/*` (assinaturas sem tenant)

## Alteração necessária

Decidir o destino oficial do discador 3CX (o handoff do 00 pede explicitamente
essa decisão — "confirmar se o discador 3CX entra no escopo ou é cortado"):

1. Se entra: adicionar auth (reusar `authenticateToken`/`requireTenant` do app
   ou um middleware de tenant) e propagar `organizationId` por todas as ports/
   use-cases/repositories — hoje nada disso existe.
2. Se é cortado: remover `createServer`/rotas mortas ou documentar como
   interno-only, e registrar a decisão para o 00 remover o gate.

## Teste esperado

- Todo endpoint de dados exige sessão e retorna apenas dados do tenant da
  sessão; sem sessão → 401/403.

## Resolução (Agente 00, 2026-11-13)

Decisão: **CORTADO**. O diretório `src/features/cadence/dialer/` inteiro
(39 arquivos: server, rotas campaigns/leads/dnc/health, ports, migrations,
scheduler) foi removido na branch `agente/17-dialer-3cx` (commit `32c97ad1e`),
merge `18b3114f1` em `integracao/coordenador-20261112`. Grep confirmou zero
referências externas ao diretório; `npx tsc --noEmit` limpo após a remoção.

Justificativa: o discador 3CX nunca foi desenhado para HTTP multi-tenant
(sem auth, sem organizationId em nenhuma port) e não tem consumidores
montados — manter seria manter superfície insegura latente. Se o produto
quiser discador 3CX no futuro, deve ser redesenhado sobre o voice-hub
(Agente 12) com tenancy nativa, não ressuscitar este legado.
