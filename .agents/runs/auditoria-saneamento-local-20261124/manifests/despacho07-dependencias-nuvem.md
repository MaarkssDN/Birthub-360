# DESPACHO 07 — Matriz de dependências locais → nuvem
**Sessão:** devin-subagent-despacho07-20261124 · **Data:** 2026-11-24 · **Agente:** 90 — Hélio (Infra/SRE/SecOps)
**Escopo:** inventário somente-leitura dos clones C:\Github\Birthub-360 e D:\Github\Birthub-360.
**Complementa (não repete):** RELATORIO-6-TRANSICAO-NUVEM.md (que deixou DB/Redis "não inventariados").

## 0. Estado real dos serviços (medido nesta sessão)

| Serviço | Esperado (config) | Estado real | Evidência |
|---|---|---|---|
| Docker daemon | context `samsung` → tcp://192.168.0.116:2375 | **INDISPONÍVEL** — i/o timeout; contextos `desktop-linux`/`default` (npipe) sem daemon; sem processos Docker | `docker ps -a`, `docker context ls`, `tasklist` |
| PostgreSQL local | localhost:5434 (container pgvector/pgvector:pg17) | **PARADO** — porta 5434 sem LISTENING; sem postgres.exe no host | `netstat -ano` |
| Redis | localhost:6379 (redis:7-alpine) | **PARADO** — sem LISTENING; sem redis-server.exe | `netstat`, `tasklist` |
| Meilisearch | 7700 (.env) / 7701 (.env.test) | **PARADO** | `netstat` |
| MinIO (S3) | 9000/9001 | **PARADO** | `netstat` |
| Qdrant | 6333/6334 | **PARADO** | `netstat` |
| LiteLLM | 4000 | **PARADO** | `netstat` |
| Ollama | 11434 | **PARADO** | `netstat` |
| psql/pg_isready/redis-cli/sqlite3/ffmpeg/java no host | — | **AUSENTES** no Git Bash (só node 22 + python 3.14 no PATH) | `which` |

**Conclusão estrutural:** neste momento NENHUM serviço local está rodando — a máquina está em modo "arquivamento". Todo o estado de dados vive em volumes Docker que hoje são **inacessíveis** (daemon remoto 192.168.0.116:2375 fora do ar; volumes locais do Docker Desktop também inacessíveis sem daemon). Isso eleva a prioridade do backup dos volumes antes de qualquer desligamento.

## 1. Matriz de dependências

Legenda: **[AUTO]** = reconstruível automaticamente (compose/CI/seed) · **[MIGRA]** = exige migração/backup (dados/segredos reais) · **[SO]** = dependência de SO/binário local.

### 1.1 Dados e serviços core

| # | Dependência | Config atual | Origem | Classe | Destino na nuvem |
|---|---|---|---|---|---|
| D1 | PostgreSQL + pgvector | `DATABASE_URL`/`DIRECT_URL` → `localhost:5434/prospectordb` (+`prospectordb_test`) | `docker-compose.postgres-local.yml` (imagem `pgvector/pgvector:pg17`, shm 1gb, roles `prospector`/`prospector_app`/`migrator` via `scripts/db/*.sql`, 163 migrations em `prisma/migrations`) | **[MIGRA]** dados reais + **[AUTO]** schema (migrate deploy reproduz) | Postgres gerenciado (RDS/Cloud SQL/Neon) OU container no host cloud. Decisão pendente |
| D2 | Volume `birthhub_pgdata` | dados dev + possivelmente dados reais de uso local-first | Docker volume local | **[MIGRA] — CRÍTICO** | `pg_dump` antes de desligar; hoje inacessível sem daemon |
| D3 | Redis 7 | `REDIS_URL` → localhost:6379, `REDIS_PASSWORD` set | `docker-compose.yml` (`redis:7-alpine`, requirepass, volume `birthhub_redisdata`) | Filas BullMQ + cache + locks + contadores | Redis gerenciado (ElastiCache/MemoryStore) ou container; volume provavelmente descartável (filas recriáveis), **[MIGRA]** se houver sessões/outbox pendentes |
| D4 | Meilisearch | `MEILI_HOST` 7700 / 7701, `MEILI_MASTER_KEY` set | `docker-compose.yml` (v1.6) | Índice de busca — **reindexável do Postgres** → **[AUTO]** | container/serviço gerenciado; dump de índice opcional |
| D5 | MinIO / object storage | `STORAGE_*`/`MINIO_*` set, bucket `prospector-assets` | `docker-compose.yml` (elestio/minio, volume `birthhub_miniodata`) | **[MIGRA]** — objetos reais (uploads, gravações de áudio do Copiloto IA) | S3/R2/Supabase Storage — abstração `src/lib/storage/index.ts` já é S3-genérica (só troca env) |
| D6 | Qdrant (vetores) | `QDRANT_URL`/`QDRANT_HOST`/`QDRANT_PORT`/`QDRANT_API_KEY` set | `docker-compose.services.yml` + `docker-compose.qdrant.yml` (volume `birthhub_qdrant_data`) | Embeddings/funnel vectors — **recomputável** mas custoso → **[MIGRA]** snapshot ou rebuild | Qdrant Cloud ou container com volume |
| D7 | LiteLLM proxy | `LITELLM_URL` :4000, `LITELLM_KEY`/`LITELLM_MASTER_KEY` set | `docker-compose.yml` + `litellm-config.yaml` | Gateway de LLM — config versionada, chaves em env → **[AUTO]** config / **[MIGRA]** master key | container ou API direta; manter proxy se multi-provider |
| D8 | Ollama | `OLLAMA_HOST` empty | `docker-compose.yml` (volume `birthhub_ollamadata`, GPU opcional) | Modelos locais — **[SO/GPU]** pesado | só se houver GPU; senão provedor externo via LiteLLM |
| D9 | SQLite | — | nenhum `.db`/`.sqlite` nos clones (find maxdepth 3); `better-sqlite3` é apenas peer opcional do Prisma | **N/A — não existe dependência SQLite** | — |

### 1.2 Serviços opcionais/self-hosted (`docker-compose.services.yml` + `docker-compose.opensource.yml`)

Todos **[AUTO]** na definição (compose versionado), **[MIGRA]** apenas se contêm dados de uso real:

| Serviço | Porta | Uso | Dados a migrar? |
|---|---|---|---|
| flowise | — | IA flows | possível (flows salvos) |
| open-webui | — | chat UI | usuários/prompts — provável |
| n8n | — | automações | workflows/credenciais — provável |
| temporal (+ui, admin-tools) | — | workflows duráveis | histórico de workflows |
| superset (+init) | — | BI | dashboards/datasets |
| casdoor | — | SSO/IdP | usuários — provável |
| infisical | — | cofre de segredos | **sim — cofre inteiro** |
| livekit | — | voz/WebRTC | efêmero |
| chatwoot (+secret/webhook) | — | inbox | conversas — provável |
| uptime-kuma | — | monitoramento | config de monitores |
| pocketbase | — | teste | descartável |
| plane-api/frontend | — | PM | projetos — provável |
| faster-whisper | — | STT local (modelos pesados) | cache de modelos — recomputa |
| kokoro-tts | — | TTS local | — |
| langfuse stack (web/worker/clickhouse/minio/otel/tempo/loki/prometheus/grafana/alertmanager) | 3001/3002/9090… | observabilidade+LLM tracing | traces históricas — opcional |
| k6 / zap / trivy (profile tools) | — | carga/segurança em testes | — |

### 1.3 Integrações externas (credenciais em DB/env, não infra local)

| Integração | Como é usada | Classe |
|---|---|---|
| 3CX/SIP | credenciais por-org persistidas no Postgres (`threecx.service.ts`, `list3CXConnections`) — **não é serviço local** | **[MIGRA]** via dump do banco |
| WhatsApp | Meta Cloud API (modelos `WhatsAppMessage` com `providerMessageId`); `baileys.client.ts` é só throttler anti-ban — **sem sessões Baileys em disco** | tokens em env/secrets → **[MIGRA]** para cofre |
| Bitrix24 | webhook/extração batch; storage dir `BITRIX_EXTRACTION_STORAGE_DIR` (filesystem!) | **[MIGRA]** — verificar diretório local de extrações antes de apagar |
| Stripe/Billing, Google, Microsoft, Apollo/Hunter, CNPJ, ElevenLabs, Bland, Groq/Gemini/OpenAI/OpenRouter, Chatwoot, Plane, Postal, Casdoor, Infisical, PostHog, Sentry, Langfuse | env vars (maioria vazia no `.env` atual — ver §3) | **[MIGRA]** para secrets manager |

### 1.4 Dependências de SO / binários

| Item | Evidência | Classe | Mitigação nuvem |
|---|---|---|---|
| Node 22.14.0 (`.node-version`) | engines `>=20` | **[SO]** trivial | devcontainer/nvm no cloud |
| Playwright Chromium + ffmpeg | `%LOCALAPPDATA%\ms-playwright\chromium-1243`, `chromium_headless_shell-1243`, `ffmpeg-1011`, `winldd-1007` | **[SO]** | `npx playwright install --with-deps chromium` no Linux cloud (CI já faz isso — `playwright-ci.yml`) |
| k6.exe hardcoded | `scripts/test/run-k6-ai-voice-stress.mjs:10` → `C:\Program Files\k6\k6.exe` | **[SO] hardcoded** | parametrizar env ou usar service container k6 do compose (profile tools) |
| Chrome.exe hardcoded | `scripts/test-all-routes.cjs:24`, `scripts/capture-screens.mjs:8` → `C:\Program Files\Google\Chrome\...` | **[SO] hardcoded** | já tem fallback `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; remover defaults Windows ou portar |
| Python venv `.venv-opensource` (Schemathesis) | script `test:api-schema` aponta `..\.venv-opensource\Scripts\schemathesis.exe` — **venv não existe no clone D:** | **[SO] Windows-only** | recriar venv no cloud ou rodar em container |
| Caminhos absolutos Windows em scripts | `generate-final-manual-html.cjs:73` (`C:\Github\...`), `capture-screens.mjs:6-8` (`C:\Users\Marks\...`), `generate-forensic-audit-report.cjs`, `build-forensic-audit-html.cjs` (Desktop do usuário) | **[SO] hardcoded** | scripts one-off de relatório — candidatos a arquivamento, não portabilidade |
| Android/iOS nativo | `android/` (Gradle wrapper, fastlane), `ios/`, `capacitor.config.ts` | **[SO]** pesado | CI já tem `android-build.yml`/`ios-build.yml`; cloud builders (EAS/GitHub runners macOS) |
| Certificados/TLS locais | nenhum `.pem/.key/.p12` encontrado nos clones (find maxdepth 4); TLS é Caddy na OCI (aposentada) | **N/A** | ACME no novo edge |
| Caminhos `C:\`/`D:\` em configs versionadas | `.github/workflows` **limpo** (0 matches); `scripts/` tem os casos acima; `capacitor.config.ts` usa `CAPACITOR_SERVER_URL` env (portável) | **[SO] parcial** | ver §2 |

### 1.5 Segredos e configs NÃO versionadas

| Item | Estado | Classe |
|---|---|---|
| `.env` (D:) | 66 chaves preenchidas: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `PII_BLIND_INDEX_KEY`, `MINIO_ROOT_PASSWORD`, `LITELLM_MASTER_KEY`, `QDRANT_API_KEY`, `MEILI_MASTER_KEY`, `LANGFUSE_*` (6 vars), `INFISICAL_*` (3), `APP_DB_PASSWORD`, `MIGRATOR_DB_PASSWORD`, `CLICKHOUSE_PASSWORD`, `SUPERSET_*`, `PLANE_SECRET_KEY`, `OPENWEBUI_SECRET`, `CHATWOOT_*`, `FLOWISE_*`, `PUBLIC_LEAD_IP_HASH_SECRET`… | **[MIGRA] — cofre de segredos** (GitHub Secrets/Infisical cloud/1Password). Nunca commitar |
| `.env.test` (D:) | 4,3 KB, credenciais do banco `prospectordb_test` — guardado por `prepare-integration-env.js` com trava anti-produção | **[AUTO]** — CI já gera; manter fora do Git |
| `docker-compose.override.yml` | não existe nos clones | N/A |
| nginx local | não existe; edge versionado é `Caddyfile.oci` (OCI aposentada) | **[AUTO]** novo edge na nuvem |
| `.env` no clone C: | presumido similar (não auditado em profundidade — mesmo .gitignore) | **[MIGRA]** |

## 2. Serviços necessários para integração e E2E (ambiente de teste)

Mínimo viável (espelha CI — `scripts/test/prepare-integration-env.js` + `ci.yml`):

1. **PostgreSQL 17 + pgvector** com db `prospectordb_test`, extensions (`vector`), roles `prospector_app`/`migrator` — script `scripts/db/bootstrap-app-role.sh` já automatiza; trava `assertTestDatabaseSafety`/`assertE2eTestDatabase` exige sufixo `_test`.
2. **Redis** :6379 (filas BullMQ, locks, cache de teste).
3. **`npx prisma migrate deploy`** via `pretest:integration`/`pretest:e2e` (dotenv `.env.test`).
4. **Playwright Chromium** — instalar no cloud; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` já é override previsto.
5. **Mocks externos**: `msw` (devDependency) para APIs externas; Stripe/Bitrix/WhatsApp usam credenciais de teste via env — nenhum sandbox local dedicado existe hoje.
6. Meilisearch/MinIO/Qdrant: opcionais para E2E (testes de busca/storage podem usar mocks ou subir via compose profile).

## 3. O que já é cloud-ready (descobertas positivas)

- `src/lib/storage/index.ts`: cliente S3 genérico — MinIO/R2/Supabase Storage só por env.
- `prisma.config.ts`: resolve `DIRECT_URL`/pooler Supabase automaticamente.
- CI (`ci.yml`) já sobe Postgres+Redis como service containers — prova de reprodutibilidade em Linux.
- Dockerfiles e compose versionados; `docker:up`/`infra:up`/`load:k6`/`security:*` encapsulados em npm scripts.
- Workflows de deploy existem mas **desabilitados**: `deploy-aws.yml.disabled`, `production.yaml`, `render.yaml` arquivado. Produção hoje é **Local-First** (`docs/deploy/README.md` — Render/Neon/Cloudflare/OCI formalmente desativados). Ou seja: a "transição para nuvem" é um alvo NOVO, não a retomada de um caminho existente.

## 4. Bloqueadores e riscos

1. **Volumes Docker inacessíveis agora** — daemon local e o remoto `192.168.0.116:2375` (context `samsung`) ambos fora. `birthhub_pgdata`, `birthhub_miniodata`, `birthhub_qdrant_data`, `birthhub_redisdata`, `birthhub_ollamadata` podem conter o único exemplar de dados dev/reais. **Sem `pg_dump`/snapshot não há como classificar D2/D5/D6 como descartáveis.**
2. **Segredos só em `.env` local** — 66 chaves; sem cofre, desligar a máquina = perder chaves de produção/staging (ex.: `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY` — perda = dados cifrados irrecuperáveis).
3. **BITRIX_EXTRACTION_STORAGE_DIR** — storage em filesystem local; conteúdo precisa de inventário antes do desligamento.
4. **Paths Windows hardcoded** em scripts de teste/relatório — quebra em runners Linux (mitigável: são scripts auxiliares, não gates de CI).
5. **Produção é Local-First por decisão** — qualquer plano de nuvem precisa de decisão humana de produto (reativar cloud ou criar ambiente cloud apenas de dev/staging).
