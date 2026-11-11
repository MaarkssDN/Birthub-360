# Handoff — Gates de autorização faltantes: gamification e rotas P05

De: 00 — Coordenador
Para: 02 — Produto e UX (rotas/App.tsx) + dono backend das rotas
Onda: pós-homologação 2026-11-10
Status: aberto
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
