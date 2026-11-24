# Handoff 22 → 01 — Achados em middlewares compartilhados (auditoria ONDA3-22-CONTROLLERS)

De: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Para: 01 — Plataforma, Segurança e Dados
Onda: 3 (dem-20261123)
Status: aberto
Prioridade: normal (itens 1 e 2 são observabilidade/defesa-em-profundidade; nenhum é bypass ativo confirmado)
Bloqueador-ref: nenhum
Sprint destino: próxima onda de saneamento HTTP

## Problema

Auditoria da camada HTTP real (o ownership formal `src/api/controllers/**` + `src/api/middlewares/**`
está vazio neste baseline — `src/api/` só tem `rate-limit.ts`, do Agente 25). Os middlewares
efetivos vivem em `src/shared/middlewares/**` e `src/middleware/**`, sob sua propriedade
(`src/shared/AGENTS.md`). Quatro achados:

1. **`observabilityMiddleware` nunca enxerga `req.user`** — `src/bootstrap/observability.ts:52`
   monta o middleware em `server.ts:96`, ANTES de `mountFeatureRoutes` (`server.ts:97`), e
   `authenticateToken` só executa dentro dos mounts de rota. Resultado: `userId`/`tenantId`
   nos logs "Incoming request" e nos span attributes são sempre `'anonymous'`/`'none'`
   (`src/shared/middlewares/observability.ts:57-66`). Correlação de log por usuário/tenant está
   quebrada para 100% das rotas de feature. Sugestão: ler `req.user` de forma lazy (no momento
   do log de resposta) ou mover o enriquecimento para depois do auth.

2. **`requirePlatformOperator` aceita token via query param** —
   `src/shared/middlewares/requirePlatformOperator.ts:79` lê `req.query.operator_token`.
   Tokens em URL vazam em logs de acesso, histórico do browser, header `Referer` e proxies
   intermediários. Usado em `/metrics` (`bootstrap/observability.ts:35`), `/admin/queues`
   (`bootstrap/bullBoard.ts:91`) e `workerServer.ts`. Manter compatibilidade com scraper
   Prometheus é compreensível, mas recomenda-se deprecar o query param em favor de header
   (ou ao menos não aceitar query quando `NODE_ENV=production` + header presente).
   Fail-closed e `timingSafeEqual` estão corretos — o problema é só o canal de transporte.

3. **`tenantRateLimiter.ts` é código morto com risco latente** — `createTenantRateLimiter`
   não é importado por nenhuma rota. Se for adotado: o `Map` de buckets
   (`src/shared/middlewares/tenantRateLimiter.ts:17`) nunca remove entradas — cada par
   (tenant/IP × path) vira uma chave permanente; em processo longevo é crescimento de
   memória ilimitado. Adicionar expiração/evicção antes de qualquer uso, ou remover o arquivo.

4. **Defesas inertes (código morto)** — `sanitizeRequest`
   (`src/shared/middlewares/sanitizeRequest.ts`, anti prototype-pollution/null-byte) e
   `src/middleware/securityHeaders.ts` (`applySecurityHeaders`) não são montados/importados
   em lugar nenhum. Hoje a proteção real é Zod por rota + Helmet. Ou montar
   `sanitizeRequest` globalmente (antes do `express.json` consumers, após o parser) ou
   remover para não dar falsa sensação de cobertura.

## Arquivo(s) envolvido(s)

- `src/shared/middlewares/observability.ts`
- `src/shared/middlewares/requirePlatformOperator.ts`
- `src/shared/middlewares/tenantRateLimiter.ts`
- `src/shared/middlewares/sanitizeRequest.ts`
- `src/middleware/securityHeaders.ts`
- `src/bootstrap/observability.ts`, `src/bootstrap/bullBoard.ts` (somente leitura — bootstrap é do 20)

## Evidência

Ver `.agents/runs/22-onda3-controllers-auditoria.md` (§2, tabela de middlewares) no worktree
`wt-22-controllers`, branch `agente/22-controllers-onda3`.

## Alteração necessária

Decisão do proprietário: corrigir, remover o código morto ou registrar como débito aceito.
Nenhuma alteração foi feita pelo Agente 22 (fora do ownership).

## Teste esperado

- Se observability for corrigida: teste unitário em `src/shared/middlewares/__tests__/`
  verificando que `userId`/`tenantId` refletem `req.user` quando presente.
- Se query param for removido: ajustar scraper/config de `/metrics` e `/admin/queues`.

## Contexto adicional

`authenticateToken`, `requireTenant`, `requireRole`, `errorHandler`, `validateRequest` e
`requireLeadOwnership` foram auditados e estão **aprovados** (fail-closed, sem vazamento de
stack/PII em produção, hierarquia RBAC canônica).
