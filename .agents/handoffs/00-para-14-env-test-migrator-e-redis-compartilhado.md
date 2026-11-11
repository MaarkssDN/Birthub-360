# Handoff — Ambiente de teste: credencial migrator stale + Redis/Meili compartilhados

De: 00 — Coordenador
Para: 14 — Ambiente de Execução e Test Harness
Onda: pós-homologação 2026-11-10
Status: aberto
Prioridade: alto
Sprint destino: próximo ciclo de infra de testes

## Problema

1. **`prospector_migrator` falha autenticação** no Postgres remoto
   (`192.168.0.116:5434`). Evidência: `vitest run tests/integration/leads.test.ts`
   — o teste passou, mas a suite falhou com
   `password authentication failed for user "prospector_migrator"`
   (origem: `DIRECT_URL` do `.env.test` local, gitignored).
   `prospector_app` (DATABASE_URL) autentica normalmente.

2. **Redis e Meilisearch de teste são as mesmas instâncias de dev**
   (`192.168.0.116:6379` e `:7700`, mesmas credenciais). Testes de
   integração/E2E escrevem em cache compartilhado com o trabalho diário —
   risco de contaminação de chaves, falsos positivos e flush acidental.

## Arquivo(s) envolvido(s)

- `.env.test` (local, gitignored) — `DIRECT_URL` com senha divergente do
  esperado pelo Postgres remoto.
- `.env.test.example` — exemplo localhost (correto); a reescrita para host
  remoto já existe em `scripts/test/prepare-integration-env.js`.
- `scripts/db/bootstrap-app-role.sh` + `create-app-role.sql` — procedimento
  que cria/alinha `prospector_migrator`/`prospector_app`.
- `docker-compose.yml` — Redis/Meili sem separação dev/test.

## Evidência

- Saída do vitest integration (2026-11-10): `Failed Suites 1` /
  `PrismaClientKnownRequestError`/`DatabaseAccessDenied` role migrator.
- Comparação `.env` vs `.env.test` (hosts/roles documentados no relatório
  `.agents/runs/2026-11-10-pos-homologacao-relatorio-00.md` §2.2/§4.2).

## Alteração necessária

1. Realinhar a senha de `prospector_migrator` no `.env.test` local com o
   papel existente no Postgres remoto (rodar `bootstrap-app-role.sh` com
   `MIGRATOR_DB_PASSWORD` correto, ou ajustar o `.env.test`).
2. Decidir estratégia de isolamento de Redis/Meili para testes:
   - opção A: database/prefixo de chaves `test:` nos clientes quando
     `NODE_ENV=test`;
   - opção B: instância Redis/Meili dedicada no compose de teste.
3. Documentar o procedimento no `tests/AGENTS.md` se mudar.

## Teste esperado

- `npx dotenv-cli -e .env.test -- npx vitest run -c vitest.integration.config.ts tests/integration/leads.test.ts`
  → suite verde sem erro de auth no teardown.
- `npm run test:integration` completo → verde.

## Contexto adicional

- A trava `assertTestDatabaseSafety` já garante sufixo `_test` e bloqueio de
  hosts prod — a separação lógica existe; o problema é credencial stale e
  serviços compartilhados.
- Produção não é afetada (sem `.env.production` local; prod na AWS).
