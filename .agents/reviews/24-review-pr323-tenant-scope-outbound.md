# Parecer 24 — Revisão Independente PR #323

- **PR:** #323 — `fix(05): Onda 1 — tenant scope completo no outbound legado (handoff 12→05)`
- **Branch:** `agente/05-onda1-handoffs` → base `main`
- **Revisão auditada:** head `b78abe3429b9fa38fadca893a6c43e69ff0c68a9` (refs/audit/pr323)
- **Autor:** Agente 05 (implementação concluída pelo orquestrador a partir de trabalho parcial de subagentes)
- **Auditor:** Agente 24 — Revisão Independente
- **Data:** 2026-11-15
- **Fonte primária:** `.agents/reviews/tmp-audit/pr323.diff` + leitura integral dos arquivos no head do PR (`git show refs/audit/pr323:...`)

## Veredito: BLOQUEADO

O código é uma melhoria real e bem executada de isolamento de tenant, mas **o PR não pode ser integrado no estado atual**: dois gates obrigatórios estão vermelhos (formatação Biome em 4 arquivos do próprio PR e cobertura SonarQube de código novo 53,2% < 80%). Além disso há gaps residuais de tenancy que precisam ser explicitamente aceitos ou endereçados antes da reabertura do módulo (hoje bloqueado por 503 — ver abaixo). BLOQUEADO aqui significa "evidência/gate insuficiente para aprovar", não reprovação do código.

## Escopo vs título

O título promete "tenant scope completo no outbound legado". O diff entrega:

- `server/auth.ts`: novos `requireTenantScope` (401 sem sessão / 403 sem `company`) e `tenantCompany` (normalização canônica, mesma regra do login).
- `server/routes.ts`: `apiRouter.use(requireTenantScope)` após `authRouter` + `/health` públicos.
- Filtro `company` (case-insensitive via `LOWER(TRIM(COALESCE(...)))`) em `campaigns`, `leads` (todos os `:id` via `leadBelongsToCompany` → 404 cross-tenant), `tasks` (JOIN em leads), `integrations` (send-lead, bitrix-check), `system` (error-reports, feedback/summary), `auth` (`GET /users` filtrado por company).
- Defesa em profundidade: `requireTenantScope` também aplicado dentro de cada sub-router (`campaignsRouter.use`, `leadsRouter.use`, `tasksRouter.use`, `chatRouter.use`, `integrationsRouter.use`, `systemRouter.use`).
- 12 novos testes em `tests/unit/features/prospecting/outbound/tenantScope.test.ts`.
- Resolução registrada no handoff `12-para-05-outbound-api-legado-tenancy.md`.

Escopo condizente com o título, com a ressalva de que "completo" é aspiracional — ver achados.

## Contexto crítico de exposição

`src/bootstrap/routes.ts:211` monta `/api/outbound` como `unavailableLegacyModule('outbound')` → **503 MODULE_NOT_READY** para qualquer requisição. O `apiRouter` endurecido **não é alcançável em produção**; nenhum arquivo de `src/` consome `/api/outbound` (apenas comentários em `AppLayout.tsx`/`tabMeta.ts` confirmam o gate intencional). Consequências:

1. Os gaps residuais abaixo são **latentes**, não exploráveis hoje — mas tornam-se reais no dia em que o módulo for reaberto, que é exatamente o objetivo declarado do handoff.
2. A justificativa do handoff "a UI legada ainda o consome" está **factualmente incorreta** — não há consumidor de frontend; o módulo está integralmente atrás do gate 503. Registrar como imprecisão documental (não invalida o código).

## Achados

### Bloqueadores (gates)

1. **[BLOQUEADOR] `format:check` falha — 4 arquivos do PR fora do padrão Biome.** Job `application gate` (run 43660023828, job 132647829447): `biome format src` reprova `src/features/prospecting/outbound/server/auth.ts`, `routes/campaigns.routes.ts`, `routes/integrations.routes.ts`, `routes/leads.routes.ts` (o log também lista arquivos pré-existentes de outros domínios — `AuthContext.tsx`, `bitrixEventMeshBridge.service.ts`, `offlineLogoutPurge.test.ts`, `auditLog.middleware.ts` — que precisam ser verificados se são baseline ou regressão). Correção trivial: `npx biome format --write` nos arquivos do PR. Proprietário: 05.
2. **[BLOQUEADOR] SonarQube quality gate FAILED — `new_coverage` 53,2% < 80%.** Job 132647033747, log `report-sonarqube-qualitygate.mjs`: "Cobertura de testes em código novo está em 53.2%. Aceitável: ≥ 80.0%". Os 12 testes novos cobrem o contrato HTTP (401/403/404/filtros SQL), mas o diff toca ~700 linhas de rotas — cobertura de linhas novas insuficiente. Opções: ampliar `tenantScope.test.ts` para os caminhos de escrita restantes ou registrar exclusão justificada. Proprietário: 05 + 08.

### Altos (tenancy residual — aceitar ou endereçar antes da reabertura)

3. **[ALTO] `POST /prospect` permite ao role `admin` sobrescrever a company via body** (`leads.routes.ts` ~L870): `company = outboundUser.role !== 'admin' ? outboundUser.company : bodyCompany`. Um admin de company A pode gravar leads com `company='empresa-b'` — escrita cross-tenant no namespace de outro tenant, e o dedupe filtra pela company injetada. Pré-existente, mas o PR declara tenancy completo. Decisão necessária: restringir admin à company da sessão ou documentar que `admin` é papel cross-company por design. Proprietário: 05 (decisão) / 01 (modelo).
4. **[ALTO] `GET /search-runs/:searchId` devolve o SearchRun completo sem checagem de tenant** (`system.routes.ts:63`). O run contém query, candidatos e dados de leads da busca — PII de prospecção. Qualquer autenticado com o searchId lê a busca de outro tenant. SearchIds são provavelmente não-enumeráveis, mas não há vínculo company↔searchId em lugar nenhum. Mínimo: registrar `company` no SearchRun e validar; ou aposentar a rota junto com o módulo.
5. **[ALTO] `POST /db/query` (`requireAdmin`) executa SQL arbitrário sem escopo de tenant** (`system.routes.ts:157`). Se `admin` for por-tenant, um admin lê/escreve dados de qualquer company. Se `admin` for papel global da plataforma legada, documentar. Decisão de modelo necessária antes da reabertura.
6. **[MÉDIO] `chat_sessions`/`chat_messages` sem coluna de tenant nem de usuário** — qualquer sessão autenticada de qualquer company lê todas as conversas do chat legado. **Já documentado** no código (`chat.routes.ts:15-21`) e assumido como gap residual que exige coluna nova (schema → Agente 01) ou aposentadoria do módulo. Aceitável como débito registrado, inaceitável como "tenant scope completo".
7. **[MÉDIO] `GET /observability/summary` e `GET /db/stats` agregam métricas de todos os tenants** (contagens, providers, motivos de descarte). Baixa sensibilidade individual, mas vaza volume/uso cross-tenant. Aceitável se métricas forem consideradas operacionais; registrar ciência.
8. **[MÉDIO] Regressão funcional conhecida: `POST /error-reports` passou a exigir sessão** — o botão "Reportar problema" da tela de **login** (exatamente o caso de uso do endpoint, cf. comentário original) deixa de funcionar até o front migrar para `/api/error-reports` canônico. Documentado no handoff como follow-up de frontend; como o módulo está 503, impacto prático zero hoje — mas o follow-up precisa existir como handoff 05→02/00 para não se perder.
9. **[BAIXO] `POST /integrations/bland/call` dispara chamada de voz paga para `phoneNumber` arbitrário do body**, sem vínculo a lead/tenant. Pré-existente; consumo de custo por qualquer autenticado. Registrar como risco de abuso/custo (Agente 23/12), fora do escopo estrito de tenancy.
10. **[BAIXO] `GET /users/:userId/leads` retorna 403 (não 404) quando o vendedor é de outra company** — revela existência do userId cross-tenant. Inconsistente com a política 404-adotada em leads. Cosmético; owner 05 se quiser alinhar.

### Pontos positivos verificados

- `requireTenantScope` posicionado corretamente: depois de `attachUser`, antes de todos os sub-routers de dados; `authRouter` e `/health` permanecem públicos (necessário para login e sondas).
- Todas as rotas `:id` de leads verificadas uma a uma no head do PR: stage, tags, PUT, save, enrich-news, generate-copies, copies/feedback, cnpj-refresh, evidence — todas com filtro de company e 404 cross-tenant. Escrita cross-tenant bloqueada (`dbMocks.run` não chamada — teste prova).
- `tasks` sem coluna company resolvido corretamente via JOIN em `leads` em todas as rotas (list, painel gerencial, por usuário, PUT).
- `GET /error-reports` com escopo correto: anônimos visíveis, vinculados filtrados por company do usuário — bom tratamento de PII.
- `GET /campaigns` filtra campaigns **e** subcontagens de leads/messages por company.
- Testes provam cross-tenant negado (403/404) e presença do filtro SQL + parâmetro company — evidência real, não alegação.
- Nenhum segredo, nenhuma PII em logs novos (error-reports loga `userEmail` em `console.error` — pré-existente).
- Propriedade: arquivos todos de `src/features/prospecting/**` e `tests/unit/features/prospecting/**` → Agente 05. Handoff próprio editado pelo próprio agente. Sem violação de §15.

## Comandos executados

- `git fetch origin pull/{323,339,348,354}/head` → refs `refs/audit/pr*` (heads: pr323=`b78abe34`, pr339=`bfc3d2e6`, pr348=`8fd68ca5`, pr354=`cd82893e`)
- `git show refs/audit/pr323:<path>` para leitura integral de routes/auth/system/leads/campaigns/integrations/tasks/chat no head do PR
- `git grep` para mounts de `apiRouter`, consumidores de `/api/outbound`, `unavailableLegacyModule`
- `gh pr checks 323`, `gh run view --job 132647829447 --log` (format:check), `gh run view --job 132647033747 --log` (SonarQube quality gate)

## Recomendações para destravar

1. Agente 05: `npx biome format --write` nos 4 arquivos do PR; ampliar testes para cobrir caminhos de escrita restantes ou justificar exclusão de cobertura.
2. Agente 05/00: registrar handoff explícito para os gaps 3–6 (search-runs, db/query, prospect-admin, chat) como pré-condição da reabertura do módulo — ou aceitar formalmente como débito com dono.
3. Agente 05→02/00: handoff para migrar o "Reportar problema" da tela de login ao endpoint canônico.
4. Corrigir a frase do handoff sobre "UI legada consome /api/outbound" (não consome; módulo está 503).

## Escopo desta aprovação

Parecer cobre o diff do PR #323 no head `b78abe34`. **Não aprova merge** enquanto os dois gates estiverem vermelhos. A direção da correção de tenancy é aprovada condicionalmente, ressalvados os achados 3–6 como pré-condições documentadas para reabertura do módulo.
