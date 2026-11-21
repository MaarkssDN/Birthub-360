# HANDOFF — Devin → 00

**Origem:** Sessão Devin Desktop (CLI agent), workspace `C:\Github\Birthub-360` — continuação do handoff `devin-para-00-continuidade-ambiente-local-docker-20261120.md` (commit `79d93783d`)

**Responsável:** Devin

**Data:** 2026-11-21

**Status:** Bloqueado (ambiente Docker parado; correções de compose regrediram na working tree)

### 1. Missão

Encerramento operacional com handoff de continuidade do trabalho de infraestrutura local (Docker/Postgres/stack de overlays) executado em 2026-11-18/20, agora sob governança do Agente 00.

### 2. O que foi feito (verificação de estado em 2026-11-21)

- Handoff anterior **já commitado**: `.agents/handoffs/devin-para-00-continuidade-ambiente-local-docker-20261120.md` (commit `79d93783d`).
- `.env` local **preservado**: `DATABASE_URL`/`DIRECT_URL` → `localhost:5434`, `LANDING_LEAD_ORGANIZATION_ID=org_admin`, `LITELLM_MASTER_KEY` forte (não versionado, gitignored).
- `docker-compose.yml`: correção `LITELLM_MASTER_KEY` **permanece** na árvore (presente no HEAD).
- **REGRESSÃO DETECTADA**: `docker-compose.services.yml` e `infrastructure/observability/alertmanager.yml` **voltaram ao estado quebrado upstream** — a working tree atual contém novamente `APP_DB_PASSWORD` para superusuário `prospector`, `DB: postgresql`, `LIVEKIT_KEYS` sem espaço, `DATABASE_NAME: ${POSTGRES_DB:-prospectordb}` no Flowise e receiver Slack `${SLACK_WEBHOOK_URL}` no Alertmanager. As correções feitas em 2026-11-18 **não estão no Git** e se perderam num sync/checkout.
- **Docker daemon parado**: `docker ps` falha (erro na API :2375), `localhost:3024` não responde. Containers e volumes persistem no Docker Desktop, mas o engine está desligado (provável reboot da máquina entre sessões).
- Banco `prospectordb` e demais databases (`casdoor`, `n8n`, `superset`, `chatwoot`, `plane`, `infisical`, `flowise`, `langfuse`, `temporal*`) devem estar intactos nos volumes.

### 3. O que falta fazer

1. Subir Docker Desktop e `docker compose ... up -d` — **mas ANTES re-aplicar as correções de compose** (seção 5), senão ~6 serviços voltam a quebrar (auth Postgres, Temporal, LiveKit, Flowise).
2. Re-aplicar e desta vez **commitar** as correções de `docker-compose.services.yml` e `alertmanager.yml` (passam por revisão do Agente 24 por serem arquivos de Agentes 08/10).
3. Plane continua com definição inválida (ver handoff anterior, seção 8).
4. `langfuse-minio-init` continua falhando no download de `mc` (bucket já existe — init é dispensável ou precisa troca para imagem `minio/mc`, mas `minio/mc` retornou "pull access denied" no Docker Hub — investigar mirror/quay).
5. `ollama` sem models — baixar com `docker exec birthhub_ollama ollama pull llama3.1:8b` se LLMs locais forem necessários.

### 4. Arquivos e referências

- Handoff base: `.agents/handoffs/devin-para-00-continuidade-ambiente-local-docker-20261120.md` (commit `79d93783d`) — contém lista completa de correções, comandos e diagnóstico.
- Arquivos que precisam re-aplicar correção: `C:\Github\Birthub-360\docker-compose.services.yml`, `C:\Github\Birthub-360\infrastructure\observability\alertmanager.yml`.
- `.env` (gitignored): `C:\Github\Birthub-360\.env` — valores locais corretos preservados.
- Comandos de retomada e tabela de containers com falha: ver handoff base, seções 7 e 8.

### 5. Decisões importantes

- As correções de compose são **obrigatórias** para o ambiente funcionar; devem ser commitadas (não deixar só no filesystem — já se perderam uma vez).
- Ordem de prioridade para re-subida: corrigir arquivos → `docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.qdrant.yml -f docker-compose.opensource.yml -f docker-compose.services.yml --profile tools up -d` → `npm run dev`.
- `docker-compose.yml` já contém a correção do LiteLLM no HEAD — não re-editar.

### 6. Bloqueios e riscos

- Docker Desktop desligado — não é bloqueio de código, basta iniciar o app.
- Sem as correções, `docker compose up -d` recriará serviços com config quebrada (Flowise voltará a apontar para `prospectordb` e poderá re-poluí-lo — verificar e limpar se acontecer).
- Working tree tem modificações de outras sessões (`docs/orchestration/*` modified, dezenas de handoffs untracked) — não tocar.

### 7. Próximos passos para o Agente 00

1. Iniciar Docker Desktop; confirmar `docker ps` lista os ~35 containers.
2. Re-aplicar as 5 correções em `docker-compose.services.yml` + `alertmanager.yml` (detalhes no handoff base, seção 4).
3. `docker compose ... up -d` e validar endpoints (lista no handoff base).
4. Abrir handoff/revisão para Agente 24 sobre as correções antes de commit em branch própria (`agente/NN-slug`).
5. Decidir Plane (remover vs stack oficial) e `langfuse-minio-init`.

### 8. Orientação ao Agente 00

- O handoff anterior (20261120) continua sendo a fonte de verdade técnica; este arquivo só registra o delta de 2026-11-21: daemon parado + regressão dos arquivos de compose.
- **Não confiar que os containers reflitam os arquivos atuais** — eles foram criados com a config corrigida; os arquivos no disco estão quebrados de novo.
- Credenciais e valores de `.env` não reproduzidos aqui por segurança.
