# Handoff 22 → 20 — Ordem de middlewares e mounts de rota (auditoria ONDA3-22-CONTROLLERS)

De: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Para: 20 — Core Backend (dono de `src/bootstrap/**`, equivalente funcional a `src/api/index.ts|router.ts`)
Onda: 3 (dem-20261123)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima onda de saneamento HTTP

## Problema

Três observações de robustez na composição global do pipeline (nenhuma é bypass ativo hoje —
verificado fail-closed em todos os casos):

1. **Autenticação implícita via `rateLimiters.ts`** — 5 mounts em
   `src/bootstrap/routes.ts` não declaram `authenticateToken` porque ele já rodou antes em
   `src/bootstrap/rateLimiters.ts`:
   - `/api/intelligence` (rateLimiters.ts:66 → routes.ts:151)
   - `/api/agent` (rateLimiters.ts:69 → routes.ts:258)
   - `/api/prospecting/ocr` (rateLimiters.ts:70 → coberto por routes.ts:147)
   - `/api/knowledge` (rateLimiters.ts:74 → routes.ts:179)
   - `/api/bug-reports` (rateLimiters.ts:114 → routes.ts:184)
   Funciona hoje e é fail-closed (`requireTenant` responde 403 se `req.user` não existir), mas a
   garantia depende de dois arquivos separados permanecerem nessa ordem. Um comentário nos
   mounts ou um teste de contrato de ordem evitaria regressão silenciosa.

2. **`authenticateToken` executa 2× para `/api/prospecting/ocr/**`** — o mount
   `app.use('/api/prospecting', authenticateToken, ...)` (routes.ts:147) cobre também
   `/api/prospecting/ocr`, que já autenticou em rateLimiters.ts:70. Cada request faz duas
   consultas `auth.api.getSession` (1 query de sessão + possível verificação de conta).
   Impacto: latência/DB dobrada só nesse subpath. Mesmo padrão já é evitado para
   `/api/intelligence` (routes.ts:151 usa só `requireTenant`) — estender o mesmo desenho.

3. **`errorHandler` ecoa query string em `instance`** —
   `src/shared/middlewares/errorHandler.ts:190` usa `req.originalUrl` (com query) no campo
   RFC 7807 `instance`. Em rotas como `/api/google/callback?code=...`, um erro devolve a URL
   completa com o `code` OAuth no corpo da resposta (vai para o próprio cliente, risco baixo,
   mas o valor pode ser persistido em logs de frontend/APM). Considerar usar `req.path`.
   (Arquivo é do Agente 01 — registrado aqui por contexto de montagem; o achado detalhado
   está no handoff 22→01.)

## Arquivo(s) envolvido(s)

- `src/bootstrap/rateLimiters.ts` (linhas 66–74, 114, 195)
- `src/bootstrap/routes.ts` (linhas 147–184, 258)
- `src/server.ts` (ordem global — somente leitura)

## Evidência

`.agents/runs/22-onda3-controllers-auditoria.md` no worktree `wt-22-controllers`,
branch `agente/22-controllers-onda3` (SHA base `32d07c375`).

## Alteração necessária

Nenhuma urgente. Recomendado: (a) teste de contrato que garanta "toda rota `/api/*` sem
`authenticateToken` próprio tem auth prévio no rateLimiters ou é pública declarada";
(b) remover o `authenticateToken` redundante do mount `/api/prospecting` para o subpath `/ocr`
ou reordenar.

## Teste esperado

`npm run test:unit` cobrindo inventário de rotas (`tests/unit/shared/openapiRouteInventory.test.ts`
já existe como padrão) + teste de que `/api/prospecting/ocr/*` retorna 401 sem sessão e 200/4xx
de negócio com sessão (sem regressão de auth).

## Contexto adicional

Rotas públicas auditadas (`/api/public/*`, `/api/calendar/book`, webhooks pré-JSON,
`/api/calendar/booking-links` com auth interno) — todas aprovadas, nenhuma assume `req.user`
indevidamente. Detalhes no run report.
