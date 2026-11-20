# Relatório 14 — Harness Playwright local (handoff 00-para-14-env-test-playwright-local)

Agente / Onda / Branch: 14 — Ambiente de Execução e Test Harness / Onda 1 / claude/sleepy-hamilton-umhot9

## Suposições feitas
- Docker indisponível (sem socket). Postgres 16 + pgvector e Redis instalados/rodando como processos locais.
- Meilisearch NÃO provisionado (opcional): o app subiu ("Failed to obtain server version" no log do WebServer) e auth/axe passaram sem ele. Efeito: busca/indexação indisponíveis; specs que dependam de busca real não foram exercitados (NÃO EXECUTADO).
- Valores de .env.test gerados com `openssl rand`, descartáveis, não impressos.

## Plano executado
| Etapa | Critério | Resultado |
|---|---|---|
| `git check-ignore .env.test` | ignorado | OK (.env.test não existia; criado local, modo 600) |
| docker | disponível? | NÃO (daemon ausente) -> fallback local |
| `apt-get update && apt-get install -y postgresql-16-pgvector` | extensão disponível | OK (0.6.0) |
| initdb + pg_ctl em `/tmp/pgd/data`, porta 5434; `create database prospectordb_test`; `create extension vector` | serviço no ar | OK |
| `redis-server --port 6379 --daemonize yes` | `redis-cli ping` | PONG |
| `bootstrap-app-role.sh localhost 5434 prospector prospectordb_test` (PGPASSWORD/APP_DB_PASSWORD/MIGRATOR_DB_PASSWORD locais) | papéis criados | OK |
| `npx prisma generate` | gerado | OK |
| `npx dotenv-cli -e .env.test -- npx prisma migrate deploy` | migrações aplicadas | "All migrations have been successfully applied" |
| `npx playwright install` | NÃO executado (chromium pré-instalado) | usado `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` |
| `npx dotenv-cli -e .env.test -- npx playwright test tests/e2e/auth.spec.ts --trace off` | verde | TESTADO: 4 passed (1.0m) |
| mesmo comando para `tests/e2e/accessibility.spec.ts` | verde | TESTADO: 34 passed (4.2m) |

## Arquivos alterados
- Criado (local, gitignored, não versionável): `.env.test`
- Versionados: este relatório e o handoff (seção Resolução). Nenhum src/, .github/, snapshots, package.json tocado. `git status` não mostra .env.test.
- Dados de runtime fora do repo: `/tmp/pgd` (cluster PG, senha do superusuário em `/tmp/pgd/.su`).

## Testes
auth.spec.ts 4/4; accessibility.spec.ts 34/34 (axe critical/serious, incl. pré-login). `mobile-sweep.spec.ts`, `visual.spec.ts`: NÃO EXECUTADO (visual/snapshots fora do pedido; sem --update-snapshots).

## Problemas fora do escopo
- Aviso `pg` DeprecationWarning (client.query concorrente) no WebServer — PRÉ-EXISTENTE, não tratado.
- Handoff ao 08 sobre detecção de escopo visual no CI: não aberto por este agente.

## Handoffs abertos
Nenhum novo.

## Aprendizados reutilizáveis
- Sem docker, `postgresql-16` já vem no container; basta `apt-get update && apt-get install postgresql-16-pgvector` (migração 20260717141021 exige `vector`).
- Postgres precisa rodar como usuário não-root (`su postgres`), socket dir via `-k`.
- Executável do chromium: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` via `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Pendências
- Meilisearch (opcional). Revisão do Agente 24 sobre este relatório (§40) — NÃO EXECUTADA.
- Serviços são processos efêmeros: reiniciar após reinício do container (ver abaixo).

## Riscos
- Banco em /tmp: perdido em reboot; reprovisionar.

## Como reproduzir (sem expor segredos)
Cluster NOVO (`/tmp/pgd/data` não existe). Se o cluster já existe, use o bloco "Reinício" mais abaixo (não gere `.su` nem rode `initdb`).
```
apt-get update && apt-get install -y postgresql-16-pgvector
install -d -o postgres /tmp/pgd; openssl rand -hex 12 > /tmp/pgd/.su; chown postgres /tmp/pgd/.su; chmod 600 /tmp/pgd/.su
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgd/data -U prospector --pwfile=/tmp/pgd/.su --auth=scram-sha-256 && /usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgd/data -o '-p 5434 -k /tmp/pgd' -l /tmp/pgd/log -w start"
redis-server --port 6379 --daemonize yes
PGPASSWORD=$(cat /tmp/pgd/.su) psql -h localhost -p 5434 -U prospector -d postgres -c "create database prospectordb_test"
PGPASSWORD=$(cat /tmp/pgd/.su) psql -h localhost -p 5434 -U prospector -d prospectordb_test -c 'create extension vector'
# gerar APP/MIGRATOR com openssl rand, escrever .env.test conforme o handoff, e:
PGPASSWORD=$(cat /tmp/pgd/.su) APP_DB_PASSWORD=<gerado-localmente> MIGRATOR_DB_PASSWORD=<gerado-localmente> bash scripts/db/bootstrap-app-role.sh localhost 5434 prospector prospectordb_test
npx prisma generate && npx dotenv-cli -e .env.test -- npx prisma migrate deploy
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx dotenv-cli -e .env.test -- npx playwright test tests/e2e/auth.spec.ts --trace off
```

### Reinício (cluster existente em /tmp/pgd/data)
Preserva `/tmp/pgd/.su` e o `.env.test`; não rode `openssl rand` para o `.su` nem `initdb`:
```
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgd/data -o '-p 5434 -k /tmp/pgd' -l /tmp/pgd/log -w start"
redis-server --port 6379 --daemonize yes
```
Se o container foi recriado e `/tmp/pgd` sumiu, volte ao bloco de cluster novo. (Ajuste 00 após comentários do CodeRabbit no PR #420: comando do `create extension` completo e caminho de reinício.)
