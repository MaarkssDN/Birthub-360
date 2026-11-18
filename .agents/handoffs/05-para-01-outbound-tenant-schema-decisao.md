# Handoff 05 → 01 — Débito de tenant no outbound legado (schema + decisão)

- **De:** 05 — Prospecção
- **Para:** 01 — Plataforma, Segurança e Dados
- **Onda:** Onda 1 (pós-PR #323)
- **Status:** aberto
- **Prioridade:** alto (bloqueia reabertura do módulo `/api/outbound`)
- **Bloqueador-ref:** parecer 24 PR #323 (`.agents/reviews/24-review-pr323-tenant-scope-outbound.md`)
- **Sprint destino:** próxima onda de reabertura do outbound

## Problema

O router `/api/outbound` legado foi endurecido com `requireTenantScope` + filtros `company`
(PR #323), mas restam dois débitos que exigem schema ou decisão de modelo do Agente 01:

1. **`chat_sessions` / `chat_messages` sem coluna de tenant nem de usuário** — qualquer
   sessão autenticada de qualquer company lê todas as conversas do chat legado
   (`chat.routes.ts`, gap já documentado no código). Correção exige migration
   (adição de coluna `company`/`organization_id` + backfill) — integrações não criam
   migrations (AGENTS.md §15).
2. **`POST /db/query` executa SQL arbitrário como `admin` sem escopo de tenant**
   (`system.routes.ts`) — decisão de modelo necessária: restringir a papel global
   explícito, exigir confirmação, ou aposentar a rota antes da reabertura do módulo.
   Comentário de débito já registrado no código.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/chat.routes.ts`
- `src/features/prospecting/outbound/server/routes/system.routes.ts` (`/db/query`)
- `prisma/schema.prisma` / `prisma/migrations/**` (somente Agente 01)

## Evidência

- Parecer 24 PR #323, achados [MÉDIO] chat e decisão sobre `/db/query`.
- Módulo inteiro atrás de `unavailableLegacyModule('outbound')` → 503 em produção;
  nenhum consumidor frontend. Débitos são latentes, não exploráveis hoje.

## Alteração necessária

1. Decidir e, se aplicável, criar migration adicionando coluna de tenant em
   `chat_sessions`/`chat_messages` (e avaliar `SearchRun` se um dia for persistido —
   hoje é em memória e já filtra por `request.company`).
2. Decidir o destino de `POST /db/query` (restringir papel / confirmar / aposentar).
3. Atualizar handoff `12-para-05-outbound-api-legado-tenancy.md` quando decidido.

## Teste esperado

- Teste cross-tenant provando que sessões de company A não leem chats de company B.
- Decisão documentada sobre `/db/query` no handoff.

## Contexto adicional

O restante dos gaps altos do parecer já foi corrigido neste PR: bypass de admin no
`POST /prospect` (company agora sempre da sessão), `GET /search-runs/:id` com filtro
de tenant via `request.company`, e 403→404 em `users/:userId/leads`. Cobertura
SonarQube ampliada em `tenantScope.test.ts` (16 testes).
