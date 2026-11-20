De: 08 — QA e Release
Para: 00 — Coordenador
Onda: débitos da auditoria 2026-11-18 (DEBT-0026)
Status: em-andamento
Prioridade: bloqueador
Bloqueador-ref: DEBT-0026 (inventario-mestre.md, QA-01/QA-14/QA-02)
Sprint destino: saneamento de débitos P0

## Problema

O SonarQube media cobertura apenas da suíte unitária:
`sonar.javascript.lcov.reportPaths=coverage/unit/lcov.info`, enquanto
`npm run test:integration -- --coverage` (ci.yml:319) gravava em
`coverage/integration/` sem reporter `lcov` — o LCOV de integração nunca
alimentava o scanner. Além disso, `verify:integrations`/`verify:ai` só
rodavam em `.github/workflows/onda-2.5-validation.yml`, restrito a PRs para
`validation/onda-2.5-base` — fora do gate de PR para `main`.

## Arquivo(s) envolvido(s)

- `vitest.integration.config.ts` (config de teste — dono efetivo 08 via tests/CI)
- `sonar-project.properties`
- `scripts/ci/validate-sonarqube-config.mjs`
- `.github/workflows/sonarqube.yml` (dono: 08)
- `.github/workflows/ci.yml` (dono: 08)

## Evidência

- `vitest.integration.config.ts` tinha `reporter: ['text','json','json-summary','html']`
  — nenhum `lcov`, logo `coverage/integration/lcov.info` não existia.
- `sonarqube.yml` rodava apenas `npm run test:unit -- --coverage` e não tinha
  serviços Postgres/Redis/Meilisearch — impossível rodar a suíte de integração.
- `onda-2.5-validation.yml` dispara só em `pull_request` para
  `validation/onda-2.5-base`; `verify:integrations` era bloqueante e
  `verify:ai` era `continue-on-error: true` naquele workflow.

## Alteração necessária (implementada)

1. `vitest.integration.config.ts`: reporter de coverage passa a incluir `'lcov'`
   → `coverage/integration/lcov.info` passa a ser gerado.
2. `sonar-project.properties`:
   `sonar.javascript.lcov.reportPaths=coverage/unit/lcov.info,coverage/integration/lcov.info`
   (o scanner aceita múltiplos paths separados por vírgula; os `SF:` de ambos
   os LCOV são relativos a `src/`, mesmo formato, merge por arquivo).
3. `sonarqube.yml`: job `sonarcloud` ganha os mesmos services do
   `build-and-test` do ci.yml (pgvector/pgvector:pg16, redis:7-alpine,
   meilisearch:v1.12), env de teste espelhado (DIRECT_URL, REDIS_URL, MEILI_*,
   BETTER_AUTH_URL, ALLOW_DEV_AUTH_BYPASS, ALLOWED_ORIGINS, AUTH_RATE_LIMIT_MAX,
   PLATFORM_OPERATOR_TOKEN, BOOTSTRAP_SUPERUSER_URL) e os passos na mesma ordem
   do ci.yml: bootstrap do papel → `prisma migrate deploy` → re-bootstrap →
   `.env.test` → `npm run test:integration -- --coverage`.
4. `scripts/ci/validate-sonarqube-config.mjs`: o gate de config agora exige
   AMBOS os paths de LCOV (unit + integration), não só o unitário.
5. `ci.yml` (job `build-and-test`, application gate): novos steps bloqueantes
   `npm run verify:integrations` e `npm run verify:ai` após os testes de
   integração e antes do build.

## Teste esperado / executado

- `python -c "yaml.safe_load(...)"` nos dois workflows alterados → YAML OK.
- `node --check scripts/ci/validate-sonarqube-config.mjs` → OK.
- Não executado localmente: suíte de integração completa exige Postgres/Redis
  reais e a geração real do verify:ai exige credenciais LLM — a validação
  efetiva ocorre no próprio CI deste PR.

## Contexto adicional / decisões a registrar

- **verify:ai bloqueante**: no ci.yml `GROQ_API_KEY`/`OPENAI_API_KEY` já estão
  no env do job (secrets), então o script faz geração real (~2 chamadas por
  run — custo marginal). Se flakiness de LLM derrubar PRs, rebaixar para
  `continue-on-error: true` é decisão do 00 (custo × gate).
- **verify:integrations** chama `brasilapi.com.br` (endpoint público sem
  chave) em todo run — dependência externa nova no gate; provedor pago sem
  credencial retorna SKIPPED por design. Se a BrasilAPI ficar instável,
  avaliar skip condicional — decisão do 00.
- `package.json`/lockfile não foram tocados (não foi necessário).
- O workflow `onda-2.5-validation.yml` foi mantido intacto (não é gate de main).
