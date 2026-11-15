# Auditoria 2026-11-15 — Agentes 14/18: Ambiente de Execução, Test Harness, Contratos, API e Documentação Viva

**Demanda:** DEM-20261115-001 (auditoria geral orquestrada pelo Agente 00)
**Escopo:** somente leitura. Nenhum arquivo de código foi modificado; a única escrita é este relatório.
**Base auditada:** working tree de `C:\Github\Birthub-360` (branch corrente, estado de 2026-11-15).

---

## 1. ELOGIOS (evidências verificadas)

1. **`server.ts` deixou de ser monolítico.** O arquivo tem 133 linhas e é apenas orquestração de bootstrap: cada preocupação vive em `src/bootstrap/*.ts` (`security.ts`, `rateLimiters.ts`, `webhooks.ts`, `observability.ts`, `apiDocs.ts`, `healthchecks.ts`, `auth.ts`, `bullBoard.ts`, `routes.ts`, `frontend.ts`, `workers.ts`, `shutdown.ts`, `appServices.ts`, `dbRoleCheck.ts`). A ordem do pipeline HTTP está documentada em comentários linha a linha (`server.ts:70-103`) e é legível de cima a baixo.

2. **Gate de deriva OpenAPI existe, é recursivo e roda no CI.** `scripts/verify-openapi-drift.ts` (443+ linhas) faz dois passes: (a) prefixos montados no composition root vs. `docs/openapi.yaml`; (b) resolve recursivamente `router.use('/sub', outroRouter)` dentro de routers de feature e cruza **path+método** exatos, com `Set` anti-ciclo e regra "pula quando não resolve com confiança" para evitar falso positivo (`scripts/verify-openapi-drift.ts:233-308`). Está ligado no CI em `.github/workflows/ci.yml:234` (`npm run verify:openapi-drift`) e tem 5 suítes de teste próprias em `tests/unit/contracts/` e `tests/unit/shared/`. **Execução real nesta auditoria: `✅ Nenhuma deriva estrutural encontrada` — 80 prefixos montados, 506 paths documentados, 78 arquivos de router resolvidos** (`scripts/verify-openapi-drift.ts` rodado via `npx tsx`).

3. **`OverviewMetrics` foi unificado em fonte única.** `src/shared/contracts/analytics.contract.ts:6` é a fonte canônica, reexportada por `domain/Analytics.ts:1-3`, `analytics.service.ts:9,44` e `analytics.api.ts:2,4` — exatamente o padrão pedido pelo prompt do Agente 18.

4. **Existe contract test real Zod↔OpenAPI.** `tests/unit/shared/contracts/lead-openapi-contract.test.ts` compara `schemas.LeadStatus.enum` com `LEAD_STATUS` do Zod e as chaves de `LeadInput` com `leadSchema.shape` — o modelo a estender para os demais 500+ paths.

5. **Autenticação/tenancy por mount é consistente e explícita.** `src/bootstrap/routes.ts:86-282` monta ~80 prefixos, todos com `authenticateToken` + `requireTenant` (ou `requireRole` adicional para módulos executivos: `commercial-intelligence` em `routes.ts:160-166`, `copiloto-ia` em `170-176`, `usage` ADMIN/GESTOR em `195-201`, `api-keys` ADMIN em `256`). Rotas públicas são declaradas como tal com justificativa (`/api/public/demo-leads` em `routes.ts:105-108`, `/api/public/lead-capture` em `261-264`, `/api/public/proposals` em `crm360Public.routes.ts:5-11`). Fallback 404 de `/api/*` antes do SPA (`routes.ts:279-281`) evita reprocessamento no Vite.

6. **Webhooks pré-`express.json()` estão corretamente segregados.** `src/bootstrap/webhooks.ts` monta 9 webhooks antes do parser JSON global (assinatura HMAC sobre corpo cru / parser urlencoded do Bitrix), cada um com comentário de modelo de autenticação. Comentário em `server.ts:82-84` registra a correção do `JSON_BODY_LIMIT` hardcoded.

7. **Rate limiting é por tenant nas rotas de IA** (SEC-008b): `src/bootstrap/rateLimiters.ts:40-74` — `aiLimiter` chaveado por `organizationId`, cobrindo `/api/intelligence`, `/api/agent`, `/api/prospecting/ocr`, `/api/knowledge`. Limiters dedicados existem para auth, bug-reports, exportações (`rateLimiters.ts:152-179`), booking público (`184-196`) e leads públicos (`123-151`).

8. **Test harness maduro.** Quatro configs Vitest com finalidades distintas e justificadas em comentário (`vitest.unit.config.ts` — pool threads, `VITEST_MAX_WORKERS`, thresholds de coverage por domínio com histórico de calibração documentado; `vitest.integration.config.ts`; `vitest.container.config.ts`; `playwright.config.ts`). `playwright.config.ts:18-38` tem trava fail-fast `assertE2eTestDatabase()` que recusa E2E contra banco que não termine em `_test` — proteção real contra rodar spec destrutiva em produção. Mocks MSW em `tests/mocks/` (`server.ts`, `handlers/`, `prisma.ts`, `twilio.ts`, `clamscan.ts`), fixtures em `tests/fixtures/`, helpers RBAC em `tests/helpers/rbac-e2e-helpers.ts`, segurança (`tests/security/rlsPenetration.test.ts`, `crossTenantIsolation.test.ts`), carga (k6 em `tests/load/`), evals golden dataset.

9. **`docs/README.md` é índice canônico com dono e data de revisão** (`docs/README.md:1-11`), declara explicitamente que vence contradições e aponta para `openapi.yaml` + `verify:openapi-drift`. `docs/index.md` é honesto sobre não ser publicado.

10. **Documentação de exceções de auth é explícita no OpenAPI**: `docs/openapi.yaml:24-40` documenta fora-de-escopo (`/metrics`, `/api-docs`, `/admin/queues` com modelo de auth correto — ADMIN + filas globais).

---

## 2. PROPOSTAS DE MELHORIA

1. **Estender o padrão de `lead-openapi-contract.test.ts` para os demais contratos críticos** (Contacts, Companies, Leads batch, Analytics dashboard, OrganizationModules, Settings/pillars). Hoje só `Lead` tem reconciliação Zod↔OpenAPI; os outros ~505 paths dependem só do passe estrutural.
2. **Unificar `AnalyticsDashboard`/`FunnelStage`/`DistributionSlice`/`PerformanceAgentRow`/`SalesSummaryMetrics`** em `src/shared/contracts/` (mesmo destino de `OverviewMetrics`), eliminando a duplicata `analytics.api.ts` ↔ `domain/Analytics.ts` e a terceira variante obsoleta em `analytics.service.ts`.
3. **Consolidar as duas implementações de dashboard** (`AnalyticsUseCases.dashboard` vs. `analyticsService.dashboard` usado por `weeklyPdfReport.worker.ts:17`) — hoje há dois códigos calculando "o mesmo" dashboard com tipos divergentes; risco de relatório semanal divergir da tela.
4. **Transformar a dependência implícita de auth-em-rate-limiter em mount explícito** (ver dívida P2-3): mover `authenticateToken` para o mount em `routes.ts` para `/api/agent`, `/api/knowledge`, `/api/bug-reports`, `/api/intelligence`, mantendo o limiter só para quota — ou documentar formalmente que o limiter é a camada de auth.
5. **Adicionar validação de schema OpenAPI no CI** (ex.: `redocly lint` ou `@apidevtools/swagger-parser` validando o YAML contra OpenAPI 3.0.3) — hoje nada valida que o YAML é sequer um documento OpenAPI bem-formado antes de servir no Swagger UI.
6. **Criar ou remover `npm run test:api-schema`** (ver P2-4): ou prover o ambiente (`.venv-opensource` + Schemathesis) e ligá-lo ao CI como fuzz/contract test real, ou remover o script para não induzir falso senso de cobertura.
7. **Adicionar `npm run docs`** se for exigido pelo gate do prompt 18 — script não existe; registrar como ausente conforme AGENTS.md "Scripts ausentes".
8. **Relatório de cobertura de validação de request**: publicar a tabela router→validateRequest e priorizar os endpoints de escrita (POST/PUT/PATCH) sem schema Zod.

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0 — nenhum encontrado no escopo auditado.

### P1 — Duplicação de contrato de analytics já divergente (bug agendado confirmado)

- `src/features/analytics/analytics.api.ts:11-16` declara `FunnelStage` com `amount?: number` e `conversionFromPreviousAmount?: number | null`; o backend vivo (`src/features/analytics/domain/Analytics.ts:32-40`) tem os mesmos campos — OK entre essas duas.
- **MAS** `src/features/analytics/analytics.service.ts:51-55` declara `FunnelStage` **sem** `amount`/`conversionFromPreviousAmount`, e `AnalyticsDashboard.byOwner` em `analytics.service.ts:69` é `Array<DistributionSlice & { won: number }>` — **sem `wonAmount`**, enquanto `domain/Analytics.ts` e o retorno real de `AnalyticsUseCases.ts:342` (`wonAmount: wonAmountByOwner.get(owner) ?? 0`) incluem `wonAmount`.
- Ou seja: existem **três declarações** de `AnalyticsDashboard`/`FunnelStage` no repo, e a de `analytics.service.ts` já está stale em relação ao payload real. Como `analyticsService.dashboard()` ainda é consumido por `src/features/crm/jobs/weeklyPdfReport.worker.ts:17` (relatório semanal em PDF), o worker pode estar tipando/consumindo um shape que não corresponde ao que a própria classe retorna — ou a classe retorna shape mais rico que o tipo admite (campo invisível ao typecheck, mascarado).
- **Evidência:** `analytics.service.ts:46-80` vs `domain/Analytics.ts:28-80` vs `analytics.api.ts:6-79`.

### P2-1 — Validação de request (Zod/`validateRequest`) cobre só ~1/3 dos routers

- 109 arquivos `*.routes.ts` em `src/`; apenas **37** contêm `validateRequest`/`z.object`/`.parse(` em si ou importam-nas; 194 ocorrências de `req.body` em rotas e 114 casts `req.body as ...` no total do `src/`. Muitos routers delegam validação a controllers/services (ex.: `notification.routes.ts` não tem `req.body` direto), então o número não prova ausência — mas a inconsistência é real: `lead.routes.ts:42,49` usa `validateRequest(leadSchema)`, enquanto outros endpoints de escrita dependem de parsing ad-hoc no controller. Sem uma matriz router→schema, não há como afirmar cobertura; e o drift Zod↔OpenAPI só é verificado para `Lead`.
- **Recomendação:** inventário de endpoints de escrita sem validação declarativa + contract tests nos de maior risco (billing, lgpd, integrations).

### P2-2 — Autenticação de 5 prefixos depende de efeito colateral do rate limiter (frágil e invisível)

- `src/bootstrap/routes.ts:150` (`/api/intelligence`), `:178` (`/api/knowledge`), `:183` (`/api/bug-reports`), `:257` (`/api/agent`) montam **sem** `authenticateToken` — a autenticação vem de `app.use('/api/...', authenticateToken, aiLimiter/bugReportLimiter)` em `src/bootstrap/rateLimiters.ts:66-74,114`. Funciona hoje (o comentário em `rateLimiters.ts:44-50` documenta o motivo), mas:
  - se alguém reordenar `applyRateLimiters`/`mountFeatureRoutes` ou trocar o limiter, a auth cai silenciosamente;
  - `requireTenant` (`src/shared/middlewares/authorization.ts:10-27`) **depende** de `req.user` populado por `authenticateToken` — sem ele, toda rota desses prefixos retorna 403, não 401;
  - o modelo "auth mora no limiter" não é descobrível pela tabela de rotas nem pelo OpenAPI.
- **Recomendação:** montar `authenticateToken` explicitamente em `routes.ts` (idempotente, custo = uma leitura de sessão já cacheada) e deixar o limiter só para quota — o próprio comentário em `rateLimiters.ts:156-159` já usa esse padrão para exportações ("authenticateToken roda aqui só para popular req.user… idempotente").

### P2-3 — `test:api-schema` é um script morto

- `package.json:42`: `"test:api-schema": ".\\.venv-opensource\\Scripts\\schemathesis.exe run docs/openapi.yaml --url http://127.0.0.1:3000"`. O executável `.venv-opensource/Scripts/schemathesis.exe` **não existe** no repo/ambiente (verificado: `ls` falhou), e nenhum workflow em `.github/workflows/` referencia schemathesis. É um contrato-de-teste (fuzz de API contra o OpenAPI) que nunca executa — exatamente a "mentira" que o prompt 18 alerta. Ou provisiona o venv + CI, ou remove.

### P2-4 — Gate do prompt 18 referencia script inexistente

- O prompt do Agente 18 lista `npm run docs` no gate específico; **não existe** script `docs` em `package.json` (conferido: scripts disponíveis incluem `verify:openapi-drift`, `test:api-schema`, mas não `docs`). Registrar como script ausente per AGENTS.md — não tratar como sucesso silencioso.

### P3-1 — Deriva de contrato verificada só em path+método, não em schema

- `verify-openapi-drift.ts` garante que todo endpoint exista e todo path documentado exista — mas **não** compara requestBody, response schema, parâmetros ou status codes (exceto o caso isolado de Lead coberto por teste unitário). Um endpoint que mudou de `200` para `201`, ou que renomeou um campo de resposta, passa verde. O passe 2 é best-effort: mounts não resolvíveis estaticamente são pulados sem falhar (`verify-openapi-drift.ts:44,227-231`) — correto para evitar falso positivo, mas significa que routers gerados/dinâmicos ficam fora do gate sem aviso. `resolvedFileCount: 78` vs. 109 arquivos `*.routes.ts` (nem todos montados; os de `src/lib/voice-hub/` estão gated como legacy via `unavailableLegacyModule`, `routes.ts:210-217`).

### P3-2 — `as any` em fronteiras de contrato (amostra classificada)

- 226 ocorrências de `as any` em `src/`. A maioria está em testes (mock de `req.user`, invocação de tools) — aceitável. As de risco em código de produção:
  - `src/features/analytics/presentation/AnalyticsController.ts:164-166,200-202` — `(period as any)`, `(entityType as any)`, `(outcome as any)` em parâmetros de query: cast mascara divergência de enum query↔domínio; deveria ser `z.enum` no `validateRequest`.
  - `src/features/intelligence/services/PredictiveScoringNbaService.ts:60,178,195` — `(lead as any).fitScore`, `(response as any)?.content`: contratos de dados de IA/Prisma sem tipo.
  - `src/features/intelligence/agents/ops.agent.ts:56` e `sdrQualification.agent.ts:56` — `new ToolNode(tools as any)`: boundary LangChain sem tipagem.
  - `src/features/market-intelligence/server/marketIntelligenceCompany.service.ts:603` — `(await res.json()) as any`: resposta de API externa sem contrato (Zod parse recomendado).
  - `src/features/automations/cadenceIntegration.service.ts:142` — `(config as any).action`: config JSONB sem schema.
- **Classificação:** nenhuma é P0 (nenhuma esconde erro de tenancy/auth confirmado), mas as 5 acima são limites de contrato onde divergência real passaria despercebida pelo typecheck — candidatas a handoffs por domínio.

### P3-3 — `docs/openapi.yaml` sem validação de boa-formação

- O arquivo tem 14.469 linhas e 506 paths, servido via `parseYaml` em `src/bootstrap/apiDocs.ts:21-26` (falha de parse é não-fatal — loga e segue sem `/api-docs`). Um YAML sintaticamente válido mas semanticamente inválido (ex.: `type` errado, `enum` divergente) só seria pego pelo Swagger UI renderizando errado ou por um scanner externo. Não há `redocly lint`/validação estrutural no CI.

### Observações menores

- `docs/openapi.yaml:9` declara `version: '1.0.0'` enquanto `package.json` está em `0.0.1` — cosmético, mas o campo `info.version` do OpenAPI deveria refletir o contrato, não o app.
- Exemplos no OpenAPI são sintéticos (`empresa.com.br`, `usuario@empresa.com.br` — `openapi.yaml:1476-1479`) — sem PII real. Correto.
- `server.ts` não foi editado (auditoria apenas); a observação de que `mountAuthHandler`/`mountBullBoard` ficam entre `express.json()` e as rotas de feature está correta e é a posição certa.

---

## 4. Comandos executados (evidência)

| Comando | Resultado |
|---|---|
| `npx tsx scripts/verify-openapi-drift.ts` | ✅ exit 0 — "Nenhuma deriva estrutural encontrada" (80 prefixos, 506 paths, 78 routers resolvidos) |
| `ls .venv-opensource/Scripts/schemathesis.exe` | ❌ inexistente |
| `grep` de scripts em `package.json` | sem `docs`; `test:api-schema` e `verify:openapi-drift` presentes |
| `grep -n schemathesis .github/workflows/*` | nenhum workflow referencia |
| contagens `as any`/`validateRequest`/`req.body` | 226 / 37 de 109 routers / 194 |

*Relatório produzido sem modificar código — escopo somente-leitura respeitado.*
