# RUN — Agente 93 (Max) · Squad 90 · DEM-20261123-001

**Data:** 2026-11-24
**Runtime:** Devin (subagente)
**Branch:** `agente/93-docker-hardening-s90`
**Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-90/wt-93`
**Base:** `integracao/onda-3-dem20261123` @ `5422d99c3e`
**Lease:** `.agents/runs/leases/squad-90-wt93.lease` (portas 22900-22999 — nenhuma usada; trabalho 100% estático)
**Junction:** `node_modules` → `C:\Github\Birthub-360\node_modules`

## Missão
Auditoria do Dockerfile + docker-compose*.yml no HEAD convergido, comparação com requisitos P0-07, melhorias cirúrgicas dentro do ownership, validação sem daemon.

## Arquivos alterados/criados
- `Dockerfile` — pin por digest `node:22-slim@sha256:be979e55…` nos estágios builder e runner (+comentário de atualização).
- `docker-compose.yml` — bind `127.0.0.1` em todas as 7 portas publicadas; pins de imagem: `redis:7-alpine@sha256:7f7d30b7…`, `getmeili/meilisearch:v1.6@sha256:634e83ff…`, `elestio/minio:latest@sha256:25348a25…` (única tag existente é `latest`), `ghcr.io/berriai/litellm:main-stable@sha256:1050d2c9…`, `ollama/ollama:0.40.18`, `alpine:3.21`.
- `tests/unit/ci/docker-hardening.test.ts` — **novo**, 8 testes de regressão (co-propriedade `tests/unit/**` da matriz).
- `.agents/handoffs/squad-90/93-para-90-docker-hardening-e-gaps-20261124.md` — handoff ao coordenador.
- `.agents/runs/leases/squad-90-wt93.lease` — lease do worktree.

## Auditoria — checklist

| Item | Estado |
|---|---|
| Usuário não-root | OK — `USER node` (uid 1000) no runner; `chown -R node:node /app` antes |
| Secrets em build args/ENV | OK — nenhum `ARG`/`ENV` com segredo; `ENV DATABASE_URL=""` é placeholder vazio do builder |
| Healthcheck | OK — `HEALTHCHECK` nativo `/health/live` (interval 30s, retries 3); compose tem healthcheck em redis, meili, minio, litellm, ollama |
| Multi-stage | OK — `builder` → `runner`, `npm prune --omit=dev`, cópias seletivas via `--from=builder` |
| Arquivos desnecessários na imagem | OK — `.dockerignore` robusto (exclui `.git`, `.env*`, `.agents`, `tests`, `node_modules`, `dist` do contexto); verificado por `scripts/verify-docker-context.mjs` |
| Pins de versão | **Corrigido** — antes: `node:22-slim` móvel nos 2 estágios; compose com `:latest` em minio/alpine/ollama e tags móveis em redis/litellm. Depois: digests verificados no Docker Hub/GHCR (2026-11-24) |
| P0-07 (estáticos protegidos) | OK — gate de build já presente (`test ! -e dist/tools …` + asserção SW precache/NetworkOnly); nginx (`birthhub360.conf`, dono 90) já faz proxy de `/tools|/design-lab` ao backend com `Cache-Control: private, no-store` e `/sw.js` no-store |

## Comparação com "runbook P0-07"
**`docs/security/runbooks/P0-07-ROLLOUT-ESTATICOS-PROTEGIDOS-20261123.md` não existe** no HEAD nem no histórico de nenhum branch. Artefatos reais: `docs/security/AUDITORIA_DOCKER_P007_ONDA2_20261123.md` + `nginx/birthhub360.conf` + gate no Dockerfile — todos conformes. Registrado no handoff §3.3.

## Comandos executados e resultados
- `git worktree add … -b agente/93-docker-hardening-s90 integracao/onda-3-dem20261123` → OK (`5422d99c3e`)
- `mklink /J node_modules` → OK
- Parse YAML dos 5 compose files → OK
- `docker compose -f docker-compose.yml config` (sem vars obrigatórias) → falha intencional `:?` (esperado); com vars dummy → exit 0; render confirma `host_ip: 127.0.0.1`
- `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.opensource.yml -f docker-compose.services.yml config` → exit 0
- `node scripts/verify-docker-context.mjs` → PASS
- `npx vitest run tests/unit/ci/docker-hardening.test.ts tests/unit/ci/dockerfile-prisma-pin.test.ts` → **14/14 PASS** (duração ~145s, majoritariamente transform/setup)
- `npx eslint` no arquivo de teste → ESLint 9 sem config flat; `npm run lint` = `biome lint src` (fora do escopo do arquivo em `tests/`)
- `hadolint` → indisponível; análise manual documentada acima

## Não executado (e por quê)
- `docker build`/`docker run`/`docker compose up` — daemon indisponível; TCP 2375 proibido pela missão.
- `npm run typecheck`/`test:unit` completo — mudanças restritas a Dockerfile/compose/teste isolado; vitest do escopo passou. Typecheck não se aplica (sem alteração em `src/`).

## Riscos e pendências
1. **Overlays compose sem dono na matriz** (`docker-compose.{services,opensource,postgres-local,qdrant}.yml`, `docker/postgres/Dockerfile`) — achados de segurança relevantes (ver handoff §3.2: `:latest` generalizado, defaults de senha, credencial literal `prospector:prospector_pass` em `DATABASE_URL` do langfuse). Aguardando decisão do coordenador 90.
2. `docker/AGENTS.md` e `infrastructure/AGENTS.md` contêm referências defasadas a "Agente 08/10" — reconciliar com a matriz.
3. Pins por digest envelhecem — política de atualização trimestral sugerida.
4. Sem push, sem deploy, sem alteração em `integracao/*` — conforme regras.

## Handoff emitido
`.agents/handoffs/squad-90/93-para-90-docker-hardening-e-gaps-20261124.md`
