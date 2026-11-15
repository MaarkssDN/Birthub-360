# Auditoria 2026-11-15 — Cluster 08/08A/14: Qualidade, Testes e Pipeline de CI/CD

**Demanda:** DEM-20261115-001 · **Escopo:** `tests/` (unit, integration, e2e, container, security, load, evals), `vitest*.config.ts`, `playwright*.config.ts`, `package.json` (scripts de gate), `scripts/` de verificação, `.github/workflows/`.
**Método:** leitura estática de código, configs e workflows; contagem de arquivos; verificação de inclusão dos testes nos harnesses. Nenhum arquivo modificado.

---

## 1. Escopo auditado

| Área | Evidência |
|---|---|
| Suítes de teste | `tests/` — 719 arquivos (~670 arquivos de teste): `unit/` (519), `integration/` (116), `e2e/` (47 specs Playwright), `container/` (2), `security/` (3 `.test.ts` + 1 `.md`), `load/` (3 scripts k6), `evals/` (1 dataset), `mocks/` (18), `helpers/` (4) |
| Configs | `vitest.unit.config.ts`, `vitest.integration.config.ts`, `vitest.container.config.ts`, `vitest.config.ts` (raiz/Storybook), `playwright.config.ts`, `playwright.visual.config.ts` |
| Gates de CI | `.github/workflows/ci.yml` (canônico, 525 linhas), `qualidade-ci.yml`, `playwright-ci.yml`, `sonarqube.yml`, `security-sbom.yml`, `security-trivy.yml`, `codeql.yml`, `dependency-review.yml`, `visual-regression.yml`, `endpoint-latency-budget.yml`, `onda-2.5-validation.yml`, `cd-homolog.yml`, `production.yaml`, `deploy-aws.yml.disabled`, `branch-hygiene.yml`, `postman-sync.yml`, `android-build.yml`, `ios-build.yml`, `docker-publish.yml`, `frontend-bundle-budget.yml`, `public-assets-budget.yml` |
| Scripts de verificação | `scripts/release-gate.js`, `scripts/ci/check-independent-review.js`, `scripts/test/prepare-integration-env.js`, `scripts/verify-*.ts`, `scripts/ci/*` |

---

## 2. Elogios (com evidência)

1. **Pipeline canônico fail-closed e bem documentado.** `ci.yml` tem um job agregador `build` (contexto exigido pela branch protection) com `if: always()` que consolida o veredito de todos os needs e falha explicitamente se qualquer um não for `success` (`.github/workflows/ci.yml:364-390`). Comentários explicam incidentes reais que motivaram o desenho (cancelamento em PR superado, runs que expiravam em 60/90 min, incidente da Onda 5 de RLS).
2. **Infra de teste real, não mockada.** O job `build-and-test` sobe Postgres `pgvector/pgvector:pg16`, Redis e Meilisearch com health-checks, bootstrap de papéis NOSUPERUSER (`scripts/db/bootstrap-app-role.sh`) e re-bootstrap pós-migrate para pegar regressão de ordem bootstrap→migrate (`ci.yml:104-141, 187-192, 245-255`).
3. **Cobertura honesta e calibrada.** `vitest.unit.config.ts` usa `include: ['src/**/*.{ts,tsx}']` + `reportOnFailure: true` + thresholds bloqueantes por domínio (`src/features/crm/**`, `automations`, etc.) com baselines medidos e documentados (linhas 44-158). `vitest.integration.config.ts` separa `reportsDirectory` para não sobrescrever o unitário e documenta por que `.tsx` fica fora do escopo Node (linhas 219-270). O comentário em `vitest.unit.config.ts:60-68` explica exatamente o bug clássico do v8 coverage (arquivo nunca importado some do denominador).
4. **Travas de segurança de banco.** `playwright.config.ts:304-322` recusa E2E contra qualquer DATABASE_URL que não termine em `_test`; `scripts/test/prepare-integration-env.js` faz o mesmo para integração e bloqueia hosts de produção. Teste de container RLS usa `testcontainers` com imagem própria.
5. **E2E de jornada real.** `tests/e2e/completeCustomerJourney.e2e.test.ts` executa Prospecção→CRM→Oportunidade→Proposta→Automação→Indicadores contra API real + Prisma/RLS + banco `prospectordb_test`, com asserções de persistência — não é spec tautológico.
6. **Skips mínimos e justificados.** Apenas 4 ocorrências de `.skip/.fixme` em toda a suíte, todas com comentário explicando o motivo (`proposalVersioning.test.ts:221,289`; `Drawer.test.tsx:55`; `crm-kanban-mobile.spec.ts:163`).
7. **Actions pinadas por SHA e permissions mínimas.** Todos os `uses:` usam commit SHA completo com versão comentada; `permissions: contents: read` no nível do workflow e grants pontuais por job (`ci.yml:13-14`). Secrets de teste são placeholders explícitos (`ci-test-*-not-for-production`).
8. **Segurança contínua além do ci.yml.** Gitleaks (`ci.yml:28-43`), Trivy fs scan HIGH/CRITICAL bloqueante (`ci.yml:62-90`), dependency-review com allowlist de GHSAs espelhando `docs/security/AUDIT_WAIVERS.md`, CodeQL, SBOM CycloneDX agendado, e `verify:rls-coverage` no `security-sbom.yml:90`.
9. **Produção com gate duplo.** `production.yaml` exige SHA com check `build` verde via `.github/actions/require-ci-green` antes de qualquer publish ("NO CI PASS = NO DEPLOY", `production.yaml` header) — e está desativado por decisão Local-First, documentada. `deploy-aws.yml.disabled` foi arquivado com justificativa e handoffs (`deploy-aws.yml.disabled:1-14`).
10. **Workflows redundantes foram conscientemente reduzidos.** `qualidade-ci.yml` e `playwright-ci.yml` viraram `workflow_dispatch`-only com comentário citando auditoria de redundância que eliminou 3 execuções do mesmo unit+coverage (`qualidade-ci.yml:1-14`).
11. **Baseline visual Linux resolvida.** `visual-regression/baselines/` contém PNGs `*-linux.png` commitados e `playwright.visual.config.ts` usa `updateSnapshots: 'none'` — verificação nunca "abençoa" baseline ausente (linha 19). O gap documentado no `tests/AGENTS.md` §6 parece já ter sido sanado (a nota está desatualizada).

---

## 3. Propostas de melhoria

1. **Transformar `tests/security/` em suíte real ou removê-la/renomeá-la.** Hoje é um diretório de "segurança" que não testa segurança (ver P1-1). Opções: migrar os vetores para `tests/integration/` batendo em RLS real (já existe `tests/integration/db-restricted-table-privileges.test.ts` como modelo), ou reclassificar como testes unitários de contexto/guard em `tests/unit/` com nome honesto.
2. **Endurecer `verify:governance-reviews`.** Exigir parecer do Agente 24 **referenciando o SHA/PR atual** (ex.: arquivo de review contendo o SHA do head ou número da PR), e falhar se `approvedCount === 0` também fora de PR quando rodando no gate. Hoje qualquer review antigo satisfaz o check.
3. **Incluir `develop` no gatilho de PR do ci.yml** (ou confirmar proteção equivalente) — hoje PR→develop não executa nenhum workflow de gate.
4. **Promover `tests/container/` a gate periódico.** Rodar `RUN_INFRA_TESTS=1 npm run test:containers` em schedule semanal no ci.yml ou workflow dedicado — hoje os 2 testes (incluindo recriptografia de credenciais com RLS) nunca rodam em CI.
5. **Resolver ou formalizar o drift de migration.** `verify:migration-drift` está `continue-on-error` por drift estrutural pré-existente grande. Criar dívida rastreada (DATA-007 follow-up) com meta de zerar e então tornar bloqueante; enquanto isso, adicionar um job separado que falhe apenas em **drift novo** (diff do diff).
6. **Reabilitar o golden dataset como gate real.** Hoje é `continue-on-error` + condicional a secrets — nunca bloqueia. Alternativa: rodar semanalmente (schedule) e abrir issue em falha, ou exigir LLM judge com baseline de score.
7. **Investigar os 2 `it.skip` de `proposalVersioning.test.ts`.** O comentário sugere escrita perdida na infra de teste — pode ser bug real de persistência de `DealClosureEvent` mascarado por skip. Prioridade alta de investigação.
8. **Reduzir custo/flake do E2E serial.** 100 specs com `workers: 1` levaram ~73min (ci.yml:98-102). Avaliar sharding (`--shard`) entre jobs ou workers>1 com isolamento por banco/schema, já que `fullyParallel:false` foi escolha conservadora, não necessidade provada.
9. **Atualizar `tests/AGENTS.md` §6/§7.** A nota sobre baselines visuais Windows-only está obsoleta (baselines linux existem) e o flake documentado merece re-verificação no CI atual.
10. **Remover duplicação residual:** `dependency-review` roda dentro do ci.yml **e** como workflow standalone — manter um só para evitar dois checks divergentes.

---

## 4. Erros, falhas e dívidas técnicas

### P0 — nenhuma encontrada.

### P1 — Gaps que anulam cobertura/gate de segurança

**P1-1. `tests/security/` nunca executa em nenhum gate e contém testes tautológicos que fingem cobertura de segurança.**
- Os 3 arquivos `.test.ts` só são coletados pelo `vitest.config.ts` raiz (linhas 41-43, projeto jsdom), que **nenhum script npm nem workflow CI invoca** — todos os gates usam `-c vitest.unit.config.ts` / `-c vitest.integration.config.ts` / `-c vitest.container.config.ts` (`package.json:68-78`; grep em `.github/workflows/` confirma). O projeto raiz também carrega o plugin Storybook browser que não roda em CI.
- Pior: o conteúdo é simulação em memória, não teste de sistema. `tests/security/crossTenantIsolation.test.ts:6-16` "testa" isolamento cross-tenant filtrando um array literal com `filterByTenant` — não toca Prisma, RLS nem HTTP. `tests/security/rlsPenetration.test.ts` usa `mockDatabase` inline e `JSON.parse` local para "vetores de penetração RLS" (ex.: linhas ~60-80). `commercialV3.security.test.ts` (13 `it`) segue o mesmo padrão de guards locais. O nome "Suíte de Testes de Penetração RLS & Tenant Hardening (Passo 028)" (`rlsPenetration.test.ts:5`) promete cobertura que não existe.
- **Impacto:** falsa sensação de cobertura de segurança cross-tenant; os vetores reais (override de tenant, IDOR) não são exercitados contra o sistema.

**P1-2. Gate de revisão independente (Agente 24) é bypassável — qualquer review antigo satisfaz.**
- `scripts/ci/check-independent-review.js:33-46`: em PR, só falha se `reviewFiles.length === 0`. `approvedCount` é calculado (linha 38-43) mas **nunca usado em nenhuma decisão** — não há exigência de que exista review aprovado, nem vínculo com o SHA/PR atual, nem checagem de que o review seja do próprio diff. Um repositório com um único `.md` de review aprovado em `.agents/reviews/` passa o gate para sempre.
- Roda em todo PR/push via `ci.yml:227-228` (`npm run verify:governance-reviews`), ou seja, é um required-adjacent gate que não verifica o que diz verificar.

### P2 — Gates enfraquecidos ou cobertura crítica baixa

**P2-1. PRs para `develop` não executam o pipeline canônico.**
- `ci.yml:9-10`: `pull_request` só em `branches: [main, master]`, embora `push` inclua `develop` (linha 8). Se `develop` for branch de integração de ondas (AGENTS.md §12 menciona `integracao/onda-N`), PRs para ela ficam sem typecheck/lint/testes.

**P2-2. `tests/container/` (2 testes, incl. RLS de recriptografia) nunca roda em CI.**
- `vitest.container.config.ts` existe e `package.json:41` define `test:containers`, mas nenhum workflow o invoca; os testes exigem `RUN_INFRA_TESTS=1` (opt-in, documentado em `tests/AGENTS.md` §6). `tests/container/reencryptCredentialsRls.test.ts` é precisamente o tipo de teste de segurança que deveria ser contínuo.

**P2-3. Golden dataset e drift de migration são gates permanentemente não-bloqueantes.**
- `ci.yml:257-262`: `eval:golden` com `continue-on-error: true` e `if` dependente de secrets presentes — na prática nunca reprova o build.
- `ci.yml:264-281`: `verify:migration-drift` com `continue-on-error: true` devido a drift estrutural pré-existente não resolvido (comentário admite "quantidade grande de drift ESTRUTURAL"). Drift novo introduzido por um PR fica invisível no veredito.

**P2-4. Cobertura de domínios críticos abaixo do aceitável, embora documentada.**
- `vitest.unit.config.ts:153-158`: `src/features/crm/**` (núcleo do produto) com baseline de **33.83% statements / 18.75% functions** e thresholds ainda mais baixos (32/30/17/33). Comentário admite que faltam jobs BullMQ, `infra/PrismaLeadRepository.ts` e componentes React.
- `vitest.integration.config.ts:265-270`: threshold global de integração em **14% statements / 14% functions** — a suíte de 116 arquivos cobre pouco do backend.
- Não é má-fé (baselines honestos e comentados), mas o produto tem um domínio financeiro/CRM crítico com ~1/3 de cobertura.

**P2-5. Dois `it.skip` em `proposalVersioning.test.ts` podem estar escondendo bug real de persistência.**
- `tests/integration/proposalVersioning.test.ts:219-221` e `:287-289`: comentários dizem que "a infraestrutura de teste/conexão está perdendo a escrita antes da leitura de verificação" — ou seja, `DealClosureEvent` pode não estar sendo persistido em transição para "Pago" e o skip mascara a investigação. Cobre exatamente o fluxo comercial pago (evento `payment_confirmed`), caminho de receita.

**P2-6. Flake conhecido no E2E e retries que mascaram.**
- `tests/AGENTS.md` §7 documenta 1 falha aleatória por execução em specs diferentes (`accessibility.spec.ts`, `crm-kanban.spec.ts`) fora do CI com Chromium local antigo; `playwright.config.ts:332` usa `retries: 2` só no CI, o que converte flake em verde silencioso (trace só em `on-first-retry`, linha 348). Sem telemetria de retry-rate, flakes do CI são invisíveis no veredito.
- Custo: suíte serial levou ~73min e já expirou jobs em 60/90min (`ci.yml:98-102`); timeout subiu para 120min — margem, não correção.

### P3 — Menores

- **P3-1.** `tests/unit/components/ui/Drawer.test.tsx:55` — `it.skip` de retorno de foco (acessibilidade) sem data de revisão.
- **P3-2.** `tests/e2e/crm-kanban-mobile.spec.ts:163` — `test.fixme` de drag touch real; item classificado "REQUER DEVICE REAL" mas permanece no repo sem tracking formal.
- **P3-3.** `tests/AGENTS.md` §6 desatualizado: afirma que baselines visuais Linux "nunca existiram"; `visual-regression/baselines/**-linux.png` existem e são usados por `visual-regression.yml` em PR.
- **P3-4.** Duplicação residual de dependency-review: job dentro de `ci.yml:45-60` e workflow standalone `dependency-review.yml` — dois checks para a mesma política.
- **P3-5.** `scripts/release-gate.js` roda `verify:migration-drift` como **bloqueante** (linha ~40, `optional=false`) enquanto o CI o trata como não-bloqueante — gate local mais estrito que o CI; divergência de política local-vs-CI pode confundir (local NO-GO onde CI dá GO).

---

## 5. Resumo executivo

A qualidade do pipeline é **acima da média**: o `ci.yml` é um gate canônico fail-closed com agregador `build` obrigatório, infraestrutura real (Postgres/RLS/Redis/Meilisearch), cobertura com thresholds honestos e baselines documentados, pins de action por SHA e vereditos explicados por comentários de incidentes. Os pontos fracos concentram-se em **falsa cobertura**: `tests/security/` (3 arquivos de "penetração RLS") nunca executa em CI e contém apenas simulações tautológicas em memória — o maior risco do cluster. O gate de revisão do Agente 24 (`check-independent-review.js`) também é bypassável: conta reviews mas nunca exige que o atual esteja aprovado nem vinculado ao PR. Secundariamente, `develop` fica fora do gatilho de PR, testes de container nunca rodam em CI, golden-dataset e drift de migration são permanentemente `continue-on-error`, e dois skips de integração podem esconder bug real no fluxo de pagamento (`DealClosureEvent`). Cobertura de `src/features/crm/**` está em ~33% statements — documentada, mas crítica para o domínio central do produto. Recomenda-se tratar P1-1 e P1-2 antes de qualquer release gate formal.
