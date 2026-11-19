De: 00
Para: 14
Onda: 1
Status: em-andamento
Prioridade: alto
Bloqueador-ref: GOV-003 (Fase Zero, Operação Birthub Experience 360)
Sprint destino: Onda 1

## Problema
Não é possível executar localmente `test:e2e`, `test:visual` e axe: falta `.env.test` e a infraestrutura de teste (Postgres com papéis, Redis, Meilisearch). Sem isso, o inventário visual (desktop/mobile × light/dark) das rotas `/app/*` e a auditoria A11Y-001 não podem ser comprovados em execução.

## Arquivo(s) envolvido(s)
`playwright.config.ts` (webServer: `npx dotenv-cli -e .env.test -- tsx tests/e2e/e2e-server.ts`, porta `PORT`), `tests/e2e/global-setup.ts`, `scripts/db/bootstrap-app-role.sh`, `.github/workflows/visual-regression.yml` (referência de CI; dono 08, NÃO editar).

## Evidência
O CI já provisiona tudo isso (visual-regression.yml, job `Visual Regression`): Postgres `pgvector/pgvector:pg16` na porta 5434 (db `prospectordb_test`), Redis 7 em 6379, Meilisearch v1.12 em 7700, `bootstrap-app-role.sh`, `npx prisma migrate deploy`, `npx playwright install chromium`. `psql`, `redis-server` e `docker` existem no container da sessão do 00, mas nada foi provisionado.

## Alteração necessária
Criar `.env.test` LOCAL (gitignored; NUNCA commitar) com valores descartáveis de teste, espelhando o CI:
```
NODE_ENV=test
PORT=3000
DATABASE_URL=postgresql://prospector_app:<senha-app-local>@localhost:5434/prospectordb_test?schema=public
DIRECT_URL=postgresql://prospector_migrator:<senha-migrator-local>@localhost:5434/prospectordb_test?schema=public
REDIS_URL=redis://localhost:6379
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<valor-local-descartavel>
BETTER_AUTH_SECRET=<string-aleatoria-local>
BETTER_AUTH_URL=http://localhost:3000
ALLOW_DEV_AUTH_BYPASS=true
ALLOWED_ORIGINS=http://localhost:3000
AUTH_RATE_LIMIT_MAX=5000
PLATFORM_OPERATOR_TOKEN=<valor-local-descartavel>
```
Passos: subir os 3 serviços; `bash scripts/db/bootstrap-app-role.sh localhost 5434 prospector prospectordb_test` (com `PGPASSWORD`, `APP_DB_PASSWORD`, `MIGRATOR_DB_PASSWORD` locais); `npx prisma generate`; `npx dotenv-cli -e .env.test -- npx prisma migrate deploy`; `npx playwright install chromium`; validar com `npx dotenv-cli -e .env.test -- playwright test tests/e2e/auth.spec.ts`.
Restrições: usar apenas valores gerados localmente; não reutilizar segredos reais de produção/homologação; não commitar `.env.test`; não regenerar snapshots (`visual.spec.ts-snapshots`, `visual-regression/baselines` pertencem ao fluxo do PR #419).

## Teste esperado
`auth.spec.ts` verde localmente; depois `accessibility.spec.ts` e `mobile-sweep.spec.ts` para o inventário A11Y/responsivo. Registrar comandos e saídas em `.agents/runs/`.

## Contexto adicional
Achado de CI: o job `Detectar escopo visual` calcula `git diff BASE_SHA...HEAD` sobre o merge ref; quando a `main` avança depois da base do PR, arquivos de `src/` vindos da `main` marcam `relevant=true` e disparam Visual Regression mesmo em PR só de documentação (ex.: PR #420). Sugestão ao 08: comparar contra `github.event.pull_request.head.sha`/`merge-base` ou `pull_request` files API. Handoff separado a abrir pelo 08.

## Resolução (Agente 14, 2026-11-19, atualização)
Status: em-andamento (aguarda parecer do 24; achados do inventário encaminhados ao 00).
- Reprovisionado após queda dos processos: Postgres 16 + pgvector (5434, dados em /tmp/pgd preservados) e Redis (6379); `prisma migrate deploy`: sem migrações pendentes. `.env.test` local (gitignored) intacto.
- TESTADO (reexecução): `auth.spec.ts` 4 passed (41s); `accessibility.spec.ts` 34 passed (3,8m); `mobile-sweep.spec.ts` 1 passed (54,7s).
- TESTADO (observação): inventário visual de 70 rotas `/app/*` (4 variantes: 1280x800/390x844 x claro/escuro) + axe + contraste de títulos A11Y-001: 0 overflow a 390px; 19 rotas com axe crítico/sério; 1 título claro reprovado (`/app/characters`, 1,52:1). Relatório: `.agents/runs/14-inventario-visual-app-20261119.md`.
- NÃO EXECUTADO: visual com snapshots; papéis não-ADMIN; Meilisearch; revisão do 24.
- Passos anteriores e evidências: `.agents/runs/14-harness-playwright-local-20261119.md`.
