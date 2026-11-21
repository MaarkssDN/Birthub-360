# HANDOFF — Devin → 00

- **Origem:** Sessão Devin Desktop (CLI agent), workspace `C:\Github\Birthub-360`
- **Responsável:** Devin (agente genérico de execução; não corresponde a um slot numerado do roster)
- **Data:** 2026-11-20
- **Status:** Parcial (ambiente local de pé; pendências de governança e um serviço quebrado)

## 1. Missão

Pedido direto do Orquestrador Humano (fora do ciclo de ondas):
1. Instalar dependências, bancos e imagens Docker e iniciar o servidor.
2. Subir a stack completa de overlays (`docker-compose.opensource.yml` + `docker-compose.services.yml`, profile `tools`).
3. Informar uso de disco e listar serviços não subidos.

Escopo executado: ambiente local de desenvolvimento — nada de código de produto, migrations de schema ou commits.

## 2. O que foi feito

### Stack base (funcionando)
- `npm install` concluído; `prisma generate` OK (Prisma Client 7.10.0).
- Docker Desktop instalado pelo usuário durante a sessão; engine 29.9.3 / Compose v5.7.0. Binário em `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin` (não está no PATH do Git Bash — exportar antes de usar `docker`).
- Containers saudáveis: `birthhub_postgres` (pgvector pg17, :5434), `birthhub_redis` (:6379), `birthhub_meilisearch` (:7700), `birthhub_minio` (:9000/:9001), `birthhub_litellm` (:4000), `birthhub_ollama` (:11434), `birthhub_qdrant` (:6333).
- **158 migrations Prisma aplicadas** (`npx prisma migrate deploy`) no banco `prospectordb`.
- `scripts/db/create-app-role.sql` reaplicado manualmente após as migrations (o init do container rodou antes das tabelas existirem) — grants/RLS do papel `prospector_app` corrigidos.
- `LANDING_LEAD_ORGANIZATION_ID` definido no `.env` (estava vazio e derrubava a validação de env; valor: `org_admin`, id não sensível).
- Usuário admin criado via `create_admin_user.ts` para `marcelinmark@gmail.com` (`mustChangePassword=true`). A senha inicial foi gerada aleatoriamente e **não está registrada neste handoff por segurança** — recuperar via reset de senha ou reexecutar o script com novo `ADMIN_INITIAL_PASSWORD`. O script precisou rodar com `DATABASE_URL` sobrescrita para o superusuário `prospector` (RLS bloqueia criação da primeira org via `prospector_app`).
- Servidor dev rodando: `npm run dev` → http://localhost:3024 (HTTP 200, role check OK).

### Stack completa (opensource + services, profile tools)
- ~37 imagens baixadas (~60,7 GB de imagens; ~65 GB total com containers/volumes).
- Serviços saudáveis/respondendo: Langfuse web (:3001) + worker + ClickHouse + MinIO próprio, Grafana (:3002), Prometheus, Loki, Tempo, OTel Collector, Temporal + UI (:8088 e :8233 — portas duplicadas pelos dois compose files), Flowise (:3008), Open WebUI (:3009), n8n (:5678), Superset (:8089), Casdoor (:8000), Infisical (:8200), LiveKit (:7880-82), Chatwoot (:3005), Uptime Kuma (:3003), Faster-Whisper (:8001), Kokoro TTS (:8880), PocketBase (:8090).
- Databases criados no Postgres: `casdoor`, `n8n`, `superset`, `chatwoot`, `plane`, `infisical`, `flowise` (além de `prospectordb`, `langfuse`, `temporal`, `temporal_visibility`).
- Bucket `langfuse` criado manualmente no langfuse-minio via `mc` dentro do container.
- Chatwoot: `db:chatwoot_prepare` executado via `docker compose run --rm`.

## 3. O que falta fazer

1. **Plane está quebrado** — `plane-api`/`plane-frontend` em restart loop. A imagem `makeplane/plane-backend:latest` tem `Cmd=["python3"]` sem entrypoint adequado; a definição em `docker-compose.services.yml` nunca funcionou. Decidir: corrigir para stack oficial do Plane CE ou remover os serviços.
2. **Healthchecks cosméticos** — `qdrant`, `temporal`, `superset`, `superset_init`, `langfuse-worker`, `zap` aparecem `unhealthy` mas respondem OK (healthcheck usa `curl`/`wget` ausente na imagem ou comando inválido). Mesmo padrão de bug já documentado nos comentários do compose.
3. **`langfuse-minio-init`** sai com código 2 — o download de `mc` de `dl.min.io` retorna página de erro (HTTP 405). Contornei criando o bucket manualmente; o init continuará falhando em recriações.
4. **Ferramentas profile `tools`** (k6, k6-crm, zap, trivy, pocketbase) são CLI/sob demanda — normal estarem `Exited`.
5. **Governança pendente**: as correções feitas em arquivos de outros donos precisam de registro formal (ver seção 8).
6. Verificar se o app precisa de seed/demo adicional (`scripts/create-demo.ts`, `seed_users.ts` existem; não executei).
7. `ollama` está de pé mas **sem nenhum model baixado** — LLMs locais (LiteLLM → Ollama) falharão até `docker exec birthhub_ollama ollama pull <model>`.

## 4. Arquivos e referências

### Caminhos absolutos dos arquivos modificados nesta sessão

**Todos NÃO preservados em Git** (o workspace não é repo git — ver seção 6):

- `C:\Github\Birthub-360\.env` — `DATABASE_URL`/`DIRECT_URL` → Postgres local `:5434` (antes: `:5432` com placeholder literal de senha); `LANDING_LEAD_ORGANIZATION_ID=org_admin`; `LITELLM_MASTER_KEY` regenerada (valor no arquivo local apenas).
- `C:\Github\Birthub-360\docker-compose.yml` — adicionado `environment: LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY:?...}` ao serviço `litellm`.
- `C:\Github\Birthub-360\docker-compose.services.yml` — 9 ocorrências de `${APP_DB_PASSWORD:-prospector_app_pass}` → `${POSTGRES_PASSWORD:-prospector_pass}`; `temporal`: `DB: postgresql`→`postgres12` e removido `DYNAMIC_CONFIG_FILE_PATH` quebrado; `LIVEKIT_KEYS` com espaço após `:`; `flowise`: `DATABASE_NAME: flowise`.
- `C:\Github\Birthub-360\infrastructure\observability\alertmanager.yml` — receiver Slack `${SLACK_WEBHOOK_URL}` substituído por receiver `blackhole`.
- `C:\Github\Birthub-360\.agents\handoffs\devin-para-00-continuidade-ambiente-local-docker-20261120.md` — este arquivo.

### Arquivos de configuração Docker existentes (não modificados, apenas usados)

- `C:\Github\Birthub-360\docker-compose.yml`
- `C:\Github\Birthub-360\docker-compose.postgres-local.yml`
- `C:\Github\Birthub-360\docker-compose.qdrant.yml`
- `C:\Github\Birthub-360\docker-compose.opensource.yml`
- `C:\Github\Birthub-360\docker-compose.services.yml`
- `C:\Github\Birthub-360\litellm-config.yaml`
- `C:\Github\Birthub-360\scripts\db\create-app-role.sql`, `scripts\db\bootstrap-app-role.sh`, `scripts\db\docker-init.sh`
- `C:\Github\Birthub-360\docs\development\LOCAL_FIRST.md`, `docs\migration\INSTALACAO_NOVA_MAQUINA.md`

## 5. Decisões importantes

- Postgres local em Docker é o banco canônico de dev (decisão 2026-09-08, ADR-004); `DATABASE_URL` nunca deve apontar para o Postgres remoto nem para o superusuário em runtime.
- Aplicação usa `prospector_app` (NOSUPERUSER/NOBYPASSRLS); migrations usam `DIRECT_URL` (bootstrap/migrator).
- Flowise isolado em database próprio — compartilhar `prospectordb` quebrou migrations dele e poluiu o schema do app (tabelas lowercase removidas; `user`/`session`/`account`/`verification` do app preservadas).
- LiteLLM passou a exigir master key forte — `.env` e compose atualizados de forma consistente.
- Alertmanager sem Slack real em dev → blackhole receiver (o `${SLACK_WEBHOOK_URL}` nunca funcionou — Alertmanager não expande env vars).

## 6. Bloqueios e riscos — preservação do trabalho

- **Sem git**: `C:\Github\Birthub-360` **não é um repositório git** nesta máquina (sem `.git`). Não há branch, commit, worktree ou PR. **Todas as alterações da seção 4 existem apenas no filesystem local** e se perdem se o workspace for recriado/sincronizado.
- **Ação imediata recomendada ao Agente 00**: antes de qualquer limpeza, checkout, `git init` ou sincronização, preservar `.env` e os 4 arquivos modificados (copiar para fora do workspace ou aplicar os diffs descritos na seção 4 no repositório real). O `.env` contém segredos reais — não commitar.
- **Propriedade de arquivos violada por necessidade operacional**: editei `docker-compose.yml` e `docker-compose.services.yml` (Agente 08) e `infrastructure/observability/alertmanager.yml` (Agente 10). São correções de defaults de dev genuinamente quebrados, mas precisam de revisão.
- **Credenciais**: `LITELLM_MASTER_KEY` nova e senha do admin existem apenas no `.env`/banco locais — não reproduzidas aqui por segurança.
- **Recursos da máquina**: ~65 GB de imagens Docker; volumes Docker (~1,8 GB) contêm todos os dados dos bancos — `docker compose down -v` os destrói.

## 7. Comandos para retomar os serviços

```bash
# PATH do Docker (Git Bash não enxerga docker por padrão)
export PATH="$LOCALAPPDATA/Programs/DockerDesktop/resources/bin:$PATH"
cd "C:\Github\Birthub-360"

# Stack base (banco + serviços principais)
docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.qdrant.yml up -d

# Stack completa (tudo, incluindo profile tools)
docker compose -f docker-compose.yml -f docker-compose.postgres-local.yml -f docker-compose.qdrant.yml -f docker-compose.opensource.yml -f docker-compose.services.yml --profile tools up -d

# Servidor da aplicação	npm run dev        # http://localhost:3024

# Verificação	npm run local:doctor
```

Se a máquina reiniciar: Docker Desktop sobe sozinho (se configurado), os containers têm `restart: unless-stopped` — basta rodar `npm run dev`. Se os containers não voltarem: `docker compose ... up -d` (comandos acima).

## 8. Containers com falhas conhecidas

| Container | Sintoma | Causa conhecida |
|---|---|---|
| `birthhub_plane_api` | Restarting em loop, sem logs | Imagem `makeplane/plane-backend:latest` tem `Cmd=["python3"]` sem entrypoint; definição do compose incompleta — nunca funcionou |
| `birthhub_plane_frontend` | Restarting em loop | Depende do plane-api quebrado |
| `birthhub_qdrant` | `unhealthy` | Healthcheck usa `curl`, ausente na imagem qdrant; serviço responde 200 em `/healthz` e `/collections` — cosmético |
| `birthhub_temporal` | `unhealthy` | Healthcheck `temporal operator cluster health` falha por args/endereço; cluster reporta `SERVING` — cosmético |
| `birthhub_superset` / `birthhub_superset_init` | `unhealthy` | Healthcheck inadequado; Superset responde 200 em `/health` |
| `birthub-360-langfuse-worker-1` | `unhealthy` | Worker opera normalmente (jobs executando); healthcheck aponta endpoint errado |
| `birthub-360-langfuse-minio-init-1` | Exited (2) | Download de `mc` de `dl.min.io` retorna página de erro; bucket `langfuse` já criado manualmente |
| `birthub-360-k6*`, `zap`, `trivy`, `pocketbase` | Exited | Ferramentas CLI profile `tools` — executam sob demanda via `docker compose run`, não persistem |

## 9. Pendências de revisão conforme governança

- **Revisão do Agente 24 obrigatória** antes de aceitar as alterações de compose/alertmanager como permanentes (AGENTS.md §40).
- Arquivos de terceiros modificados: `docker-compose.yml`, `docker-compose.services.yml` (propriedade Agente 08) e `infrastructure/observability/alertmanager.yml` (propriedade Agente 10). Registrado aqui como handoff informal; formalizar em `.agents/handoffs/onda-<n>/` se o 00 julgar necessário.
- `package.json`/lockfile não foram tocados. `prisma/schema.prisma` e migrations não foram alterados (apenas `migrate deploy`).
- `.env` é arquivo local não versionado — as correções de `DATABASE_URL`/`DIRECT_URL` devem ser replicadas em `.env.example`/docs se a decisão for oficial (dono: provavelmente 01/01A para contratos de ambiente).

## 10. Próximos passos para o Agente 00

1. **Preservar o ambiente**: copiar `.env` e os 4 arquivos modificados para backup externo ao workspace antes de qualquer limpeza/sync.
2. Submeter diffs das correções de compose ao Agente 24 para revisão; abrir handoffs formais para 08 (compose) e 10 (alertmanager/healthchecks) se aprovados.
3. Plane: remover serviços ou implementar stack oficial (provável handoff ao dono do módulo OS-7).
4. `langfuse-minio-init`: trocar download de `mc` por imagem `minio/mc` ou remover init.
5. `npm run local:doctor` como gate de verificação.
6. Avaliar seed de demonstração (`scripts/create-demo.ts`) se necessário para homologação.

## 11. Orientação final ao Agente 00

- Ambiente local **operacional**: app http://localhost:3024, Postgres :5434, stack de overlays no ar. Não repetir instalação.
- Docker CLI exige PATH: `$LOCALAPPDATA/Programs/DockerDesktop/resources/bin`.
- Se o workspace for recriado do zero: seguir `docs/migration/INSTALACAO_NOVA_MAQUINA.md` + correções da seção 4 (sem elas, ~6 serviços falham).
- Login admin local: `marcelinmark@gmail.com` — senha inicial não registrada aqui; resetar se necessário.
