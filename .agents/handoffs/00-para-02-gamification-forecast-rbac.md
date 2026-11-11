# Handoff — Gates de autorização faltantes: gamification e rotas P05

De: 00 — Coordenador
Para: 02 — Produto e UX (rotas/App.tsx) + dono backend das rotas
Onda: pós-homologação 2026-11-10
Status: resolvido
Prioridade: normal
Sprint destino: próximo ciclo

## Problema

Duas lacunas de autorização encontradas na auditoria funcional
(relatório `.agents/runs/2026-11-10-pos-homologacao-relatorio-00.md`):

1. **Gamificação sem `requireRole`:**
   - Backend: `src/features/gamification/routes/gamification.routes.ts`
     montado em `bootstrap/routes.ts:195` apenas com
     `authenticateToken + requireTenant` — sem `requireRole`. Qualquer
     usuário autenticado do tenant lê leaderboard/coaching de todos os
     vendedores.
   - Frontend: `/app/gamification` e `/app/war-room` em `App.tsx`
     (~linhas 472/481) sem `RequireRole`.

2. **P05 Forecast/Metas/Pipeline Ponderado sem `RequireRole` no frontend:**
   - `App.tsx` ~linhas 555–557 — backend `/api/commercial-intelligence`
     exige `COMMERCIAL_INTELLIGENCE_ROLES` (ADMIN/GESTOR), mas o frontend
     não tem guard → usuário sem papel recebe 403 cru dentro da tela
     (mesmo padrão já corrigido em outras rotas).

## Evidência

- `gamification.routes.ts`: grep sem `requireRole`; mount em
  `routes.ts:195` só com auth+tenant.
- Auditoria P04: rotas P05 listadas sem `RequireRole` em `App.tsx`.

## Alteração necessária

- Decidir o papel exigido para gamification (provável: autenticado basta
  para leaderboard público-interno; coaching individual pode exigir mais)
  e aplicar `requireRole` coerente no backend + `RequireRole` no frontend.
- Adicionar `RequireRole(COMMERCIAL_INTELLIGENCE_ROLES)` (ou equivalente)
  nas 3 rotas P05 do `App.tsx` — `App.tsx` é do Agente 02.
- Se backend de gamification precisar de role, abrir handoff ao dono do
  router (provável 04/CRM-BI ou 01).

## Teste esperado

- Usuário SDR sem papel de gestão acessa `/app/forecast` → redirect/negado
  antes da chamada (não 403 cru).
- Usuário sem permissão chama `GET /api/gamification/leaderboard` → 403
  se o papel for restrito.

## Contexto adicional

- `RequireModuleAccess` e `RequireRole` já existem e são o padrão —
  replicar o uso de `commercial_intelligence` (App.tsx ~493–500) como
  referência.

## Resolução (2026-11-11, executado pelo Agente 00 sob ORDEM 04)

Decisão aplicada — menor privilégio sem bloquear vendedores:

1. **Gamificação backend** (`GamificationController.ts`): `/profile` e
   `/coaching` aceitavam `?seller=` irrestrito — qualquer autenticado lia
   dados individuais de colegas. Agora `resolveSellerScope` limita a
   consulta ao próprio nome da sessão para papéis fora de ADMIN/GESTOR
   (gestão mantém consulta irrestrita). `/leaderboard` permanece aberto
   a autenticados — é dado compartilhado do tenant, uso legítimo de SDRs.
   Nome do vendedor resolvido via `user.name` quando presente, senão
   `prisma.user.findUnique`.
2. **Frontend P05** (`App.tsx`): `forecast`, `metas` e
   `pipeline_ponderado` agora usam `RequireRole(COMMERCIAL_INTELLIGENCE_ROLES)`
   — backend já exigia ADMIN/GESTOR; o guard evita 403 cru em URL direta.
3. **War Room**: mantido sem gate — `WarRoomArenaService` não tem rotas
   HTTP (simulação client-side, sem dados de outros usuários); bloqueá-lo
   não protegeria nada real. Registrado como simulação na matriz da O07.
4. **Gamification frontend**: sem `RequireRole` — leaderboard/coaching
   são uso legítimo de todos os papéis de vendas; a proteção real ficou
   no escopo de seller no backend.

Testes: `tests/unit/features/gamification/gamification.routes.test.ts`
(+4 casos de escopo por papel), `tests/integration/features/gamification/`
(12/12), `npx tsc --noEmit` limpo.
