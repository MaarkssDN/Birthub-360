# Auditoria de Verificação — Camada HTTP do Squad 20 (DEM-20261123-001)

- **Agente:** 20 — Ciro (Coordenador Squad 20)
- **Branch/worktree:** `coord/squad-20` @ `C:/Github/Birthub-360-worktrees/squads/squad-20/wt-coord`
- **Base:** `93e82c22024ccc9ca48abad6b29e855cbd4157f9`
- **Tipo:** verificação somente-leitura (coordenação) — nenhum arquivo de código alterado
- **Data:** 2026-11-24

## 1. Objeto: handoff `22→20` (`.agents/handoffs/onda-3/22-para-20-ordem-middlewares-mounts.md`)

Verificação independente de cada achado na base `93e82c220`:

### Item 1 — Auth implícita via `rateLimiters.ts` → **CONFIRMADO**

`server.ts:77` monta `applyRateLimiters(app)` antes de `mountFeatureRoutes(app)` (`server.ts:97`).
Montagens com `authenticateToken` antecipado em `src/bootstrap/rateLimiters.ts` cujos mounts em
`src/bootstrap/routes.ts` não o repetem:

| Rota | rateLimiters.ts | routes.ts |
|---|---|---|
| `/api/intelligence` | `:66` `authenticateToken, aiLimiter` | `:151` só `requireTenant` |
| `/api/agent` | `:69` `authenticateToken, aiLimiter` | `:258` só `requireTenant` |
| `/api/knowledge` | `:74` `authenticateToken, aiLimiter` | `:179` só `requireTenant` |
| `/api/bug-reports` | `:114` `authenticateToken, bugReportLimiter` | `:184` só `requireTenant` |

Fail-closed confirmado por leitura: `requireTenant` rejeita sem `req.user`. Fragilidade residual:
garantia depende de ordem entre dois arquivos sem teste de contrato.

### Item 2 — `authenticateToken` 2× em `/api/prospecting/ocr/**` → **CONFIRMADO**

- `rateLimiters.ts:70`: `app.use('/api/prospecting/ocr', authenticateToken, aiLimiter)`
- `routes.ts:147`: `app.use('/api/prospecting', authenticateToken, requireTenant, prospectingRoutes)` — o mount de prefixo cobre `/ocr`.

Cada request a `/api/prospecting/ocr/*` executa `authenticateToken` duas vezes (2 consultas de
sessão). Correção proposta pelo 22 (espelhar `/api/intelligence`: mount tardio sem auth) é
cirúrgica, mas `routes.ts`/`rateLimiters.ts` não têm dono publicado → ver §3.

### Item 3 — `errorHandler` ecoa query string em `instance` → **JÁ RESOLVIDO na base**

`src/shared/middlewares/errorHandler.ts` (~`:190`):
```ts
const rawInstance = req.originalUrl || req.url || '/';
const instance = rawInstance.split('?')[0] || '/';
```
A query string é removida antes de emitir o campo RFC 7807 `instance`. O achado do 22 foi
endereçado em commit posterior à auditoria dele (baseline `32d07c375`). Nenhuma ação pendente.

## 2. Varredura "erros 5xx residuais" (backlog do coordenador)

`src/shared/middlewares/errorHandler.ts` (dono formal: Agente 01 — `src/shared/AGENTS.md`):

- Taxonomia `ApiErrorCode` estável (15 códigos) derivada de status HTTP real.
- `code`, `requestId` (mesmo id de `x-request-id`), `retryable` (5xx/408/504 retentáveis).
- `isRestrictedEnvironment()` (`:86-93`): NODE_ENV/APP_ENV production|staging → **todo 5xx recebe
  mensagem genérica** (`:106`), `details` de upstream suprimido (`:114`), sem stack no envelope
  (`ApiResponse.stack?: never`).
- `sanitizeStatusCode` limita status a faixa conhecida, fallback 500.

**Conclusão:** sem resíduo crítico de 5xx encontrado na leitura. Pendente apenas cobertura de
teste de regressão (ownership de `tests/**` → Agentes 03/04; handoff recomendado, não emitido
nesta sessão por ser baixa prioridade e depender de deliberação de ownership).

## 3. Bloqueio estrutural que impede correção direta

`src/bootstrap/routes.ts`, `src/bootstrap/rateLimiters.ts` e `src/shared/middlewares/errorHandler.ts`
**não constam na `MATRIZ_PROPRIEDADE.md`**. Os slots 20/21/22 da matriz apontam para
`src/api/**` majoritariamente inexistente (ver handoff `onda-3/20-para-00-ownership-api-inexistente.md`,
ABERTO). Regra de ouro: decisão de ownership exige publicação na matriz, nunca decreto verbal.
Portanto o coordenador registrou evidência e proposta, sem editar código fora de ownership.

## 4. Correção de precisão sobre o handoff `22→25`

`resolveCompositeRateLimitKey` (`src/api/middlewares/rate-limit.ts`, único arquivo de `src/api/`):
o handoff afirma "zero ocorrências fora do próprio arquivo". Verificação: **há 1 import em teste** —
`tests/unit/onda4And5Complete.test.tsx:16,118`. Segue sem nenhum caller de produção (dead code
efetivo em runtime), mas a remoção do arquivo exige também remover/ajustar esse teste — detalhe
relevante para a decisão do Agente 25.

## 5. Encaminhamentos

| # | Ação | Destino |
|---|---|---|
| 1 | Deliberação de ownership `src/bootstrap/**` + `src/shared/middlewares/**` | Agente 00 (handoff `20→00` já aberto — atualizado nesta sessão) |
| 2 | Remover `authenticateToken` redundante do mount `/api/prospecting` (subpath `/ocr`) OU teste de contrato de ordem de middlewares | Aguardando dono de `routes.ts`/`rateLimiters.ts` |
| 3 | Cobertura de teste: ordem de mounts + auth implícita + errorHandler 5xx | Handoff futuro a 03/04 após ownership |
| 4 | Dead code `rate-limit.ts` + ajuste em `onda4And5Complete.test.tsx` | Agente 25 (dono exclusivo do arquivo) |
