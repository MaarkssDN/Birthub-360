# Auditoria 2026-11-15 — Agente 08/08A (QA, Release e Deploy)

**Demanda:** DEM-20261115-001 · **Escopo:** `.github/workflows/**`, Dockerfile, docker-compose*, scripts de deploy, configs de teste (vitest/playwright), gates de qualidade, fly/vercel/Caddy/setup.
**Método:** leitura estática + contagens reais. Nenhum código modificado.

## Contagens verificadas

- **Workflows:** 22 arquivos em `.github/workflows/` (19 `.yml` ativos + `production.yaml` + `deploy-aws.yml.disabled` + `.disabled` arquivado). 5 deles são `workflow_dispatch`-only de propósito (LOCAL-FIRST).
- **Arquivos de teste:** ~**670** em `tests/` (unit 515, integration 116, e2e 34, security 3, container 2) + ~332 sob `src/**` (`__tests__` co-localizados). Total ≈ **1.000 arquivos de teste**.
- **Scripts `test:*` no package.json:** `test` (agregado unit+integration+e2e), `test:unit`, `test:integration`, `test:e2e`, `test:visual`, `test:watch`, `test:containers`, `test:architecture`, `test:api-schema`, `test:visual:update` — 10 scripts.
- **Configurações de teste:** `vitest.unit.config.ts`, `vitest.integration.config.ts`, `vitest.container.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `playwright.visual.config.ts`, `tests/global-setup.ts`, `biome.json`.

---

## 1. ELOGIOS (evidências)

1. **CI canônico excepcionalmente maduro** — `.github/workflows/ci.yml`: pipeline único com agregador fail-closed `build` (`ci.yml:367-390`), concurrency group que separa PR (cancel-in-progress) de push (fila por SHA, sem cancelamento — `ci.yml:21-25`), e comentário documentando o incidente real que motivou o design (runs 36785425846/36791581889 expirando em 60/90 min, `ci.yml:106-110`).
2. **Segurança em CI em camadas e bloqueante:** gitleaks com config própria (`ci.yml:33-40`), dependency-review com `fail-on-severity: high` e allowlist explícita de GHSA (`ci.yml:49-56`), Trivy fs scan HIGH/CRITICAL com `exit-code: 1` + SARIF (`ci.yml:63-80`), CodeQL com gate real via `scripts/security/check-codeql-sarif.ts` (`codeql.yml:12-13,93`).
3. **Gate de working tree limpa** — nenhum gate de CI pode escrever no repo (`ci.yml:210-221`); defesa explícita contra autofix silencioso.
4. **NO CI PASS = NO DEPLOY** — `production.yaml`, `cd-homolog.yml` e `docker-publish.yml` exigem SHA com check `build` verde via action compartilhada `.github/actions/require-ci-green`, sem exceção para `workflow_dispatch` (`production.yaml:36-58`, `cd-homolog.yml:36-52`, `docker-publish.yml:50-60`). `production.yaml` ainda valida ancestralidade em main e integridade de tag anotada.
5. **Least-privilege real em workflows de deploy** — `permissions: {}` no topo e grants por job (`cd-homolog.yml:30-34`, `production.yaml:28-30`), com comentário explicando o porquê.
6. **Dockerfile de produção maduro** (`Dockerfile`): multi-stage, non-root user `nodejs` (L117-119), HEALTHCHECK em `/health/live` (L121-122), `prisma migrate deploy` idempotente no CMD antes do boot (L145) com justificativa de advisory-lock para réplicas, reinstalação pinada da CLI Prisma com verificação de divergência lock/CLI/client (L55-62), comentários documentando 4 achados reais de produção (ERESOLVE, heap Vite, Prisma CLI ausente, `prisma.config.ts` faltando).
7. **Thresholds de cobertura bloqueantes e honestos** — `vitest.unit.config.ts:98-140` e `vitest.integration.config.ts:265+` com pisos por domínio crítico (ui, automations, CRM) e histórico de recalibração documentado no próprio config; baseline ~35% statements explicitamente declarado como "piso, não meta".
8. **Hardening de compose local** — `docker-compose.yml`: `no-new-privileges:true` em todos os serviços, healthchecks corretos (comentário documenta bug real do `localhost`→`::1` no wget do Meilisearch), Redis com `--requirepass`, MinIO marcado "dev only".
9. **Budgets automatizados** — `frontend-bundle-budget.yml`, `public-assets-budget.yml`, `endpoint-latency-budget.yml` (com cron semanal) + scripts `check-bundle-budget.mjs`/`check-public-budget.mjs` no package.json.
10. **Scripts de deploy de suporte** — `scripts/deploy/production-smoke-tests.sh` (gate "NO SMOKE PASS = NO DEPLOY SUCCESS"), `rollback-drill.sh`, `staging-rehearsal.sh`, `scripts/smoke-test-oci.sh` com retries controlados.
11. **Testes de arquitetura como gate** — `test:architecture` (depcruise + baseline de violações conhecidas + hotspots) roda no CI (`ci.yml:231`).
12. **Todas as actions pinadas por SHA** com comentário de versão — sem `@vN` flutuante em todo o conjunto inspecionado.

---

## 2. PROPOSTAS DE MELHORIA

1. **Split do job `build-and-test`** (`ci.yml:95-360`): hoje lint+typecheck+unit+integration+build+E2E rodam serialmente num único job de 120 min. Separar em jobs paralelos (static-gates / unit+integration / e2e) com `needs` preservaria o agregador `build` e reduziria o tempo de feedback de ~73min de E2E para o caminho crítico real.
2. **Coverage como sinal, não só artefato:** thresholds existem mas o relatório só é upado como artefato (`ci.yml:346-350`). Publicar o delta de cobertura no step summary (ou integrar ao SonarQube quality gate, que já roda em `sonarqube.yml`) transformaria o piso de 28% em visibilidade acionável.
3. **`test:containers` fora do CI:** `vitest.container.config.ts` (testcontainers) existe mas nenhum workflow o executa — só `npm run test:containers` manual. Incluir como job noturno (`schedule`) evitaria bit-rot de teste de container.
4. **Consolidar scripts de deploy:** há `deploy-aws.ps1`, `deploy-ec2.ps1`, `deploy-ec2.sh`, `setup.sh`, `setup_docker.sh`, `setup-nginx-ssl.sh`, `scripts/deploy/*.sh`, `scripts/smoke-test-oci.sh`, `fly.toml`, `vercel.json`, `Caddyfile.oci` — 4+ alvos de deploy parcialmente documentados. Um `docs/deploy/` canônico + um entrypoint único (`deploy.sh <target>`) reduziria o risco operacional.
5. **Smoke pós-deploy automatizado no caminho EC2:** `scripts/deploy/production-smoke-tests.sh` existe mas os scripts EC2 (`deploy-aws.ps1:80-95`) fazem healthcheck caseiro só de `/health/live` — trocar pelo smoke completo (live+ready+version) fecharia o gate "NO SMOKE PASS = NO DEPLOY" no caminho que é de fato usado.
6. **Visual regression:** rodar também em `push` para `develop`/schedule noturno — hoje só PR→main/master (`visual-regression.yml:3-6`); drift visual em develop só aparece tarde.
7. **`verify:rls-coverage`, `verify:prod`, `backup:drill`** têm scripts mas não aparecem como gate no `ci.yml` — avaliar incluir `verify:rls-coverage` (segurança de tenancy) como step, dado o histórico de incidentes RLS documentado no próprio workflow.
8. **Dependabot/Renovate:** não há `.github/dependabot.yml` visível — com 22 workflows e Trivy/dependency-review bloqueantes, automação de bump reduziria o atrito de PRs que falham por CVE novo.
9. **E2E `retries: 2` em CI** (`playwright.config.ts:47`) mascara flakiness: adicionar tracking de retry-rate (ex.: artifact com `--reporter` já existente + métrica) ou reduzir para 1 retry com job de quarentena para flakes conhecidos.
10. **`release-gate.js` órfão:** `npm run release:check` (`package.json:92`) não é invocado por nenhum workflow — ou integrá-lo ao `production.yaml`/`cd-homolog.yml` antes do publish, ou removê-lo para não induzir falsa sensação de gate.

---

## 3. ERROS, FALHAS E DÍVIDAS

| Sev | Achado | Evidência |
|-----|--------|-----------|
| **P0** | **Deploy EC2 é 100% manual, sem rollback, sem migração, sem gate de CI** — `deploy-aws.ps1`/`deploy-ec2.sh` copiam `dist/` buildado localmente via SSH e fazem `docker restart`, sem `prisma migrate deploy`, sem exigir CI verde, sem healthcheck de readiness. Um deploy com schema novo sobe código contra banco antigo. | `deploy-aws.ps1:55-78`, `deploy-ec2.sh:20-44` |
| **P0** | **`StrictHostKeyChecking=no` em todos os SSH** dos scripts de deploy — MITM trivial na cópia de artefatos de produção; e IP de produção hardcoded (`3.143.251.44`). | `deploy-aws.ps1:59-78`, `deploy-ec2.sh:8` |
| **P1** | **`deploy-ec2.sh` copia `node_modules/` inteiro via `scp`** — milhares de arquivos, sem garantia de integridade, mistura de builds; o `.ps1` (que usa Docker) e o `.sh` (que copia node_modules) divergem em arquitetura — dois caminhos de deploy incompatíveis para o "mesmo" alvo. | `deploy-ec2.sh:26-28` vs `deploy-aws.ps1:68-70` (`docker cp`) |
| **P1** | **`scripts/deploy-oci.sh` referenciado mas NÃO EXISTE** — Dockerfile (L131-140) e `docs/deploy/README.md:68` documentam o fluxo OCI inteiro (compose + migrate + seed) apontando para script ausente no repo. O deploy OCI real depende de arquivo que só existe no servidor — não reproduzível, não auditável, armadilha de "deploy com sucesso e usuários vazios" já documentada no próprio Dockerfile. | `ls scripts/deploy-oci.sh` → No such file; `Dockerfile:131`; `docs/deploy/README.md:68` |
| **P1** | **`docker-compose.oci.yml` referenciado mas ausente do repo** — mesmo padrão: documentado em `docs/deploy/README.md:54,129` e no comentário do Dockerfile, não versionado. | `ls docker-compose.oci.yml` → No such file |
| **P1** | **`fly.toml` com dois blocos `[[services]]` no mesmo `internal_port: 3000`** — Fly não suporta dois services idênticos de forma inequívoca; config provavelmente inválida ou com comportamento não intencional. Adicionalmente `PORT=3000` no fly vs `PORT=3024` default da imagem — funciona porque `server.ts:68` lê env, mas dois `[[services.ports]]` (80 e 443 handlers tls) no primeiro bloco são suspeitos. | `fly.toml:13-42` |
| **P1** | **`onda-2.5-validation.yml` é workflow de onda única** (`branches: [validation/onda-2.5-base]`) — branch de validação temporária; se a branch já foi mergeada/deletada, o workflow é ruído permanente no repo. Avaliar arquivar. | `.github/workflows/onda-2.5-validation.yml:3-5` |
| **P2** | **`verify:migration-drift` não-bloqueante no CI** — `continue-on-error: true` (`ci.yml:286`) com drift estrutural pré-existente conhecido (KnowledgeChunk, índices renomeados). Correto como decisão tática, mas o débito continua aberto e o check "verde" mascara drift real novo introduzido por PRs. | `ci.yml:266-287` |
| **P2** | **Golden dataset live é `continue-on-error: true`** (`ci.yml:261-265`) — regressão de qualidade de IA passa silenciosamente; só aparece no log. Considerar tornar bloqueante quando secrets presentes (já é condicional a secrets, então torná-lo blocking não afetaria forks). | `ci.yml:258-265` |
| **P2** | **`tests/e2e/visual.spec.ts-snapshots/` órfão** — `playwright.config.ts:41` ignora `visual.spec.ts`/`visual-audit.spec.ts` e o config visual usa `testDir: ./visual-regression` com baselines em `visual-regression/baselines/`; os 10 PNGs em `tests/e2e/visual.spec.ts-snapshots/` são resíduo de config antiga. | `playwright.config.ts:40-41`, `playwright.visual.config.ts:6`, `tests/e2e/visual.spec.ts-snapshots/` |
| **P2** | **Scripts Windows-only no package.json** — `test:api-schema` usa `.\.venv-opensource\Scripts\schemathesis.exe` (path Windows hardcoded, `package.json:42`); quebra `npm run` em Linux/macOS e em qualquer ambiente de dev não-Windows. | `package.json:42` |
| **P2** | **`vercel.json` provavelmente obsoleto** — app é full-stack (server.ts + dist/server.cjs); Vercel só serviria o SPA estático com rewrite para index.html (`vercel.json:8-13`), quebrando qualquer rota de API. `git.deploymentEnabled: false` mitiga, mas o arquivo induz configuração errada. Avaliar remover ou documentar como desativado. | `vercel.json:1-14` |
| **P2** | **`Caddyfile.oci` só cobre HTTP** — snippet mostra `http://{$DOMAIN::80}`; sem bloco HTTPS/ACME visível no trecho, o TLS do Caddy depende de config fora do repo ou está incompleto. | `Caddyfile.oci` |
| **P2** | **`setup.sh` abre Postgres para o mundo** — `listen_addresses='*'` + `pg_hba.conf` com `host all all 0.0.0.0/0 md5` (`setup.sh:18-21`) sem firewall documentado no script; senha `prospector_app_pass` hardcoded (`setup.sh:15`) e replicada em `setup_docker.sh:18-21`. Risco se rodado em IP público (o IP de produção é público). | `setup.sh:15-21`, `setup_docker.sh:17-22` |
| **P3** | **`deploy-aws.yml.disabled` ainda é um workflow válido se renomeado** — conteúdo completo de deploy ECS/ECR preservado; risco baixo (só roda com extensão `.yml`), mas pode confundir auditorias. Arquivamento correto, só registrar que o "deploy real" documentado nele aponta para scripts manuais (ver P0). | `.github/workflows/deploy-aws.yml.disabled:1-12` |
| **P3** | **Credenciais de teste hardcoded em workflows** — senhas `prospector_test_pass`, `ci_app_test_pass`, `ci_migrator_test_pass`, JWT/Meili "secrets" de CI commitados em texto plano (`ci.yml:143-165`, `visual-regression.yml:39-67`, `onda-2.5-validation.yml:30-44`). Aceitável por serem efêmeras de CI, mas `POSTGRES_PASSWORD`/`MEILI_MASTER_KEY` repetidos em 5+ workflows pedem um composite action ou env compartilhado para reduzir drift. | `ci.yml:143-165` etc. |
| **P3** | **`branch-hygiene.yml` deleta branches por cron** — workflow destrutivo agendado (segunda 06:23 UTC) com `dry_run` default `true`; verificar se a lógica de seleção de candidatos tem proteção contra branch protegida/em uso. Não auditei o miolo; recomendo revisão dedicada. | `.github/workflows/branch-hygiene.yml:17-27` |
| **P3** | **Postman sync só em push para main** (`postman-sync.yml:3-4`) — sem PR check de drift da coleção; se a coleção é contrato, drift só é detectado pós-merge. | `postman-sync.yml` |
| **P3** | **`test:e2e` depende de `pretest:e2e` que roda `prisma migrate deploy` via dotenv-cli** — funciona, mas o E2E em `playwright-ci.yml` (dispatch-only) duplica ~90% do setup do `ci.yml`; candidato a composite action para evitar divergência (ex.: `playwright-ci.yml` usa pgvector:pg17 enquanto `ci.yml` usa pg16 — `ci.yml:115` vs `playwright-ci.yml:19`). | `package.json:71-72`, `playwright-ci.yml:19` vs `ci.yml:115` |
| **P3** | **SonarQube depende de secrets externos** (`SONAR_TOKEN`, `SONAR_HOST_URL`) — se ausente, o workflow pode pular/falhar de forma dependente de configuração do repo, não do código; verificar comportamento quando secrets não configurados (há comentário sobre fail-closed em `sonarqube.yml:29-30`, positivo). | `sonarqube.yml:29-31` |

---

## Resumo executivo

O **pipeline de CI é o ponto mais forte do repositório** — gate único fail-closed, segurança em camadas bloqueante, thresholds de cobertura honestos e documentação de incidentes reais embutida nos comentários. O **elo fraco é o deploy**: produção roda por scripts manuais SSH (sem CI gate, sem migração, sem rollback, MITM possível) enquanto toda a esteira cloud (GHCR, homolog, OCI) está corretamente "NO CI PASS = NO DEPLOY" mas **desativada por decisão LOCAL-FIRST** — e os artefatos que a esteira invocaria (`deploy-oci.sh`, `docker-compose.oci.yml`) **não estão versionados**. Prioridade: P0 nos scripts EC2 (adicionar migrate deploy + smoke gate + host key checking), P1 versionando os artefatos OCI ou removendo as referências.
