# Auditoria READ-ONLY — Agentes 08+14 (testes/gates/CI)
**Base:** `main @ b54060ad1`. Análise estática.

## Achados

### QA-01 — SonarQube mede cobertura SÓ do unitário — P1, Alta
`sonar-project.properties:17` só `coverage/unit/lcov.info`; sonarqube.yml roda só test:unit; integration gera coverage/ sem lcov e nada consome. ~110 arquivos de integração não entram no denominador → explica issue #200 (76→80% inalcançável). PRs reprovam no Sonar apesar de application gate verde.

### QA-02 — verify:integrations e verify:ai FORA do CI — P1, Alta
Scripts existem mas nenhum workflow invoca. Regressão de Bitrix/IA só aparece em produção.

### QA-03 — Steps não-bloqueantes no application gate — P2
Golden eval + verify:migration-drift `continue-on-error`. Drift schema↔migration acumula silenciosamente.

### QA-04 — 9 GHSA allowlisted no dependency review — P2
`ci.yml:60` allow-ghsas sem expiração/issue vinculada.

### QA-05 — E2E serial ~73min, retries mascaram flake — P2
`playwright.config.ts:45-47` workers:1, retries CI?2:0; flakes conhecidos crm-kanban/accessibility.

### QA-06 — Visual regression com bypass por escopo + 11 snapshots divergentes — P2
`visual-regression.yml:44-48` pula suíte se paths fora do filtro; issue #201 aberta; PR #310 falhou visual.

### QA-07 — Specs visuais mortas em tests/e2e/ — P3
`visual-audit.spec.ts` hardcoded localhost:3024 + networkidle proibido; `visual.spec.ts` nunca roda; tests/AGENTS.md desatualizado.

### QA-08 — test:containers fora de npm test e CI — P3
`reencryptCredentialsRls.test.ts` skip salvo RUN_INFRA_TESTS=1 — caminho crítico de re-encriptação RLS nunca verificado em gate.

### QA-09 — Skips reais na suíte — P2
`proposalVersioning.test.ts:221,289` 2 it.skip sobre transição "Pago"→DealClosureEvent (fluxo de receita sem teste ativo); Drawer focus skip; crm-kanban-mobile fixme.

### QA-10 — >100 arquivos com vi.mock de prisma — P2
Suíte unitária prova lógica, não persistência (coerente com desenho; integração cobre Postgres real mas serial).

### QA-11 — E2E cobre ~37 specs mas NÃO: LGPD ponta a ponta, sync Bitrix real (mockado), fluxos IA reais (stub), fila/retry, jornada receita completa — P2

### QA-12 — Harness sólido (prepare-integration-env.js: trava de segurança DB, role NOSUPERUSER p/ RLS real, Meilisearch dedicado) — informativo
CI usa service containers; `pretest:*` roda migrate deploy.

### QA-13 — release:check não é gate CI e tem cobertura menor que AGENTS.md — P3
Não roda verify:integrations/ai/containers/visual/audit real.

### QA-14 — Thresholds de cobertura são piso (~28-36%), com histórico de rebaixamento — P2
"Coverage verde" = sem regressão abaixo de piso baixo, não qualidade.

## O que os gates verdes realmente provam
Build gate fail-closed prova: segredos limpos, Trivy, deps, lint/typecheck, governança 24, arquitetura, OpenAPI drift, RLS estática (137 tabelas), unit+integration+E2E (~100 specs) com Postgres/Redis/Meili reais e role NOSUPERUSER, build+smoke health. **NÃO prova:** verify:integrations/ai, eval IA, migration-drift, visual em PRs fora de escopo, container tests, jornada receita/tenancy adversarial.

## Top-5 riscos qualidade
1. QA-01+QA-14 Sonar mede só unitário com piso baixo → #200 estruturalmente insatisfatível.
2. QA-02 verify:integrations/ai nunca em CI.
3. QA-05+QA-11 E2E lento com stubs + jornadas receita/LGPD sem cobertura.
4. QA-06+#201 visual bypass + 11 divergências.
5. QA-09+QA-03 skips em receita + gates não-bloqueantes.
