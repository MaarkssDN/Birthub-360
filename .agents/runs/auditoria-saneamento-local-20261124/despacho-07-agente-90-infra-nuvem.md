# DESPACHO 07 — RELATÓRIO: INVENTÁRIO DE DEPENDÊNCIAS LOCAIS PARA TRANSIÇÃO À NUVEM

- **Sessão:** `devin-subagent-despacho07-20261124`
- **Início:** 2026-11-24 ~17:40 · **Fim:** 2026-11-24 ~18:20 (horário local)
- **Agente:** 90 — Hélio (Coordenador de Infra, SRE & SecOps)
- **Runtime:** Devin subagent · **SHA base:** clone D: `D:\Github\Birthub-360` (HEAD em `head__d_Github_Birthub-360.txt` da auditoria)
- **Artefatos:** `manifests/despacho07-dependencias-nuvem.md` (matriz completa D1–D9 + serviços opcionais + integrações + SO)
- **Método:** somente leitura — `docker ps/volume ls` (falhou: daemon off), `netstat`, `tasklist`, `which`, leitura de configs, `find` de `.db/.sqlite/.pem`, `grep` de caminhos absolutos. Nenhum serviço alterado, nada deletado, nenhum segredo impresso.

## 1. Resumo executivo

A stack local é **100% containerizada via Docker Compose versionado** — não há PostgreSQL/Redis nativos no Windows. Porém, **neste momento nenhum serviço está rodando**: o daemon Docker está indisponível (contexto remoto `tcp://192.168.0.116:2375` sem resposta; Docker Desktop local sem pipe), e `netstat` confirma zero portas de serviço em LISTENING. Toda a persistência vive em volumes Docker hoje inacessíveis.

O `.env` de desenvolvimento aponta `DATABASE_URL`/`DIRECT_URL` para `localhost:5434` (Postgres local em container, `prospectordb` + `prospectordb_test`) — divergindo do ADR-004 histórico (Postgres remoto Oracle, hoje aposentado). O produto opera em **modo Local-First**; todos os caminhos de produção em nuvem foram formalmente desativados (`docs/deploy/README.md`). A "transição para nuvem" é portanto um alvo novo que exige decisão de produto.

## 2. Estado real medido (não presumido)

| Item | Estado |
|---|---|
| Docker (`samsung` → 192.168.0.116:2375) | **INDISPONÍVEL** — i/o timeout |
| Docker Desktop (`desktop-linux`, `default` npipe) | **SEM DAEMON** — pipe inexistente |
| Postgres :5434 / :5432 | sem LISTENING; sem `psql`/`pg_isready` no host |
| Redis :6379 | sem LISTENING; sem `redis-server.exe` |
| Meili :7700/:7701, MinIO :9000/:9001, Qdrant :6333/:6334, LiteLLM :4000, Ollama :11434 | todos sem LISTENING |
| Processos | nenhum `com.docker*`, `postgres.exe`, `redis-server.exe` |
| Binários host | node 22 (PATH), python 3.14; **ausentes**: psql, redis-cli, sqlite3, ffmpeg, java |
| Playwright browsers | presentes em `%LOCALAPPDATA%\ms-playwright` (chromium-1243, headless_shell-1243, ffmpeg-1011) |
| `.venv-opensource` (Schemathesis) | **inexistente** no clone D: — `test:api-schema` quebrado localmente |
| SQLite | **não existe** — nenhum `.db/.sqlite` nos clones; `better-sqlite3` é só peer opcional do Prisma |
| Certificados locais | nenhum `.pem/.key/.p12/.pfx` versionado ou solto nos clones |

## 3. Dependências críticas para a nuvem

### 3.1 Dados que NÃO podem ser perdidos (EXIGE-MIGRAÇÃO/BACKUP)

1. **`birthhub_pgdata`** — Postgres 17+pgvector com `prospectordb` (dev) e `prospectordb_test`. Schema é 100% reproduzível (`prisma migrate deploy`, 163 migrations), mas **o conteúdo pode incluir dados reais** do modo Local-First (organizações, contatos, integrações 3CX com credenciais, consentimentos LGPD). **Impossível classificar sem acesso ao volume — bloqueador #1.**
2. **`birthhub_miniodata`** — bucket `prospector-assets`: uploads, propostas, **gravações de áudio do Copiloto IA** (LGPD-relevante). A camada `src/lib/storage` já é S3-genérica → destino natural: S3/R2/Supabase Storage.
3. **`birthhub_qdrant_data`** — vetores/funnel embeddings. Recomputável a partir do Postgres, mas snapshot é mais barato.
4. **`.env` com 66 segredos** — incluindo `CREDENTIALS_ENCRYPTION_KEY` e `PII_BLIND_INDEX_KEY`: **perda = dados cifrados permanentemente irrecuperáveis**. Prioridade máxima: migrar para cofre (Infisical já é dependência do stack!) antes de desligar.
5. **`BITRIX_EXTRACTION_STORAGE_DIR`** — extrações Bitrix em filesystem local; inventariar antes do desligamento.
6. **Volumes dos serviços self-hosted** (`flowise`, `open-webui`, `n8n`, `chatwoot`, `plane`, `infisical`, `casdoor`, `superset`, `uptime-kuma`, `langfuse/clickhouse`) — se algum estiver em uso real, contém credenciais/dados que só existem ali.

### 3.2 Reconstruível automaticamente (RECONSTRUÍVEL-AUTOMATICAMENTE)

- Todo o schema e seed (`prisma/migrations`, `prisma/seed.ts`, `scripts/db/bootstrap-app-role.sh`)
- Redis (filas BullMQ recriadas; outbox dispatcher reproduz), Meilisearch (reindex do Postgres)
- LiteLLM config (`litellm-config.yaml` versionado), todos os serviços opcionais via compose
- Ambiente de teste E2E: Postgres `prospectordb_test` + Redis + `migrate deploy` + Playwright — **o CI já prova isso em Linux** (`ci.yml` service containers)
- Observabilidade completa (Prometheus/Grafana/Loki/Tempo/Alertmanager via `docker-compose.opensource.yml`)

### 3.3 Dependência de SO a resolver

- **Caminhos Windows hardcoded** em scripts auxiliares: `scripts/test/run-k6-ai-voice-stress.mjs` (k6.exe), `scripts/test-all-routes.cjs` e `scripts/capture-screens.mjs` (Chrome.exe, Desktop do usuário), `scripts/generate-final-manual-html.cjs` (`C:\Github\...`). Workflows de CI estão **limpos** — impacto restrito a scripts manuais.
- **`.venv-opensource`** Windows-only para Schemathesis — precisa de equivalente Linux/container.
- **Android/iOS**: toolchains pesadas; CI já possui `android-build.yml`/`ios-build.yml` — usar runners cloud, não portar SDK local.
- Node 22.14.0 via devcontainer/nvm — trivial.

## 4. Plano técnico de transição (ordem de provisão)

**Fase 0 — Salvamento (antes de qualquer desligamento):**
1. Subir daemon Docker (local ou recuperar acesso a 192.168.0.116:2375) → `docker ps -a`, `docker volume ls`.
2. `pg_dump` de `prospectordb` (+ decisão sobre `prospectordb_test` = descartável) para storage off-machine.
3. Snapshot/cópia de `birthhub_miniodata` (ou `mc mirror` do bucket) e `birthhub_qdrant_data`.
4. Inventariar `BITRIX_EXTRACTION_STORAGE_DIR` e volumes dos serviços opcionais em uso.
5. Exportar `.env`/`.env.test` para o cofre de segredos escolhido (Infisical self-hosted já existe no stack — candidato natural a cofre cloud).

**Fase 1 — Ambiente cloud de desenvolvimento (recomendado: Codespaces/devcontainer ou VM):**
6. Postgres gerenciado (ou container) com pgvector + roles via `bootstrap-app-role.sh`.
7. Redis container/gerenciado; `REDIS_URL`/`DATABASE_URL`/`DIRECT_URL` via secrets do ambiente.
8. Object storage S3 (bucket novo) — apontar `STORAGE_*`; migrar objetos do MinIO dumpado.
9. Meilisearch + Qdrant containers (ou cloud); LiteLLM opcional.
10. `npm ci` (Node 22) → `prisma migrate deploy` → `prisma/seed.ts` → gates (`typecheck`, `lint`, `test:unit/integration/e2e`).

**Fase 2 — Integração/E2E:**
11. Subir stack de teste mínima (Postgres `_test` + Redis + Playwright) — replicar `prepare-integration-env.js`.
12. Secrets de sandbox: Stripe test, Bitrix24 webhook de teste, WhatsApp/Meta test number.
13. CI já cobre Linux — conectar o novo ambiente ao pipeline existente.

**Fase 3 — Produção (se decidida):**
14. Decisão humana pendente: reativar cloud (Render/Neon arquivados como referência) ou novo alvo (AWS — existe `deploy-aws.yml.disabled` e `charts/` Helm aspiracional).
15. SLOs/SLAs, runbook de rollback e change plan com aval humano (escopo do Agente 90).

## 5. Bloqueadores

| # | Bloqueador | Severidade | Dono sugerido |
|---|---|---|---|
| B1 | Docker daemon indisponível → volumes e bancos inacessíveis; impossível confirmar se há dados reais | **ALTA** | Hélio + decisão humana (ligar Docker Desktop ou acessar host 192.168.0.116) |
| B2 | 66 segredos apenas em `.env` local; chaves de cifragem irreversíveis se perdidas | **ALTA** | Safira (98) + Hélio |
| B3 | Produção é Local-First por decisão — nuvem como destino de dev vs. produção é decisão de produto | MÉDIA | Astra (00) → humano |
| B4 | `BITRIX_EXTRACTION_STORAGE_DIR` e volumes de serviços opcionais não inventariados (daemon off) | MÉDIA | Hélio |
| B5 | Paths Windows hardcoded e `.venv-opensource` — portabilidade de scripts auxiliares | BAIXA | Bento/Téo conforme uso |
| B6 | Divergência C:×D: e 253 commits não publicados (Relatório 5/6) — pré-requisito para qualquer clone cloud | **ALTA** | já registrado na auditoria |

## 6. Decisões pendentes (para o Coordenador)

1. Qual é o alvo de nuvem? (Codespaces/devcontainer para dev · VM/compose self-hosted · cloud gerenciado PaaS · AWS — há IaC/Helm aspiracional)
2. O Postgres local contém dados reais a preservar ou é só dev/demo? **Sem resposta, assumir "preservar".**
3. Qual cofre de segredos? (Infisical self-hosted é dependência do próprio stack; GitHub Secrets; 1Password)
4. Serviços opcionais (`docker-compose.services.yml`, `opensource.yml`) entram no ambiente cloud ou ficam sob demanda?
5. Autorização para ligar/inventariar o daemon Docker — sem isso, Fase 0 está bloqueada.

## 7. Conformidade

- Nenhum arquivo fora do prefixo `despacho07-*`/escopo foi alterado. Escritos: este relatório + `manifests/despacho07-dependencias-nuvem.md`.
- Nenhum serviço iniciado/parado/removido; apenas leitura. Nenhum segredo impresso (hosts/portas e nomes de variáveis apenas).
- Ownership respeitado: artefatos em `.agents/runs/auditoria-saneamento-local-20261124/`.
