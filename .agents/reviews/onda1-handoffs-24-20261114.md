# Parecer Agente 24 — Revisão Independente — Onda 1 (DEM-20261114-002)

- **Data:** 2026-11-14
- **Revisor:** Agente 24 — Revisão Independente
- **Worktree de revisão:** `C:\Github\Birthub-360-wt-00` (branch `agente/00-trilha-coordenacao`)
- **Escopo:** PRs #322, #323, #324, #325, #309 (entregas da Onda 1)
- **Método:** `gh pr diff`/`gh pr view` + `git show <branch>:<path>` a partir de `C:\Github\Birthub-360` (fetch executado); spot-check de evidências declaradas contra o repositório; execução real do gate e dos testes do PR #309 no worktree.

---

## PR #322 — `agente/02-onda1-handoffs` — form-lead-fake resolvido

**Escopo:** `src/features/landing/pages/Landing360.tsx`, `tests/unit/features/landing/Landing360.test.tsx`, handoff `auditoria-para-02-form-lead-fake.md` → `resolvido`.

**Verificações:**
- Endpoint `POST /api/public/demo-leads` existe e está montado em `src/bootstrap/routes.ts` (`app.use('/api/public/demo-leads', publicLeadRoutes)`, público, com `publicLeadLimiter` — confirmei no diff do PR e no arquivo).
- `publicLeadSchema` (`src/features/public-leads/publicLead.schema.ts` L41-66) exige `nome`, `email`, `equipe` (enum), `consent: z.literal(true)`, `consentTextVersion` literal, `purpose` enum; `website` é `z.unknown().optional()` (honeypot aceito e descartado pela rota via `isHoneypotFilled` → 202 genérico). Payload do form bate campo a campo.
- Honeypot `website` no form: input `type="text"`, `tabIndex={-1}`, `aria-hidden`, `className="hidden"` (Landing360.tsx ~L1858-1866) — invisível para humanos, preenchível por bots. Correto.
- Mapeamento de erros (`invalid_payload`/`rate_limited`/`unavailable` → mensagens observáveis) é fail-safe: código desconhecido cai na mensagem genérica. Consent nunca pré-marcado (`consent: false` inicial; envio exige `consent === true` validado no client E no server — dupla camada LGPD).
- Teste novo cobre 429/503 mapeados, omissão do honeypot vazio e `consent:true` no body. 19 testes na suíte (declarado; flake de timeout isolado documentado honestamente).
- Propriedade: `src/features/landing/**` → Agente 02 ✓; handoff próprio atualizado sem apagar pedido original ✓.

**Veredicto: APROVADO.**

---

## PR #323 — `agente/05-onda1-handoffs` — outbound tenancy (handoff 12→05)

**Escopo:** `requireTenantScope`/`tenantCompany` em `auth.ts`, guard no mount do `apiRouter`, filtros `company` nas queries, 12 testes novos.

**Verificações positivas:**
- `requireTenantScope` (401 sem sessão / 403 sem `company`) aplicado uma vez no `apiRouter` antes dos routers de dados; rotas públicas (`/auth/*`, `/health`) corretamente antes do guard. `GET /health` movido para `routes.ts` para continuar respondendo a sondas — correto.
- Defesa em profundidade: cada sub-router (`campaigns`, `tasks`, `chat`, `integrations`, `leads`, `system`) tem `router.use(requireTenantScope)` próprio — funciona mesmo montado fora do `apiRouter`.
- `tenantCompany` é réplica exata de `normalizeCompany` (auth.routes.ts L30-37): trim/lowercase + colapso `birthhub|birth hub|360 → 'birthhub360'`. Paridade login↔query confirmada.
- Cobertura de filtros verificada rota a rota: `campaigns` (list/detail/distribution/user-leads com checagem de seller cross-company → 403), `leads` (todos os `:id` verificados via `leadBelongsToCompany` ou SELECT com cláusula → 404 cross-tenant antes de qualquer UPDATE), `tasks` (JOIN em `leads` para escopo), `integrations` (lead.id verificado antes de exportar Bitrix; webhook check com filtro), `system` (`error-reports` filtra por user→company mantendo anônimos visíveis — decisão razoável e documentada; `feedback/summary` agrega via `leads.company`/`EXISTS`), `auth` (`/users` agora exige tenant e filtra por company).
- Testes: contei 12 `it()` em `tenantScope.test.ts` cobrindo 401/403/404 cross-tenant e presença dos filtros no SQL emitido. Mock de `db.js` é adequado para teste de contrato HTTP.
- Mount em `bootstrap/routes.ts` permanece fechado (503) — exposição real do router legado está contida; o fechamento formal do handoff fica condicionado a esta revisão, como declarado.

**Ressalvas (residuais cross-tenant NÃO eliminados — o handoff afirma "filtro company em todas as queries", o que é impreciso):**

1. **`chat_sessions`/`chat_messages` sem coluna de tenant** — qualquer sessão autenticada de qualquer company lê/escreve o histórico de chat de todos os tenants (`chat.routes.ts` L131-162; o próprio código admite "GAP RESIDUAL" em comentário, mas a seção Resolução do handoff lista "chat" entre os filtrados — incorreto). Isolamento exige coluna nova (schema → Agente 01) ou aposentadoria do módulo. **Follow-up obrigatório antes de reabrir o gate.**
2. **`POST /prospect` aceita `company` do body para `role === 'admin'`** (leads.routes.ts ~L863-871): admin de company A pode passar `company: 'empresa-b'` e gravar campanha+leads no escopo da company B (cross-tenant write; os leads ficam invisíveis ao próprio admin depois). Se o modelo legado trata admin como superuser global, é decisão consciente — mas com multi-tenant ativo isso é vetor de escrita cruzada. Recomendo forçar `tenantCompany(req)` também para admin ou registrar decisão explícita.
3. **`GET /search-runs/:searchId`** (system.routes.ts L63) devolve o `SearchRun` completo (candidatos, intent, plano) sem escopo de tenant — vazamento de dados de prospecção entre tenants para qualquer autenticado que conheça/adivinhe o id (ids são `search-<timestamp>-<rand>` em memória, 200 retidos). Risco menor (memória por processo), mas não filtrado.
4. **`POST /db/query`** (`requireAdmin`) executa SQL arbitrário validado só por `checkExplorerSqlSafety` — admin lê/escreve qualquer tenant. Aceitável como ferramenta de admin legado, mas deve constar como exceção conhecida no fechamento do handoff.
5. **`GET /observability/summary`, `/db/stats`, `/providers/health`, `/cnpj/:cnpj`** — dados agregados/providers/API pública; risco baixo, sem PII de tenant.
6. **`normalizeCompany` colapsa qualquer company contendo `360` em `birthhub360`** — duas empresas distintas com "360" no nome colidem no mesmo tenant. Comportamento pré-existente do login fielmente replicado; registrar como dívida do modelo `company` string-livre (a migração para `organizationId` canônico já é o caminho declarado).
7. **`POST /error-reports` passou a exigir sessão** — botão da tela de login que usava o endpoint legado quebra silenciosamente (disclosed no código e no handoff; follow-up de frontend pendente — não bloqueia tenancy, mas é regressão de UX a rastrear).

**Veredicto: APROVADO-COM-RESSALVAS.** A blindagem de leitura/escrita por id e o guard de tenant estão corretos e bem testados; o mount segue fechado (503). Condição para fechamento formal do handoff 12→05: abrir handoffs de follow-up para os itens 1 (chat — schema, Agente 01), 2 (decisão admin/bodyCompany), 3 (search-runs) e 7 (error-reports na tela de login), e corrigir a redação da Resolução ("todas as queries" → "queries de dados tenant-scoped; chat/search-runs residual").

---

## PR #324 — `agente/01-onda1-handoffs` — docs de handoffs

**Escopo:** 4 handoffs atualizados/criados + `docs/orchestration/journal/01.md`.

**Verificações (spot-check das evidências declaradas):**
- `12-para-01` → `resolvido` com decisão Estratégia 1 (adaptar voice-hub aos models canônicos) + novo handoff `01-para-12` com mapeamento model-a-model. Verifiquei no schema: `Organization`, `User`, `UserJobRole`, `JobRole`, `AgentSession`, `OrganizationWebhookEndpoint`, `Notification`, `AuditLog`, `Birthub360CallResult` (grafia confirmada, L5383) existem — a decisão "sem mudança de schema" é consistente.
- Ponto crítico de RLS confirmado: `requestContext.enterWith({ tenantId: orgId })` em `src/lib/auth.ts` ~L383; voice-hub middleware não popula contexto → policies `tenant_isolation` em fail-closed. Correto e bem sinalizado (revisão 24 exigida antes de reabrir `legacyModuleGate`).
- `DocumentEmbedding`: migration `prisma/migrations/20261110120000_document_embedding_rls_policy/migration.sql` existe e contém `CREATE POLICY "tenant_isolation" ... USING ("tenantId" = current_setting('app.current_tenant_id', true))` — confere com o declarado. Ressalva honesta: teste de integração Postgres não executado (infra indisponível).
- `onda-v4-fase2`: avaliação spec-V4→schema com tabela de 21 entidades e gaps G1–G4; status BLOQUEADO mantido aguardando produto — postura correta (não inventou escopo, não criou models paralelos). Modelos citados (`CrmPipeline` L1504, `ForecastSnapshot` L1145, `DocumentEmbedding` L4737) conferem.
- Propriedade: handoffs `.agents/handoffs/**` — cada agente cria os próprios ✓ (01 criou/atualizou os seus); journal `docs/orchestration/journal/01.md` é do 01 ✓. Nenhum arquivo de código tocado — zero risco de tenancy/LGPD nesta entrega.

**Veredicto: APROVADO.**

---

## PR #325 — `agente/10-onda1-handoffs` — docker-2375 parcial

**Escopo:** `infrastructure/security/verify-docker-2375-restriction.sh` (novo), runbook `DOCKER-REMOTE-DAEMON.md`, complemento no handoff `00-para-10`.

**Verificações:**
- Propriedade: `infrastructure/**` → Agente 10 ✓.
- Script bash correto: `set -u`, parsing de args com `--expect blocked|allowed`, classificação EXPOSTO/BLOQUEADO por HTTP code + curl rc, exit codes 0/1 conforme esperado, modo diagnóstico sem `--expect`. Sem secrets, sem escrita — só `curl /version`.
- Honestidade de status: exposição **segue ativa** (re-verificado ao vivo 2026-11-14, HTTP 200 reportado) e a contenção depende de ação humana no host — declarado como "parcial" no título do PR e no handoff. Correto não fechar o handoff.
- Ressalva menor (não bloqueante): `hostname -I` não existe no Git Bash/Windows — a linha de "Origem" sai vazia nesse ambiente; cosmético.

**Veredicto: APROVADO** (entrega parcial declarada; ação humana no host permanece pendente e rastreada).

---

## PR #309 — `agente/00-trilha-coordenacao` — gate ownership-coverage + handoffs resolvidos + offline-sqlite

**Escopo:** `scripts/governance/check-ownership-coverage.ts` + `ownership-coverage.manifest.json` + `tests/unit/architecture/ownership-coverage.test.ts` + `package.json` (script novo) + 4 handoffs atualizados.

**Verificações executadas por mim (não só declaradas):**
- `npx tsx scripts/governance/check-ownership-coverage.ts` no worktree → **exit 0**: "20 escopo(s) de propriedade do AGENTS.md §15 cobertos pelo manifesto (20 entrada(s))".
- `npx vitest run tests/unit/architecture/ownership-coverage.test.ts` → **25/25 testes verdes** (confirma a evidência declarada no handoff).
- Parse do §15: o bloco fenced do AGENTS.md tem exatamente 20 pares escopo→dono; o manifesto tem 20 entradas com donos idênticos — sincronização real, não cosmética.
- Qualidade do gate: falha explícita em AGENTS.md sem §15, JSON inválido, depcruise ilegível; valida regras `forbidden` do `.dependency-cruiser.cjs` por regex real (`to.path`/`to.pathNot`) contra path sintético; rejeita `coverage:"depcruise"` fora do grafo; exige justificativa ≥20 chars em `coverage:"review"`; valida `alternateCheck` contra scripts do package.json; verifica existência dos paths. Funções puras exportadas e bem testadas (sucesso + todos os caminhos de falha + não-regressão com arquivos reais).
- Handoffs resolvidos — evidências spot-checked: `encryptedOfflineStorage.service.ts`, `NAVEGACAO-MODULAR.md`, `ModuleNavPanel.tsx`, `EXECUCAO-ONDAS.md`, prompts citados — todos existem; commit `f0af157bc` confirmado. Decisão offline-sqlite (Opção B, AES-GCM mantido) registrada como decisão do usuário — correto.

**Ressalvas:**
1. **O gate só cobre o bloco fenced do §15.** As regras de aprovação de `server.ts`, `package.json` e lockfile ("exigem aprovação explícita do 00") estão em prosa APÓS o fence — o parser não as vê e o manifesto não as cobre. Uma mudança em `server.ts`/`package.json` não dispara este gate. Se a intenção é cobrir aprovação, é preciso estendê-los ao manifesto (coverage "review" com owner "Agente 00") ou documentar que a proteção deles é processo, não este gate.
2. **`package.json` alterado pelo próprio Agente 00** — a regra "package.json/lockfile exigem aprovação explícita do 00" é auto-referente aqui (o 00 aprovou a si mesmo). Mudança mínima (1 script), lockfile corretamente intocado, mas registro fica para transparência.
3. **100% das entradas são `coverage:"review"`** — honesto (nenhum escopo §15 tem regra depcruise de propriedade hoje, incluindo `src/App.tsx`), mas na prática o gate **documenta e sincroniza** a matriz; não impede mecanicamente edição cross-owner. É o que a dívida pedia (classificação explícita), mas convém não vender como enforcement.
4. `tests/unit/architecture/ownership-coverage.test.ts` importa de `../../../scripts/governance/...` — fora de `src/`, fora do grafo depcruise; consistente com o restante de `tests/`.

**Veredicto: APROVADO-COM-RESSALVAS.** Gate funciona, testado e honesto; ressalvas 1-3 devem virar follow-ups (estender cobertura a server.ts/package.json ou registrar decisão de que são processo; ciência de que "review" ≠ enforcement).

---

## Síntese

| PR | Agente | Veredicto |
|---|---|---|
| #322 | 02 | **APROVADO** |
| #323 | 05 | **APROVADO-COM-RESSALVAS** (chat sem tenant, admin/bodyCompany em /prospect, search-runs sem escopo, error-reports login, redação do handoff a corrigir) |
| #324 | 01 | **APROVADO** |
| #325 | 10 | **APROVADO** (parcial declarado; ação humana pendente) |
| #309 | 00 | **APROVADO-COM-RESSALVAS** (gate verificado verde; §15 prosa fora do fence; package.json auto-aprovado; "review" ≠ enforcement) |

**Follow-ups recomendados ao Agente 00:**
- F1 (05→01/05): isolamento de `chat_sessions`/`chat_messages` (coluna tenant ou aposentadoria) — bloqueador para reabrir gate outbound.
- F2 (05): decisão sobre `company` do body para admin em `/prospect`.
- F3 (05): escopo de tenant em `/search-runs/:searchId` e correção da redação do handoff 12→05.
- F4 (frontend): endpoint canônico `/api/error-reports` para o botão da tela de login.
- F5 (00): estender ownership-coverage a `server.ts`/`package.json` ou registrar que a aprovação deles é processo.
- F6 (01, já sinalizado): revisão 24 da adaptação voice-hub quando o 12 entregar.
