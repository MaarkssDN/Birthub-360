# RUN — Agente 22 (Hugo) · ONDA3-22-CONTROLLERS

- Runtime executor: Devin (subagente)
- Branch: `agente/22-controllers-onda3` · Base: `32d07c375`
- Worktree: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-22-controllers`
- Escopo declarado: `src/api/controllers/**`, `src/api/middlewares/**`
- Tipo de missão: auditoria + correção de defeitos comprovados no ownership

## 1. Realidade do ownership neste baseline (FATO ESTRUTURAL)

No SHA `32d07c375`:

- `src/api/controllers/` **não existe** (o próprio prompt do papel admite: "src/api/** — sem
  correspondência direta no SHA de referência").
- `src/api/` contém apenas `middlewares/rate-limit.ts`.
- `src/api/middlewares/rate-limit.ts` pertence **exclusivamente ao Agente 25**
  (`.agents/MATRIZ_PROPRIEDADE.md` linha 39 — entrada mais específica que sobrepõe o
  `src/api/middlewares/**` genérico do Agente 22 na linha 36).
- `src/api/index.ts` / `src/api/router.ts` também não existem; o pipeline HTTP real vive em
  `server.ts` + `src/bootstrap/*.ts` + `src/shared/middlewares/*.ts` +
  `src/features/**/routes|presentation` (propriedade de outros agentes: 01, 05, 20, 43 etc.).

**Conclusão de escopo:** o conjunto de arquivos efetivamente gravável pelo Agente 22 neste
baseline é **vazio**. Nenhuma correção de código pôde ser aplicada dentro do ownership —
todos os achados viraram handoffs com evidência. Nenhum arquivo de código foi alterado.

## 2. Diagnóstico por item da missão

### Item 1 — Auditoria de middlewares (bypass auth/tenancy, erro vazando stack/PII, ordem)

Pipeline real auditado (read-only): `src/shared/middlewares/*`, `src/middleware/securityHeaders.ts`,
`src/bootstrap/{security,rateLimiters,webhooks,routes,auth,bullBoard,observability,healthchecks,apiDocs,frontend}.ts`, `server.ts`.

| Middleware / ponto | Veredito | Evidência |
|---|---|---|
| `authenticateToken` (`src/shared/middlewares/authenticateToken.ts`) | **APROVADO** | Fail-closed (401 sem sessão, 403 locked/email não autorizado/sem org), `UNVERIFIED_ROLE` fail-closed, `requestContext.run` propaga tenant ao `next()` (linhas 32–85). |
| `requireTenant` (`authorization.ts`) | **APROVADO** | 403 sem `organizationId`; injeta `req.db` tenant-scoped; fail-closed mesmo se `authenticateToken` não rodou (linhas 12–28). |
| `requireRole` (`requireRole.ts`) | **APROVADO** | 401 se `req.user` ausente; hierarquia canônica única (linhas 16–38). |
| `errorHandler` (`errorHandler.ts`) | **APROVADO com observação** | Sem stack no envelope (`stack?: never`), mascara 5xx em prod/staging, sanitiza statusCode fora de 400–599, RFC 7807 + requestId. Observação baixa: `instance` ecoa `req.originalUrl` **com query string** (pode refletir `?code=` OAuth no corpo de erro para o próprio cliente) e `details` de `AppError` 4xx passa sem filtro em produção — convenção "4xx é seguro" não é enforced. |
| `observabilityMiddleware` (`observability.ts`) | **DEFEITO (handoff)** | Redação de query params sensíveis OK. Porém monta em `applyRequestObservability` (server.ts:96) **antes** de `mountFeatureRoutes` (server.ts:97), e `authenticateToken` só roda dentro dos mounts de rota — logo `userId`/`tenantId` nos logs/spans são sempre `'anonymous'`/`'none'` para todas as rotas de feature. Correlação de log perde usuário/tenant. |
| `sanitizeRequest` (`sanitizeRequest.ts`) | **Código morto** | Não é montado em nenhum lugar (grep: zero imports fora do próprio arquivo/teste). Defesa anti prototype-pollution existe mas está inerte — mitigação real hoje é só o Zod por rota. |
| `validateRequest` (`validateRequest.ts`) | **APROVADO** | Usado amplamente; parse substitui body/query/params; fallback para `req.query` read-only correto. |
| `tenantRateLimiter` (`tenantRateLimiter.ts`) | **Código morto + risco latente** | `createTenantRateLimiter` não é usado por nenhuma rota. Se vier a ser usado: `Map` de buckets nunca expira entradas — crescimento de memória não limitado por chave tenant+path. |
| `requirePlatformOperator` (`requirePlatformOperator.ts`) | **DEFEITO (handoff)** | Aceita token via **query param** `?operator_token=` (linha 79) — vaza em logs de acesso, histórico do browser, header Referer e proxies. Usado em `/metrics`, `/admin/queues` e `workerServer`. Fail-closed e `timingSafeEqual` estão corretos. |
| `applySecurityHeaders` (`src/middleware/securityHeaders.ts`) | **Código morto** | Zero imports; Helmet (`bootstrap/security.ts`) já cobre os mesmos headers com CSP mais restritiva. |
| `rate-limit.ts` (`src/api/middlewares/`, dono: Agente 25) | **Código morto** | `resolveCompositeRateLimitKey` não é importado por nenhum arquivo — o rate limiting real é `express-rate-limit` em `bootstrap/rateLimiters.ts`. Handoff ao 25. |
| CORS/security edge (`bootstrap/security.ts`) | **APROVADO** | `assertAllowedOriginsConfigured` fatal em prod; CORS sem wildcard de esquema; trust proxy + rewrite de XFF documentado; csrfGuard presente. |
| Ordem global (`server.ts`) | **APROVADO** | security → metrics → rateLimiters → webhooks pré-JSON → express.json → docs/health → auth → BullBoard → observability → feature routes → frontend → errorHandler por último. Correta. |

### Item 2 — Controllers: validação Zod não aplicada, IDOR, mass assignment

`src/api/controllers/**` não existe; controllers reais estão em `src/features/**` (outros donos).
Amostragem dos pontos de risco:

- Spreads `...req.body` encontrados (`prospecting.routes.ts:137,263,283`, `agentBuilder.routes.ts:46`,
  `agentBus.routes.ts:75`, `memory.routes.ts:76`, `ai-suite.routes.ts:512`, `universalEcosystem.routes.ts:185`,
  `SettingsController.ts:36`, `intelligence.routes.ts:273`, `agent.routes.ts:326`) — **todos auditados
  ocorrem DEPOIS de `validateRequest(schemaZod)`**, que substitui `req.body` pelo resultado do parse
  (chaves desconhecidas são stripped pelo Zod). **Mass assignment: não reproduzido** nesses pontos.
- Exceção real: `POST /api/prospecting/promote` (`prospecting.routes.ts:236`) **não tem schema Zod** —
  valida só `tradeName`/`source` manualmente e espalha `...req.body` cru em `promoteToCrm`.
  `POST /api/prospecting/enrich-cnpj` e `POST /api/prospecting/enrich` também não têm
  `validateRequest` (só checagem manual de campos). → handoff ao Agente 05.
- IDOR em tasks (`src/features/prospecting/outbound/server/routes/tasks.routes.ts`, dono Agente 43):
  código confirmado com os problemas que o Agente 45 apontou — `GET /users/:userId/tasks` (linha 169)
  permite a qualquer autenticado ler tarefas de **qualquer userId** dentro da company (sem
  self-check nem `requireManager`); `POST /leads/:id/tasks` (linha 37) aceita `userId` arbitrário do
  body sem validar que pertence à company; handlers devolvem `err.message` cru em 500.
  **Agravante de contexto:** neste baseline o módulo inteiro está inalcançável — `apiRouter` do
  outbound não é montado em lugar nenhum e `/api/outbound` responde 503 via
  `unavailableLegacyModule` (`bootstrap/routes.ts:212`, `legacyModuleGate.ts`). IDOR é real no
  código, mas sem superfície de exploração hoje. → handoff ao Agente 43 com evidência.

### Item 3 — Rotas públicas/webhook sem auth assumindo `req.user`/tenant

Verificadas uma a uma:

| Rota pública | Mount | req.user/tenant assumido? | Veredito |
|---|---|---|---|
| `/api/public/demo-leads` | `publicLeadRoutes` | Não — tenant via `LANDING_LEAD_ORGANIZATION_ID`, Zod + honeypot + IP hash | APROVADO |
| `/api/public/lead-capture` | `publicLeadCaptureRouter` | Não — validação Zod completa, consent obrigatório | APROVADO |
| `/api/public/data-subject-requests` | `dsrRequestRoutes` | Não — anti-enumeração, respostas genéricas | APROVADO |
| `/api/public/proposals/:token/view` | `crm360PublicRoutes` → `viewPublicDocument` | Não — `publicToken` uuid é a credencial | APROVADO |
| `/api/calendar/book/:slug` | `publicBookingRouter` | Não — slug opaco + bypass RLS justificado + requestContext por link.organizationId | APROVADO |
| `/api/calendar/booking-links` | `privateBookingRouter` | Sim, mas **seguro**: `privateBookingRouter.use(authenticateToken, requireTenant)` interno (booking.routes.ts:97) | APROVADO |
| Webhooks pré-JSON (birth-voice, 3cx, voice-result, email, signature, bitrix, chatwoot, stripe) | `mountPreJsonWebhooks` | Nenhum usa `req.user` (grep zero ocorrências nos `*.webhook.ts`); autenticidade por HMAC/segredo por conexão | APROVADO (handlers são de outros donos; assinatura verificada nos próprios arquivos) |
| Mounts sem `authenticateToken` explícito: `/api/intelligence`, `/api/agent`, `/api/knowledge`, `/api/bug-reports`, `/api/prospecting/ocr` | `routes.ts` | Não assumem indevidamente — `authenticateToken` roda antes em `rateLimiters.ts:66,69,70,74,114`; e mesmo se a ordem quebrasse, `requireTenant` é fail-closed (403 sem `req.user`) | APROVADO (com observação de fragilidade → handoff 20) |

**Bug real de "rota pública assumindo auth": NÃO REPRODUZIDO.**

### Item 4 — Correções dentro do ownership

Nenhuma aplicável: ownership efetivo vazio (ver §1). Nenhum arquivo de código alterado.

## 3. Achados que viraram handoff

1. **→ Agente 01** (`src/shared/middlewares/**`, `src/middleware/**`): observability monta antes do
   auth (userId/tenantId sempre anônimos); `requirePlatformOperator` aceita token por query param;
   `tenantRateLimiter` Map sem expiração e código morto; `sanitizeRequest` e
   `src/middleware/securityHeaders.ts` mortos (defesa em profundidade inerte).
2. **→ Agente 20** (`src/bootstrap/**`): dependência implícita de `authenticateToken` dentro de
   `rateLimiters.ts` para 5 mounts (fail-closed, mas frágil); double `authenticateToken` em
   `/api/prospecting/ocr` (perf); `errorHandler.instance` ecoa query string.
3. **→ Agente 43**: IDORs confirmados em `tasks.routes.ts` (GET /users/:userId/tasks sem
   self/manager check; POST aceita userId arbitrário; err.message vazado) — módulo hoje
   inalcançável (503), corrigir antes de reabrir.
4. **→ Agente 05**: `POST /api/prospecting/promote`, `/enrich-cnpj`, `/enrich` sem schema Zod;
   `/promote` espalha body cru (mass assignment potencial).
5. **→ Agente 25**: `src/api/middlewares/rate-limit.ts` (`resolveCompositeRateLimitKey`) é código
   morto — nenhum import no repositório.

## 4. Comandos executados / testes

- Auditoria 100% estática (leitura + grep). Nenhum teste executado: **não houve alteração de
  código**, logo não há regressão a testar. `npx tsc --noEmit`/`lint` não se aplicam a docs-only,
  mas o worktree permanece no SHA base `32d07c375` + commits de documentação.
- Greps de verificação: mounts de auth em `bootstrap/routes.ts`/`rateLimiters.ts`, uso de
  `req.user` em rotas públicas/webhooks, spreads de `req.body`, imports dos middlewares "mortos".

## 5. SHA final

Ver `git log` da branch — commits contêm apenas `.agents/runs/` + `.agents/handoffs/onda-3/`.
