# HANDOFF 93 → 90 — Auditoria e hardening Docker/Compose (DEM-20261123-001)

**De:** Agente 93 — Max (Containers e Builds Docker, Squad 90)
**Para:** Agente 90 — Hélio (Coordenador Squad 90)
**Data:** 2026-11-24
**Branch:** `agente/93-docker-hardening-s90` (worktree `wt-93`)
**Demanda:** DEM-20261123-001 · Onda 3 do Squad 90

---

## 1. Entregue neste branch (ownership do 93: `Dockerfile`, `docker-compose.yml`)

| Arquivo | Mudança |
|---|---|
| `Dockerfile` | `node:22-slim` pinado por digest (`@sha256:be979e55…`) nos dois estágios (builder + runner), com instrução de atualização no comentário. |
| `docker-compose.yml` | Todas as portas publicadas agora fazem bind em `127.0.0.1` (redis 6379, meili 7700, minio 9000/9001, litellm 4000, ollama 11434) — antes escutavam em `0.0.0.0`, expondo a stack dev à LAN. Comunicação entre containers não é afetada (rede interna por nome de serviço). |
| `docker-compose.yml` | Pins de imagem: `redis:7-alpine@sha256:…`, `getmeili/meilisearch:v1.6@sha256:…`, `elestio/minio:latest@sha256:…` (repo só tem tag `latest` — pin por digest é a única opção), `ghcr.io/berriai/litellm:main-stable@sha256:…`, `ollama/ollama:0.40.18` (era `:latest`), `alpine:3.21` (era `:latest` no minio-init). Digests verificados no Docker Hub/GHCR em 2026-11-24. |
| `tests/unit/ci/docker-hardening.test.ts` | **Novo** gate estático (co-propriedade `tests/unit/**`): multi-stage, `USER node`, HEALTHCHECK, ausência de ARG/ENV de segredo, pin por digest nas FROMs, bind 127.0.0.1 em todas as portas e pins de imagem no compose. 8 testes, todos verdes junto com `dockerfile-prisma-pin.test.ts` (14/14). |

## 2. Validação executada (sem daemon Docker)

- `docker compose config` (Compose v5.7.0, sem daemon): **OK** — `docker-compose.yml` isolado e combinado com `postgres-local` + `opensource` + `services` (exit 0). Sem as vars `MINIO_ROOT_PASSWORD`/`LITELLM_MASTER_KEY` o config falha de propósito (`:?` fail-fast — comportamento intencional, documentado).
- `docker compose config` renderizado confirma `host_ip: 127.0.0.1` em todas as portas publicadas.
- `node scripts/verify-docker-context.mjs`: **PASS**.
- `npx vitest run tests/unit/ci/docker-hardening.test.ts tests/unit/ci/dockerfile-prisma-pin.test.ts`: **14/14 PASS**.
- Parse YAML dos 5 compose files via `yaml`: OK.
- `hadolint`: indisponível no host — análise manual do Dockerfile registrada no run doc. `docker build`/`run` não executados (daemon indisponível; TCP 2375 proibido).

## 3. Gaps encontrados FORA do ownership do 93 — pedem decisão do coordenador

### 3.1 Arquivos compose sem dono na MATRIZ_PROPRIEDADE.md
A matriz (`.agents/MATRIZ_PROPRIEDADE.md` §Squad 90) lista para o 93 apenas `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**`. **Sem dono registrado:**
- `docker-compose.services.yml` (19 KB, ~20 serviços: flowise, n8n, temporal, superset, casdoor, infisical, qdrant, livekit, chatwoot, uptime-kuma, pocketbase, plane, faster-whisper, kokoro-tts)
- `docker-compose.opensource.yml` (langfuse, clickhouse, otel, tempo, loki, prometheus, grafana, k6, zap, trivy)
- `docker-compose.postgres-local.yml`, `docker-compose.qdrant.yml`
- `docker/postgres/Dockerfile` — `docker/AGENTS.md` local diz "Agente 10" (numeração legada) e afirma que Dockerfile/compose da raiz são do "Agente 08" — **ambos defasados** vs. matriz vigente (93). Recomendo reconciliar `docker/AGENTS.md` e registrar dono dos overlays (sugestão: 93 para compose*, 10 para `docker/postgres/**` ou novo glob `docker/**` do 93).

### 3.2 Achados de segurança nos overlays (não editados — sem ownership)
- **`docker-compose.services.yml`:** múltiplas imagens `:latest` sem pin (`flowiseai/flowise`, `n8nio/n8n`, `temporalio/*`, `apache/superset`, `casbin/casdoor`, `infisical/infisical`, `qdrant/qdrant`, `livekit/livekit-server`, `chatwoot/chatwoot`, `louislam/uptime-kuma`, `makeplane/plane-*`, `fedirz/faster-whisper-server`, `ghcr.io/muchobien/pocketbase`, `ghcr.io/remsky/kokoro-fastapi-cpu:v0.2.1` já pinada). Senhas com default fraco (`change-this-*`, `prospector_app_pass`, `devkey`). LiveKit roda com `--dev`.
- **`docker-compose.opensource.yml`:** `langfuse/langfuse:3` (tag móvel), `elestio/minio:latest`, `alpine:latest`, `grafana/k6:latest`, `aquasec/trivy:latest`, `ghcr.io/zaproxy/zaproxy:stable`; defaults de segredo (`change-this-langfuse-*`, `clickhouse-local-password`, `prospector_pass` hardcoded em `DATABASE_URL` do langfuse linha 15 — **credencial literal versionada**, ainda que dev).
- **`docker-compose.postgres-local.yml`:** `pgvector/pgvector:pg17` (tag móvel de minor); defaults de senha documentados como dev-only.
- **`docker-compose.qdrant.yml`:** `qdrant/qdrant:latest`.

### 3.3 Runbook P0-07 citado na missão não existe
`docs/security/runbooks/P0-07-ROLLOUT-ESTATICOS-PROTEGIDOS-20261123.md` **não existe** no HEAD convergido nem em nenhum branch/histórico (`git rev-list --all` sem ocorrências). Os artefatos reais do P0-07 são:
- `docs/security/AUDITORIA_DOCKER_P007_ONDA2_20261123.md` (auditoria do 93 na Onda 2)
- `nginx/birthhub360.conf` (dono: 90) — já conforme: `location ~* ^/(tools|design-lab)` faz proxy ao backend com `Cache-Control: private, no-store`, `/sw.js` com `no-cache`, denylist no SW.
- Gate de build P0-07 já presente no Dockerfile (`RUN test ! -e dist/tools …` + asserção do precache SW).
**Conclusão:** nenhum gap de P0-07 restante nos arquivos do 93. Se a missão esperava um runbook formal de rollout, ele precisa ser criado — docs/ pertence ao Agente 08/Dora; sugiro handoff ou que o coordenador confirme se o nome do arquivo estava errado.

## 4. Não-objetivos / decisões

- **Não** alterei defaults de senha (`:-`) para `:?` em redis/meilisearch: `.env.example` deixa `MEILI_MASTER_KEY=` vazio e o `:?` falharia para devs que copiam o example — mudaria comportamento de workflow semântico, fora do escopo cirúrgico. `minio`/`litellm` já eram `:?` e foram mantidos.
- **Não** fiz bind de portas nos overlays (fora do ownership).
- Digests pinados expiram com o tempo (tags móveis `latest`/`main-stable`/`7-alpine`/`v1.6` continuam existindo — o pin só congela o conteúdo). Política de atualização: trimestral ou por bump deliberado, registrado no run doc.

## 5. Pendências para o coordenador

1. Decidir dono dos 4 compose overlays + `docker/postgres/Dockerfile` e reconciliar `docker/AGENTS.md` (texto defasado).
2. Se aprovado, despachar hardening dos overlays (pode ser o próprio 93 se a matriz for atualizada, ou agente de infra designado).
3. Confirmar inexistência do runbook P0-07 citado na missão.
