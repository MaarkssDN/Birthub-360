# Parecer Agente 24 — Revisão Independente — PR #383 (Agente 05)

- **Data:** 2026-11-18
- **Revisor:** Agente 24 — Revisão Independente
- **PR:** #383 `fix(05): saneamento handoffs prospecção/outbound`
- **Branch/revisão:** `agente/05-handoffs-20261117` @ `4f743e6abdac1439a8d09ccd73cc345b5bcb5a80` (base `origin/main` @ `f8d4bc76d`)
- **Método:** diff integral via `git diff origin/main...<branch>` + inspeção dos blobs no worktree `agente-24-inspect-383` (detached no head do PR); execução real dos testes.
- **Contexto:** este PR é o follow-up de resolução dos itens 1–4 do parecer 24 do PR #323 (`.agents/reviews/onda1-handoffs-24-20261114.md`), que havia aprovado-com-ressalvas o hardening de tenancy do outbound legado.

## Escopo entregue

1. `requireTenantScope` + `tenantCompany` + `normalizeTenantCompany` em `src/features/prospecting/outbound/server/auth.ts` (~L207-247): 401 sem sessão, 403 sem `company`; normalização idêntica ao login (`normalizeCompany` de `auth.routes.ts`).
2. Mount em `server/routes.ts`: `authRouter` e `GET /health` antes do guard; `apiRouter.use(requireTenantScope)` único + defesa em profundidade `router.use(requireTenantScope)` em campaigns/tasks/chat/integrations/leads/system.
3. Filtros `company` (case/space-insensitive via `LOWER(TRIM(COALESCE(company,'')))`) em todas as queries de dados revisadas: campaigns (list/detail/user-leads/sellers), leads (todos os `:id` verificados antes de escrita → 404 cross-tenant), tasks, integrations (lead.id validado antes de export Bitrix), system (`/error-reports` GET com escopo user→company preservando anônimos; `/feedback/summary` via `leads.company`/EXISTS), `auth /users` (agora exige tenant e filtra — antes listava diretório cross-tenant), chat (sessões/mensagens por `company`).
4. Resolução dos débitos do parecer #323: `POST /prospect` agora usa SEMPRE `tenantCompany(req)` (o bypass `role!=='admin' ? session : body` que permitia admin gravar em outra company foi removido); `GET /search-runs/:id` exige `run.request.company === tenantCompany(req)` (404 caso contrário, runs sem company → 404 fail-closed).
5. Provider cache com tenant na chave (`providerCache.ts`): prefixo v2 `prospecting:provider-cache:v2:{tenantId}:{provider}:{op}:{params}`; `getTenantId()` do requestContext com fallback `'no-tenant'` — workers/scripts sem tenant nunca herdam cache de org real nem vice-versa. Chaves v1 expiram por TTL (1h).
6. 7 handoffs atualizados para `resolvido`/status + `tests/unit/features/prospecting/outbound/tenantScope.test.ts` (novo, 233 linhas, 16 testes) + extensões em `providerCache.test.ts`.

## Verificações

### Correção do hardening (vs. achados do parecer #323)
- **Item 1 (chat sem tenant):** resolvido na camada de código — `chat_sessions`/`chat_messages` filtram por `company` em todas as queries (sessCheck 404 cross-tenant, histórico, listagem, insert com company). **Dependência externa:** a coluna `company` vem da migration `20261117230000_outbound_chat_tenant_company` do PR #381 (Agente 01) — sem ela aplicada as rotas falham. O próprio código documenta "DEPENDÊNCIA DE MERGE: PR #381 → este PR" e o módulo segue montado fechado (`/api/outbound` → `unavailableLegacyModule` 503 em `src/bootstrap/routes.ts:211`, inalterado neste PR). Correto e honesto.
- **Item 2 (admin/bodyCompany):** corrigido — `const company = tenantCompany(req) || bodyCompany` (leads.routes.ts ~L868); teste dedicado "admin NÃO consegue prospectar com company de outro tenant via body".
- **Item 3 (search-runs):** corrigido — escopo por `run.request.company` com 404 indistinguível; `startSearchRun` passa a gravar `company` da sessão no request (~L883).
- **Item 7 (error-reports):** nota registrada — POST agora exige sessão; endpoint canônico `/api/error-reports` citado como alternativa.

### Tenancy/LGPD
- Guard único no `apiRouter` + por-router: mesmo padrão aprovado no #323; rotas públicas (`/auth/login|logout|me`, `/health`) permanecem acessíveis — verificado que `/health` foi movido para `routes.ts` antes do guard (não quebra sondas) e `systemRouter` manteve `/providers/health` (agora atrás do guard — mudança de exposição intencional e documentada).
- 404 (não 403) em recursos de outro tenant — não revela existência. Correto.
- `/db/query` (SQL arbitrário como admin, sem escopo de tenant): **débito conhecido explicitamente documentado** no código com handoff 05→01 aberto e módulo atrás do gate 503 — tratamento honesto, não ocultação.
- Provider cache: chave com tenant é a correção correta para vazamento cross-tenant de dados pagos de provider (Apollo/Hunter); fallback `no-tenant` é fail-safe.

### Escopo/propriedade
- Todos os arquivos de código em `src/features/prospecting/**` → domínio do Agente 05 (confirmado por `src/features/prospecting/AGENTS.md` lazy-loaded: providers/outbound sob sua governança). Nenhum arquivo de outro dono tocado. Handoffs próprios atualizados sem apagar originais.

### Evidência executável
- `npx vitest run tests/unit/features/prospecting/outbound/tenantScope.test.ts` → **16/16 verde** (401/403/404 cross-tenant, filtros SQL emitidos, search-runs, bodyCompany, users).
- `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/providerCache.test.ts` → **12/12 verde** (chaves distintas por org, bucket `no-tenant`). Nota: o arquivo fica em `src/**/__tests__/` — incluído pelo `vitest.unit.config.ts` (gate `test:unit`), mas NÃO pelo `vitest.config.ts` default; executado com a config correta.

## Achados / ressalvas (não bloqueantes)

1. **Ordem de merge**: depende da migration de `chat.company` do PR #381 — mergear **após** #381 (ou junto, na ordem 381→383). O gate 503 do módulo mitiga exposição em qualquer ordem, mas a intenção declarada é essa sequência.
2. **Modelo `company` string-livre** (vs `organizationId` canônico): débito arquitetural conhecido e documentado nos handoffs (`05-para-01-outbound-tenant-schema-decisao`); `normalizeCompany` colapsa variantes contendo "360" — colisão possível entre empresas distintas, herdada do login. Não é regressão deste PR.
3. **Cobertura de testes é de contrato** (SQL emitido mockado via `db.js`), não de integração Postgres real — adequado para o escopo, mas a reabertura do módulo exigirá validação E2E de tenancy.
4. Rotas legadas sem `requireAuth` explícito por rota (ex.: `/ollama/status`) agora dependem do `requireTenantScope` do router — correto (401 sem sessão), mas o comportamento muda de "público" para "autenticado"; intencional e alinhado ao hardening.

## Veredito

**APROVADO-COM-RESSALVAS** — resolve corretamente os 4 débitos de tenancy do parecer #323 com defesa em profundidade, testes de contrato HTTP cobrindo os caminhos cross-tenant, e documentação honesta dos débitos remanescentes (SQL Explorer, modelo company). Condição: merge após PR #381.

**Recomendação de merge:** aprovar; mergear **depois** do PR #381.

---

## Evidência executável

- `npx vitest run tests/unit/features/prospecting/outbound/tenantScope.test.ts` → 16/16 (exit 0)
- `npx vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/providerCache.test.ts` → 12/12 (exit 0)
- Warnings de `SESSION_SECRET`/env em teste são de baseline (segredo dev), não regressão.
- Não executado: `tsc --noEmit`/lint completos (fora do escopo de amostragem; recomendo gate de integração do 00).
- Commit upstream referenciado: `4f743e6ab` ("docs(handoffs): status pos-saneamento — 6 handoffs do 05 processados").

**Hash do diff auditado:** `git diff origin/main...4f743e6ab` — 20 arquivos, +828/−99.
**Revisão exata:** head `4f743e6abdac1439a8d09ccd73cc345b5bcb5a80`.
**Riscos:** nenhum bloqueante; dependência de merge com #381; módulo segue fechado (503).
**Escopo da aprovação:** conteúdo do PR #383 conforme diff auditado; aprovação de docs NÃO aprova reabertura do módulo `/api/outbound`.
**Pendências:** validação E2E de tenancy na reabertura; decisão sobre SQL Explorer (handoff 05→01); migração para `organizationId` canônico.
**Autor:** Agente 05 — Prospecção. **Auditor:** Agente 24.
**Status do handoff auditado:** handoffs 12→05, 16→05, 05→01/05→05 saneados — veredito documental favorável; funcional coberto pelos testes executados.
**Destinos de integração:** `integracao/onda-5` (PR #402 aberto) ou main direto — decisão do 00.
**Evidências:** saídas vitest acima; diffs inspecionados arquivo a arquivo.
**Comandos:** `git fetch origin agente/05-handoffs-20261117`; `git diff origin/main...origin/agente/05-handoffs-20261117`; `npx vitest run ...` nos worktrees `agente-24-inspect-383`.
**Códigos de saída:** vitest 0/0; `gh pr diff 394 --name-only` 0.
**Achados com prioridade/proprietário/correção/teste esperado:** ver "Achados / ressalvas" itens 1–4 (todos prioridade normal, proprietário 05/00, sem teste adicional exigido além do re-open E2E).
**Veredito:** APROVADO-COM-RESSALVAS.
**Escopo exato da aprovação:** diff `origin/main...4f743e6ab` nos 20 arquivos listados; não cobre comportamento em produção (módulo fechado).
**Observação:** este parecer complementa — não substitui — o gate de integração do 00.
**Reauditoria:** necessária se o PR for alterado (novo commit) antes do merge.
**Segredos/PII:** nenhum incluído neste parecer.
**Limitações:** sem execução de `tsc`/lint/build neste parecer; sem banco Postgres real (testes de contrato apenas).
**Recomendação final ao 00:** mergear após #381, na ordem declarada; manter `/api/outbound` fechado até handoff 05→01 de schema canônico.

*Estrutura do parecer conforme `.agents/prompts/24-revisao-independente.md`: missão/onda, autor, auditor, base/branch, revisão exata, arquivos, critérios e resultados, comandos e códigos de saída, evidências, achados com prioridade/proprietário/correção/teste esperado, pendências, riscos, veredito e escopo exato da aprovação.*
